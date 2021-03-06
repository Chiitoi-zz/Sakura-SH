import { ApplyOptions } from '@sapphire/decorators'
import type { GuildBasedChannelTypes } from '@sapphire/discord.js-utilities'
import { ExtendedArgument } from '@sapphire/framework'
import type { ExtendedArgumentContext, ExtendedArgumentOptions } from '@sapphire/framework'
import type { NewsChannel, TextChannel } from 'discord.js'

@ApplyOptions<ExtendedArgumentOptions<'guildChannel'>>({ baseArgument: 'guildChannel' })
export class SakuraArgument extends ExtendedArgument<'guildChannel', NewsChannel | TextChannel> {
    public handle(channel: GuildBasedChannelTypes, context: ExtendedArgumentContext) {
        return this.isNewsOrTextChannel(channel)
            ? this.ok(channel)
            : this.error({ context, message: 'No announcement or text channel found.', parameter: context.parameter })
    }

    private isNewsOrTextChannel(channel: GuildBasedChannelTypes): channel is NewsChannel | TextChannel {
        return ['GUILD_NEWS', 'GUILD_TEXT'].includes(channel.type)
    }
}