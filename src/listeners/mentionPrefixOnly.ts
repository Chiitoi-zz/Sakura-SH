import { replyWithInfoEmbed } from '#utils'
import { ApplyOptions } from '@sapphire/decorators'
import type { ListenerOptions } from '@sapphire/framework'
import { Events, Listener } from '@sapphire/framework'
import type { Message } from 'discord.js'

@ApplyOptions<ListenerOptions>({ event: Events.MentionPrefixOnly })
export class VanessaListener extends Listener {
    public async run(message: Message) {
        if (!message.guild)
            return

        const prefix = this.container.client.settings.getPrefix(BigInt(message.guild.id))
        await replyWithInfoEmbed(message, `Current prefix is \`${ prefix }\``)
    }
}