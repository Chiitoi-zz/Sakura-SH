import { SakuraCommand } from '#structures'
import type { SakuraCommandOptions } from '#types'
import { ApplyOptions } from '@sapphire/decorators'
import type { Args } from '@sapphire/framework'
import type { Message } from 'discord.js'

@ApplyOptions<SakuraCommandOptions>({
    description: 'Displays the invite link for the support server',
    requiredClientPermissions: ['SEND_MESSAGES'],
    usage: ['support']
})
export class SupportCommand extends SakuraCommand {
    public async run(message: Message, args: Args) {
        if (!args.finished) 
            return

        await message.reply({ content: 'Join the support server for Sakura! - https://discord.gg/wtZurTFJdH' })
    }
}