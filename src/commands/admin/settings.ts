import { SakuraCommand } from '#structures'
import type { SakuraCommandOptions } from '#types'
import { replyWithSelectPages } from '#utils'
import { ApplyOptions } from '@sapphire/decorators'
import type { Args } from '@sapphire/framework'
import type { Guild, Message, MessageEmbed } from 'discord.js'

@ApplyOptions<SakuraCommandOptions>({
    description: 'Displays a server\'s bot settings',
    requiredClientPermissions: ['EMBED_LINKS'],
    usage: ['settings']
})
export class SettingsCommand extends SakuraCommand {
    public async run(message: Message, args: Args) {
        if (!args.finished)
            return

        await replyWithSelectPages(message, this.getSettingsEmbed)
    }

    private getSettingsEmbed(guild: Guild): Partial<MessageEmbed> {
        const guildId = BigInt(guild.id)
        const { additionalRoleId, categoryIds, checkChannelId, checkEmbedColor, ignoreIds, infoEmbedColor, prefix } = this.container.settings.get(guildId)
        const guildChannels = guild.channels.cache
        const formatChannelList = (list: bigint[], type: 'CATEGORY' | 'IGNORE') => list
            .map(channelId => {
                const channel = guildChannels.get(channelId.toString())

                return `- ${ channel ? channel.name : `${ type === 'CATEGORY' ? 'Category' : 'Channel'} ID \`${ channelId.toString() }\` no longer exists` }`
            })
            .join('\n')
        const embed: Partial<MessageEmbed> = {
            color: infoEmbedColor,
            fields: [
                { inline: false, name: 'Prefix', value: `\`${ prefix }\`` },
                { inline: false, name: 'Check channel', value: checkChannelId ? `<#${ checkChannelId.toString() }>` : 'No channel set' },
                {
                    inline: false,
                    name: 'Colors',
                    value: [
                        `**Check:** #${ checkEmbedColor.toString(16).toUpperCase() }`,
                        `**Info:** #${ infoEmbedColor.toString(16).toUpperCase() }`
                    ].join('\n')
                },
                { inline: false, name: 'Additional role', value: additionalRoleId ? `<#${ additionalRoleId.toString() }>` : 'No additional role set.' },
                { inline: false, name: 'Categories', value: categoryIds.length ? formatChannelList(categoryIds, 'CATEGORY') : 'No categories added.' },
                { inline: false, name: 'Ignored channels', value: ignoreIds.length ? formatChannelList(ignoreIds, 'IGNORE') : 'No channels ignored.' }
            ],
            title: `Settings for "${ guild.name }"`
        }

        return embed
    }
}