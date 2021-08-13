import { SakuraCommand } from '#structures'
import type { SakuraCommandOptions } from '#types'
import { addCommas, replyWithInfoEmbed } from '#utils'
import { ApplyOptions } from '@sapphire/decorators'
import type { Args } from '@sapphire/framework'
import type { Message } from 'discord.js'

@ApplyOptions<SakuraCommandOptions>({
    description: 'Checks Discord API latency',
    requiredClientPermissions: ['EMBED_LINKS'],
    usage: ['ping']
})
export class PingCommand extends SakuraCommand {
    public async run(message: Message, args: Args) {
        if (!args.finished) 
            return

        const sent = await replyWithInfoEmbed(message, 'Pong!')
        const ping = sent.createdTimestamp - message.createdTimestamp
        const description = [
            `🔂 **RTT**: ${ addCommas(ping) } ms`,
            `💟 **Heartbeat**: ${ addCommas(Math.round(this.container.client.ws.ping)) } ms`
        ].join('\n')

        sent.embeds[0].description = description

        await sent.edit({ content: null, embeds: sent.embeds })
    }
}