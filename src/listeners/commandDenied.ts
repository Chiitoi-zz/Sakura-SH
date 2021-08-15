import { ApplyOptions } from '@sapphire/decorators'
import { Events, Listener } from '@sapphire/framework'
import type { CommandDeniedPayload, ListenerOptions, UserError } from '@sapphire/framework'

@ApplyOptions<ListenerOptions>({ event: Events.CommandDenied })
export class SakuraListener extends Listener {
    public async run(error: UserError, { message }: CommandDeniedPayload) {       
        return
    }
}