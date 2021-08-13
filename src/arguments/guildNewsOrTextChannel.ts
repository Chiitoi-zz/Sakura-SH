import { ApplyOptions } from '@sapphire/decorators'
import { ExtendedArgument } from '@sapphire/framework'
import type { ExtendedArgumentContext, ExtendedArgumentOptions } from '@sapphire/framework'
import type { GuildChannel, NewsChannel, TextChannel } from 'discord.js'

@ApplyOptions<ExtendedArgumentOptions<'guildChannel'>>({ baseArgument: 'guildChannel' })
export class SakuraArgument extends ExtendedArgument<'guildChannel', NewsChannel | TextChannel> {
    public handle(channel: GuildChannel, context: ExtendedArgumentContext) {
        return this.isNewsOrTextChannel(channel)
            ? this.ok(channel)
            : this.error({ context, message: 'No announcement or text channel found.', parameter: context.parameter })
    }

    private isNewsOrTextChannel(channel: GuildChannel): channel is NewsChannel | TextChannel {
        return ['GUILD_NEWS', 'GUILD_TEXT'].includes(channel.type)
    }
}