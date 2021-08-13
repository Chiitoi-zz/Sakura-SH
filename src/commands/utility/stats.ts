import { SakuraCommand } from '#structures'
import type { SakuraCommandOptions } from '#types'
import { addCommas, replyWithInfoEmbed } from '#utils'
import { ApplyOptions } from '@sapphire/decorators'
import type { Args } from '@sapphire/framework'
import type { Message } from 'discord.js'
import { readFile } from 'fs/promises'
import { dirname, join } from 'path'
import pms from 'pretty-ms'
import { fileURLToPath } from 'url'

@ApplyOptions<SakuraCommandOptions>({
    description: 'Displays bot information',
    requiredClientPermissions: ['EMBED_LINKS'],
    usage: ['stats']
})
export class StatsCommand extends SakuraCommand {
    public async run(message: Message, args: Args) {
        if (!args.finished) 
            return

        const { client } = this.container
        const __filename = fileURLToPath(import.meta.url)
        const __dirname = dirname(__filename)
        const { version } = JSON.parse(await readFile(join(__dirname, '..', '..', '..', 'package.json'), 'utf-8'))
        const description = [
            `**Guild(s):** ${ addCommas(client.guilds.cache.size) }`,
            `**Uptime:** ${ pms(client.uptime ?? 0, { secondsDecimalDigits: 0 }) }`,
            `**Version:** v${ version }`

        ].join('\n')

        await replyWithInfoEmbed(message, description)
    }
}