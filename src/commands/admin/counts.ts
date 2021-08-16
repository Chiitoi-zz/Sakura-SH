import { SakuraCommand } from '#structures'
import type { SakuraCommandOptions } from '#types'
import { replyWithSelectPages } from '#utils'
import { ApplyOptions } from '@sapphire/decorators'
import type { Args } from '@sapphire/framework'
import type { CategoryChannel, Guild, GuildChannel, Message, MessageEmbed, ThreadChannel } from 'discord.js'

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
        const guildId = BigInt(guild.id)
        const { categoryIds, ignoreIds, infoEmbedColor } = this.container.settings.get(guildId)
        const embed: Partial<MessageEmbed> = { color: infoEmbedColor, title: `Channel counts for "${ guild.name }"` }

        if (!categoryIds.length)
            embed.description = 'No added categories in this server'
        else {
            const guildChannels = guild.channels.cache
            const isCheckCategoryChannel = (channel: GuildChannel | ThreadChannel): channel is CategoryChannel => categoryIds.includes(BigInt(channel.id)) && channel.type === 'GUILD_CATEGORY'
            const checkCategoryChannels = guildChannels.filter(isCheckCategoryChannel).sort((c1, c2) => c1.position - c2.position)
            
            embed.description = checkCategoryChannels.map(({ children, name }) => {
                let ignoreCount = 0, newsCount = 0, textCount = 0
    
                for (const { id, type } of children.values()) {
                    if (ignoreIds.includes(BigInt(id)))
                        ignoreCount++
                    if (type === 'GUILD_NEWS')
                        newsCount++
                    if (type === 'GUILD_TEXT')
                        textCount++
                }
    
                return `**Category: ** ${ name }\n**Count: ${ newsCount + textCount - ignoreCount }** channels (**${ newsCount }** announcement and **${ textCount }** text), with **${ ignoreCount }** ignored`
            }).join('\n')
        }

        return embed
    }
}