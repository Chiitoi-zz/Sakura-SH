import { ApplyOptions } from '@sapphire/decorators'
import { Events, Listener } from '@sapphire/framework'
import type { ListenerOptions } from '@sapphire/framework'
import type { Role } from 'discord.js'

@ApplyOptions<ListenerOptions>({ event: Events.GuildRoleDelete })
export class SakuraListener extends Listener {
    public async run(role: Role) {
        const { settings } = this.container
        const guildId = BigInt(role.guild.id)
        const additionalRole = settings.getAdditionalRole(guildId)

        if (!additionalRole)
            return
            
        const roleId = BigInt(role.id)

        if (additionalRole !== roleId)
            return
        
        await settings.updateGuild(guildId, { additionalRoleId: null })
    }
}