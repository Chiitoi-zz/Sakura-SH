import { replyWithInfoEmbed } from '#utils'
import { ApplyOptions } from '@sapphire/decorators'
import { Events, Listener } from '@sapphire/framework'
import type { CommandErrorPayload, ListenerOptions } from '@sapphire/framework'

@ApplyOptions<ListenerOptions>({ event: Events.CommandError })
export class SakuraListener extends Listener {
    public async run(error: Error, { message }: CommandErrorPayload) {
        await replyWithInfoEmbed(message, error.message)
    }
}