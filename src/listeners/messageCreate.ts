import { PRIORITY } from '#constants'
import { processMessage } from '#utils'
import { ApplyOptions } from '@sapphire/decorators'
import { Events, Listener } from '@sapphire/framework'
import type { ListenerOptions } from '@sapphire/framework'
import { NewsChannel, TextChannel } from 'discord.js'
import type { Message } from 'discord.js'

@ApplyOptions<ListenerOptions>({ event: Events.MessageCreate })
export class SakuraListener extends Listener {
    public async run(message: Message) {
        const { channel, guild } = message

        if (!guild)
            return
        if (!((channel instanceof NewsChannel) || (channel instanceof TextChannel)))
            return

        const guildId = BigInt(guild.id)
        const categoryIds = this.container.client.settings.getCategoryIds(guildId)
        const categoryId = BigInt(channel?.parentId ?? 0)

        if (!categoryIds.includes(categoryId))
            return

        await processMessage(message, PRIORITY.MESSAGE)
    }
}