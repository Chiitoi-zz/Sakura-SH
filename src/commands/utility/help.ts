import { QUERY } from '#constants'
import { SakuraCommand } from '#structures'
import type { QueryResult, SakuraCommandOptions } from '#types'
import { ApplyOptions } from '@sapphire/decorators'
import type { Args, Command, CommandStore } from '@sapphire/framework'
import { Collection } from 'discord.js'
import type { EmbedField, MessageEmbed, MessageEmbedFooter, Message } from 'discord.js'

@ApplyOptions<SakuraCommandOptions>({
    aliases: ['h'],
    description: 'Displays all available commands, including information about a specific command or category',
    examples: ['help ping', 'help presence'],
    requiredClientPermissions: ['EMBED_LINKS'],
    usage: ['help [query]']
})
export class HelpCommand extends SakuraCommand {
    public async run(message: Message, args: Args) {
        const prefix = this.container.settings.getPrefix(BigInt(message.guild.id)) 
        const query = this.processQuery((await args.restResult('string'))?.value)

        let description = '', fields: EmbedField[] = [], footer: MessageEmbedFooter = {}, title = ''

        if (!query)
            return this.missing('No result found.')
        else if (query.type === QUERY.COMMAND) {
            const { aliases, category, description, examples, name, strategy, usage } = query.result

            fields = [
                { inline: false, name: 'Category', value: category },
                { inline: false, name: 'Description', value: description },
                { inline: false, name: 'Usage', value: usage.map(item => `\`${ prefix }${ item }\``).join('\n') }
            ]
            footer = { text: 'Optional - [] | Required - <>' }
            title = `The "${ prefix }${ name }" command`

            if (aliases.length)
                fields.push({ inline: false, name: 'Aliases', value: aliases.map(alias => `\`${ prefix }${ alias }\``).join('\n') })
            if ((strategy as any)?.flags?.length)
                fields.push({ inline: false, name: 'Flags', value: (strategy as any).flags.map(flag => `\`--${ flag }\``).join('\n') })
            if ((strategy as any)?.options?.length)
                fields.push({ inline: false, name: 'Options', value: (strategy as any).options.map(option => `\`--${ option }=\``).join('\n') })
            if (examples.length)
                fields.push({ inline: false, name: 'Examples', value: examples.map(example => `\`${ prefix }${ example }\``).join('\n') })
        } else if (query.type === QUERY.CATEGORY) {
            const { result } = query
            const name = result.first().category

            description = query.result.map(({ description = '', name }) => `\u2022 \`${ prefix }${ name }\` - ${ description }`).join('\n')
            title = `The "${ name.charAt(0).toUpperCase() }${ name.slice(1) }" category`
        } else {
            const botName = this.container.client.user.username

            fields = [...query.result.entries()].map(([categoryName, commands]) => ({
                inline: false,
                name: categoryName,
                value: commands.map(({ description, name }) => `\u2022 \`${ prefix }${ name }\` - ${ description }`).join('\n')
            }))
            title = `${ botName }${ botName.toLowerCase().endsWith('s') ? '\'' : '\'s' } commands`
        }

        await this.replyWithHelpEmbed(message, description, fields, footer, title)
    }

    private formatCommands(commands: CommandStore) {
        const categoryNames = [...commands.map(({ category }) => category)].sort()
        const categories = new Collection<string, Collection<string, Command>>()

        for (const categoryName of categoryNames)
            categories.set(categoryName, new Collection<string, Command>())

        for (const command of commands.values())
            categories.get(command.category).set(command.name, command)

        for (const [_, category] of categories) {
            category.sort((a, b) => a.name.localeCompare(b.name))
        }

        return categories
    }

    private processQuery(query: string): QueryResult {
        const commands = this.container.stores.get('commands')
        const categories = this.formatCommands(commands)

        if (!query)
            return { result: categories, type: QUERY.EVERYTHING }

        const category = categories.get(`${ query.charAt(0).toUpperCase() }${ query.slice(1) }`)

        if (category)
            return { result: category, type: QUERY.CATEGORY }

        const command = commands.find(({ aliases, name }) => (name.toLowerCase() === query) || aliases.some(alias => alias.toLowerCase() === query))

        if (command)
            return { result: command, type: QUERY.COMMAND }
    }

    private replyWithHelpEmbed(message: Message, description: string, fields?: EmbedField[], footer?: MessageEmbedFooter, title?: string) {
        const guildId = BigInt(message.guildId)
        const color = this.container.settings.getInfoEmbedColor(guildId)
        const embed: Partial<MessageEmbed> = { color, description }
    
        if (fields.length)
            embed.fields = fields
        if (footer)
            embed.footer = footer
        if (title)
            embed.title = title
        
        return message.reply({ embeds: [embed] })
    }
}