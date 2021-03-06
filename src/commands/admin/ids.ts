import { SakuraCommand } from '#structures'
import type { SakuraCommandOptions } from '#types'
import { replyWithSelectPages } from '#utils'
import { ApplyOptions } from '@sapphire/decorators'
import type { GuildBasedChannelTypes } from '@sapphire/discord.js-utilities'
import type { Args } from '@sapphire/framework'
import { container } from '@sapphire/pieces'
import type { CategoryChannel, Guild, Message, MessageEmbed } from 'discord.js'

@ApplyOptions<SakuraCommandOptions>({
    description: 'Displays a server\'s category IDs',
    requiredClientPermissions: ['EMBED_LINKS'],
    usage: ['ids']
})
export class IdsCommand extends SakuraCommand {
    public async run(message: Message, args: Args) {
        if (!args.finished)
            return

            await replyWithSelectPages(message, this.getIdsEmbed)
    }

    private getIdsEmbed(guild: Guild): Partial<MessageEmbed> {
        const isCategoryChannel = (channel: GuildBasedChannelTypes): channel is CategoryChannel => channel.type === 'GUILD_CATEGORY'
        const guildCategoryChannels = guild.channels.cache.filter(isCategoryChannel)
        const guildName = guild.name
        const embed: Partial<MessageEmbed> = {
            color: container.settings.getInfoEmbedColor(BigInt(guild.id)),
            description: guildCategoryChannels.size
                ? guildCategoryChannels
                    .sort((c1, c2) => c1.position - c2.position)
                    .map(category => `**${ category.id }** - \`${ category.name }\``).join('\n')
                : 'No categories in server',
            title: `${ guildName }${ guildName.toLowerCase().endsWith('s') ? '\'' : '\'s' } categories`
        }

        return embed
    }
}