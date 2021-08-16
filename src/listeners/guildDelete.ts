import { ApplyOptions } from '@sapphire/decorators'
import { Events, Listener } from '@sapphire/framework'
import type { ListenerOptions } from '@sapphire/framework'
import type { Guild } from 'discord.js'

@ApplyOptions<ListenerOptions>({ event: Events.GuildDelete })
export class SakuraListener extends Listener {
    public async run(guild: Guild) {
        await this.container.settings.removeGuild(BigInt(guild.id))
    }
}