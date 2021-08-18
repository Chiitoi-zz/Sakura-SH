import type { SakuraCommandOptions } from '#types'
import { Args, Identifiers, UserError } from '@sapphire/framework'
import type { CommandContext, PieceContext } from '@sapphire/framework'
import { SubCommandPluginCommand } from '@sapphire/plugin-subcommands'
import type { Message } from 'discord.js'
import { sep } from 'path'

export abstract class SakuraCommand extends SubCommandPluginCommand<Args, SakuraCommand> {
    public readonly category: string
    public readonly examples: string[]
    public readonly usage: string[]

    protected constructor(context: PieceContext, options: SakuraCommandOptions) {
        options.preconditions = ['Administrator', 'AdditionalRole']
        options.runIn = ['GUILD_NEWS', 'GUILD_TEXT']

        super(context, options)

        const parts = context.path.split(sep)
        const cat = parts[parts.length - 2]

        this.category = `${ cat.charAt(0).toUpperCase() }${ cat.slice(1) }`
        this.examples = options.examples ?? []
        this.usage = options.usage ?? []
    }

    protected missing(message: string) {
        throw new UserError({ identifier: Identifiers.ArgsMissing, message })
    }

    public async run(message: Message, args: Args, context: CommandContext) {
        const result = await this.subCommands.run({ message, args, context, command: this })

        if (this.subCommands && (result as any)?.error)
            throw new UserError({ identifier: Identifiers.SubCommandNoMatch, message: args.finished ? 'No subcommand provided.' : 'Invalid subcommand.' })
    }
}