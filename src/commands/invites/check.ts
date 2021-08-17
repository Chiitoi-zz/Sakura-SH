import { PRIORITY } from '#constants'
import { SakuraCommand } from '#structures'
import type { CategoryCounts, CheckCounts, SakuraCommandOptions } from '#types'
import { processMessage, replyWithInfoEmbed } from '#utils'
import { ApplyOptions } from '@sapphire/decorators'
import type { Args } from '@sapphire/framework'
import { Collection } from 'discord.js'
import type { CategoryChannel, GuildChannel, Message, MessageEmbed, NewsChannel, TextChannel, ThreadChannel } from 'discord.js'
import prettyMilliseconds from 'pretty-ms'
import { hrtime } from 'process'

@ApplyOptions<SakuraCommandOptions>({
    description: 'Runs an invite check on added categories',
    requiredClientPermissions: ['EMBED_LINKS'],
    usage: ['check']
})
export class CheckCommand extends SakuraCommand {
    public async run(message: Message, args: Args) {
        if (!args.finished)
            return

        const { settings } = this.container
        const guildId = BigInt(message.guildId)
        const isCheckingCategories = await settings.isCheckingCategories(guildId)
        const { categoryIds, checkChannelId, ignoreIds } = settings.get(guildId)

        if (isCheckingCategories) {
            await replyWithInfoEmbed(message, 'This guild currently is currently checking categories. Please wait until all categories are checked before running an invite check.')
            return
        }
        if (this.container.runningInviteCheck) {
            await replyWithInfoEmbed(message, 'There is already an invite check in progress. Please wait until the current one is complete before running an invite check.')
            return
        }
        if (!categoryIds.length) {
            await replyWithInfoEmbed(message, 'There are no (added) categories to check. Please add some before running an invite check.')
            return 
        }
        if (!checkChannelId) {
            await replyWithInfoEmbed(message, 'No check channel has been set. Please set one before running an invite check.')
            return 
        }
        if (BigInt(message.channelId) !== checkChannelId) {
            await replyWithInfoEmbed(message, `This command may only be run in <#${ checkChannelId.toString() }>.`)
            return 
        }

        await this.sendStartEmbed(message)

        const timerStart = hrtime.bigint()

        this.container.runningInviteCheck = true

        const checkCounts: CheckCounts = { categories: [], elapsedTime: 0n }
        const guildChannels = message.guild.channels.cache
        const shouldCheckCategory = (channel: GuildChannel | ThreadChannel): channel is CategoryChannel => categoryIds.includes(BigInt(channel.id)) && channel.type === 'GUILD_CATEGORY'
        const categories = guildChannels
            .filter(shouldCheckCategory)
            .sort((c1, c2) => c1.position - c2.position)
        const shouldCheckChannel = (channel: GuildChannel): channel is NewsChannel | TextChannel => !ignoreIds.includes(BigInt(channel.id)) && ['GUILD_NEWS', 'GUILD_TEXT'].includes(channel.type)
        
        for (const { children, name } of categories.values()) {
            const categoryCounts: CategoryCounts = { channels: [], issues: 0, manual: [], name }
            const channels = children
                .filter(shouldCheckChannel)
                .sort((c1, c2) => c1.position - c2.position)
            

            if (!channels.size) {
                await this.sendCategoryEmbed(message, categoryCounts)
                continue
            }

            for (const channel of channels.values()) {
                if (!channel) {
                    categoryCounts.issues++
                    continue
                }
                
                const channelId = channel.id
                let totalBad = 0, totalGood = 0

                if (!channel.lastMessageId) {
                    categoryCounts.channels.push({ bad: totalBad, channelId, good: totalGood })
                    continue
                }

                const messages = await channel.messages.fetch({ limit: 8 }).catch(() => new Collection<string, Message>())

                if (!messages.size) {
                    categoryCounts.manual.push(channelId)
                    continue
                }
    
                for (const message of messages.values()) {
                    const { bad, good } = await processMessage(message, PRIORITY.INVITE_CHECK)

                    totalBad += bad
                    totalGood += good
                }

                categoryCounts.channels.push({ bad: totalBad, channelId, good: totalGood })
            }

            checkCounts.categories.push(categoryCounts)
            await this.sendCategoryEmbed(message, categoryCounts)            
        }

        this.container.runningInviteCheck = false

        const timerEnd = hrtime.bigint()
        const elapsedTime = timerEnd - timerStart
        checkCounts.elapsedTime = elapsedTime

        await this.sendCompleteEmbed(message)
        await this.sendResultsEmbed(message, checkCounts) 
    }



    private sendCategoryEmbed(message: Message, { channels, issues, manual, name }: CategoryCounts) {
        const guildId = BigInt(message.guildId)
        const color = this.container.settings.getCheckEmbedColor(guildId)
        const embed: Partial<MessageEmbed> = {
            color,
            footer: { text: `Checked ${ channels.length ? 8 : 0 } messages` },
            timestamp: Number(new Date),
            title: `The "${ name }" category` }

        embed.description = (channels.length)
            ? channels.map(({ bad, channelId, good }) => `<#${ channelId }> - **${ bad + good }** total (**${ bad }** bad, **${ good }** good)`).join('\n')
            : 'No channels to check in this category.'
        
        if (issues) {
            embed.fields ??= []
            embed.fields.push({ inline: false, name: 'Issues', value: `- ${ issues } channel(s) could not be checked.` })
        }
        if (manual.length) {
            embed.fields ??= []
            embed.fields.push({ inline: false, name: 'Manual check(s) required', value: manual.map(channelId => `- <#${ channelId }>`).join('\n') })
        }
    
        return message.channel.send({ embeds: [embed] })
    }

    private sendCompleteEmbed(message: Message) {
        const guildId = BigInt(message.guildId)
        const color = this.container.settings.getCheckEmbedColor(guildId)
        const embed: Partial<MessageEmbed> = { color, description: 'Invite check complete!' }

        return message.channel.send({ embeds: [embed] })
    }

    private sendResultsEmbed(message: Message, { categories, elapsedTime }: CheckCounts) {
        let totalBad = 0, totalChannels = 0, totalGood = 0

        for (const { channels, issues, manual } of categories) {
            totalChannels += channels.length + issues + manual.length

            for (const { bad, good } of channels) {
                totalBad += bad
                totalGood += good
            }
        }

        const totalInvites = totalBad + totalGood
        const guildId = BigInt(message.guildId)
        const color = this.container.settings.getCheckEmbedColor(guildId)
        const embed: Partial<MessageEmbed> = {
            color,
            fields: [
                { inline: false, name: 'Elapsed time', value: prettyMilliseconds(Number(elapsedTime / BigInt(1e6))) },
                {
                    inline: false,
                    name: 'Stats',
                    value: [
                        `- **${ totalChannels }** channels checked`,
                        `- **${ totalInvites }** invites checked`,
                        `- **${ totalBad }** (${ (100 * totalBad / totalInvites).toFixed(2) }%) invalid invites`,
                        `- **${ totalGood }** (${ (100 * totalGood / totalInvites).toFixed(2) }%) valid invites`                        
                    ].join('\n')
                }
            ],
            timestamp: Number(new Date),
            title: 'Invite check results'
        }

        return message.channel.send({ embeds: [embed] })
    }

    private sendStartEmbed(message: Message) {
        const guildId = BigInt(message.guildId)
        const color = this.container.settings.getCheckEmbedColor(guildId)
        const embed: Partial<MessageEmbed> = { color, description: `${ message.client.user.username } is checking your invites now!` }

        return message.channel.send({ embeds: [embed] })
    }
}