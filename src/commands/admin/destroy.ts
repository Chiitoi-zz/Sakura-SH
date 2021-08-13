import { SakuraCommand } from '#structures'
import type { SakuraCommandOptions } from '#types'
import { replyWithInfoEmbed } from '#utils'
import { ApplyOptions } from '@sapphire/decorators'
import type { Args } from '@sapphire/framework'
import type { Message } from 'discord.js'

@ApplyOptions<SakuraCommandOptions>({
    description: 'Shuts down bot',
    requiredClientPermissions: ['EMBED_LINKS'],
    usage: ['destroy']
})
export class DestroyCommand extends SakuraCommand {
    public async run(message: Message, args: Args) {
        if (!args.finished)
            return

        const { client } = this.container

        await replyWithInfoEmbed(message, `Shutting down ${ client.user.username }`)
        client.destroy()
        process.exit(0)
    }
}