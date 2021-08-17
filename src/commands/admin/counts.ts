import { SakuraCommand } from '#structures'
import type { SakuraCommandOptions } from '#types'
import { replyWithSelectPages } from '#utils'
import { ApplyOptions } from '@sapphire/decorators'
import type { Args } from '@sapphire/framework'
import { container } from '@sapphire/pieces'
import type { CategoryChannel, Collection, Guild, GuildChannel, Message, MessageEmbed, ThreadChannel } from 'discord.js'

@ApplyOptions<SakuraCommandOptions>({
    description: 'Displays a server\'s channel counts (by category)',
    requiredClientPermissions: ['EMBED_LINKS'],
    usage: ['counts']
})
export class CountsCommand extends SakuraCommand {
    public async run(message: Message, args: Args) {
        if (!args.finished)
            return

        await replyWithSelectPages(message, this.getCountsEmbed)
    }

    private getCountsEmbed(guild: Guild): Partial<MessageEmbed> {
        const chosenGuildId = BigInt(guild.id)
        const chosenGuildCategoryDescriptions: string[] = []
        const embed: Partial<MessageEmbed> = { color: container.settings.getInfoEmbedColor(chosenGuildId), title: `Channel counts for "${ guild.name }"` }        
        let totalIgnoreCount = 0, totalNewsCount = 0, totalTextCount = 0
        
        for (const guild of container.client.guilds.cache.values()) {
            const guildId = BigInt(guild.id)
            const { categoryIds, ignoreIds } = container.settings.get(guildId)

            if (!categoryIds.length)
                continue

            const guildCategoryChannels = guild.channels.cache.filter(channel => categoryIds.includes(BigInt(channel.id)) && channel.type === 'GUILD_CATEGORY') as Collection<string, CategoryChannel>
            let categoryIgnoreCount = 0, categoryNewsCount = 0, categoryTextCount = 0

            for (const { children, name } of guildCategoryChannels.values()) {
                for (const { id, type } of children.values()) {
                    if (ignoreIds.includes(BigInt(id)))
                        categoryIgnoreCount++
                    if (type === 'GUILD_NEWS')
                        categoryNewsCount++
                    if (type === 'GUILD_TEXT')
                        categoryTextCount++
                }

                totalIgnoreCount += categoryIgnoreCount
                totalNewsCount += categoryNewsCount
                totalTextCount += categoryTextCount

                if (guildId === chosenGuildId)
                    chosenGuildCategoryDescriptions.push(`**Category:** ${ name }\n**Count: ${ categoryNewsCount + categoryTextCount - categoryIgnoreCount }** channels (**${ categoryNewsCount }** announcement and **${ categoryTextCount }** text), with **${ categoryIgnoreCount }** ignored\n`)
            }              
        }

        embed.description = chosenGuildCategoryDescriptions.length
            ? chosenGuildCategoryDescriptions.join('\n')
            : 'No added categories in this server.'
        embed.footer = { text: `${ totalNewsCount + totalTextCount - totalIgnoreCount } total channels (${ totalNewsCount } announcement and ${ totalTextCount } text channels, with ${ totalIgnoreCount } ignored)` }       

        return embed
    }
}