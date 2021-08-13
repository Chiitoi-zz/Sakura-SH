import { SakuraCommand } from '#structures'
import type { SakuraCommandOptions } from '#types'
import { replyWithInfoEmbed } from '#utils'
import { ApplyOptions } from '@sapphire/decorators'
import type { Args } from '@sapphire/framework'
import type { Message } from 'discord.js'

@ApplyOptions<SakuraCommandOptions>({
    description: 'Displays information on how to use the bot.',
    requiredClientPermissions: ['EMBED_LINKS'],
    usage: ['guide']
})
export class GuideCommand extends SakuraCommand {
    public async run(message: Message, args: Args) {
        if (!args.finished)
            return

        const prefix = this.container.client.settings.getPrefix(BigInt(message.guild.id))
        const description = [
            `- Set an invite check channel (where your results will go) using \`${ prefix }set checkchannel <newsChannel|textChannel>\`.`,
            `- Add categories (using IDs) with \`${ prefix }category add <categoryId>\`.`,
            `- Add channels to ignore (using IDs) with \`${ prefix }ignore add <categoryId>\`.`,
            `- Run  \`${ prefix }check\` in your check channel and wait for the invite check to complete`,
            `- Invite check complete!`
        ].join('\n')

        await replyWithInfoEmbed(message, description)
    }
}