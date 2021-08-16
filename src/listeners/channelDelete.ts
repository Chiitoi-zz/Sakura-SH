import { ApplyOptions } from '@sapphire/decorators'
import { Events, Listener } from '@sapphire/framework'
import type { ListenerOptions } from '@sapphire/framework'
import { NewsChannel, TextChannel } from 'discord.js'
import type { DMChannel, GuildChannel } from 'discord.js'

@ApplyOptions<ListenerOptions>({ event: Events.ChannelDelete })
export class SakuraListener extends Listener {
    public async run(channel: DMChannel | GuildChannel) {
        if (!((channel instanceof NewsChannel) || (channel instanceof TextChannel)))
            return

        await this.container.settings.removeChannel(channel)
    }
}