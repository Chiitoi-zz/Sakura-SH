import { ApplyOptions } from '@sapphire/decorators'
import { Events, Listener } from '@sapphire/framework'
import type { ListenerOptions } from '@sapphire/framework'
import type { Guild } from 'discord.js'

@ApplyOptions<ListenerOptions>({ event: Events.GuildCreate })
export class SakuraListener extends Listener {
    public async run(guild: Guild) {
        await this.container.client.settings.addGuild(BigInt(guild.id))
    }
}