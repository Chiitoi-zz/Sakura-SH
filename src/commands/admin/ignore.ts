import { SakuraCommand } from '#structures'
import type { SakuraCommandOptions } from '#types'
import { replyWithInfoEmbed } from '#utils'
import { ApplyOptions } from '@sapphire/decorators'
import type { Args } from '@sapphire/framework'
import type { Message } from 'discord.js'

@ApplyOptions<SakuraCommandOptions>({
    description: 'Modifies a server\'s ignore list',
    examples: ['ignore add #bot-commands', 'ignore remove #test'],
    requiredClientPermissions: ['EMBED_LINKS'],
    subCommands: ['add', 'remove'],
    usage: ['ignore <add|remove> [categoryChannel]']
})
export class IgnoreCommand extends SakuraCommand {
    public async add(message: Message, args: Args) {
        const { guildId, channelId, inList } = await this.handleIgnoreArgument(message, args) || {}

        if (inList)
            await replyWithInfoEmbed(message, `"<#${ channelId }>" is already ignored.`)
        else {
            await this.container.settings.addIgnoreId(guildId, channelId)
            await replyWithInfoEmbed(message, `${ this.container.client.user.username } will now ignore "<#${ channelId }>" during the next invite check.`)
        }
    }

    public async remove(message: Message, args: Args) {
        const { guildId, channelId, inList } = await this.handleIgnoreArgument(message, args) || {}
        
        if (!inList)
            await replyWithInfoEmbed(message, `"<#${ channelId }>" is not in the list of ignored channels.`)
        else {
            await this.container.settings.removeIgnoreId(guildId, channelId)
            await replyWithInfoEmbed(message, `${ this.container.client.user.username } will no longer ignore "<#${ channelId }>".`)
        }
    }

    private async handleIgnoreArgument(message: Message, args: Args) {
        if (args.finished)
            return this.missing('No channel provided.')

        const channel = await args.rest('guildNewsOrTextChannel')

        if (!channel) {
            await replyWithInfoEmbed(message, 'No channel found.')

            return
        }

        const guildId = BigInt(message.guildId)          
        const channelId = BigInt(channel.id)
        const inList = this.container.settings.getIgnoreIds(guildId).includes(channelId)

        return { guildId, channelId, inList }
    }
}