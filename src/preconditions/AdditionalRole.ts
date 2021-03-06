import { Precondition } from '@sapphire/framework'
import type { Message } from 'discord.js'

export class AdditionalRolePrecondition extends Precondition {
    public async run({ guildId, member }: Message) {
        const additionalRole = this.container.settings.getAdditionalRole(BigInt(guildId))

        return (!additionalRole || member.roles.cache.has(additionalRole?.toString()))
            ? this.ok()
            : this.error()
    }
}