import { Precondition } from '@sapphire/framework'
import type { Message } from 'discord.js'
import { Permissions } from 'discord.js'

export class AdministratorPrecondition extends Precondition {
    public async run(message: Message) {
        return message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)
            ? this.ok()
            : this.error()
    }
}