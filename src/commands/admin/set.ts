import { SakuraCommand } from '#structures'
import type { SakuraCommandOptions } from '#types'
import { replyWithInfoEmbed } from '#utils'
import { ApplyOptions } from '@sapphire/decorators'
import type { Args } from '@sapphire/framework'
import type { Message } from 'discord.js'

@ApplyOptions<SakuraCommandOptions>({
    description: 'Modifies various server settings',
    examples: ['set checkchannel #invites', 'set checkcolor #ABCDEF', 'set infocolor FFB7C5', 'set prefix $'],
    requiredClientPermissions: ['EMBED_LINKS'],
    subCommands: [
        { input: 'additionalrole', output: 'additionalRole' },
        { input: 'checkchannel', output: 'checkChannel' },
        { input: 'checkcolor', output: 'checkColor' },
        { input: 'infocolor', output: 'infoColor' },
        'prefix'
    ],
    usage: [
        'set additionalrole <role>',
        'set checkchannel <newsChannel|textChannel>',
        'set checkcolor <hexCode>',
        'set infocolor <hexCode>',
        'set prefix <prefix>'
    ]
})
export class SetCommand extends SakuraCommand {
    public async additionalRole(message: Message, args: Args) {
        const { client } = this.container
        const guildId = BigInt(message.guildId)

        if (args.finished) {
            await client.settings.updateGuild(guildId, { additionalRoleId: null })
            await replyWithInfoEmbed(message, 'Cleared the additional role. Only administrators may use the bot now.')

            return
        }

        const role = await args.rest('role')

        if (!role)
            await replyWithInfoEmbed(message, 'No role found.')
        else {
            const botName = client.user.username
            const botText = `${ botName }${ botName.toLowerCase().endsWith('s') ? '\'' : '\'s' } commands`

            await client.settings.updateGuild(BigInt(message.guildId), { additionalRoleId: BigInt(role.id) })
            await replyWithInfoEmbed(message, `Users with the ${ role } role may now use ${ botText }.`)
        }
    }

    public async checkChannel(message: Message, args: Args) {
        const { client } = this.container
        const guildId = BigInt(message.guildId)

        if (args.finished) {
            await client.settings.updateGuild(guildId, { checkChannelId: null })
            await replyWithInfoEmbed(message, 'Cleared the check channel. Please set a check channel in order to run invite checks.')

            return
        }

        const channel = await args.rest('guildNewsOrTextChannel')

        await this.container.client.settings.updateGuild(BigInt(message.guildId), { checkChannelId: BigInt(channel.id) })
        await replyWithInfoEmbed(message, `Check channel set to ${ channel }.`)
    }

    public async checkColor(message: Message, args: Args) {
        await this.handleColorArgument(message, args, 'CHECK')
    }

    public async infoColor(message: Message, args: Args) {
        await this.handleColorArgument(message, args, 'INFO')
    }

    public async prefix(message: Message, args: Args) {
        if (args.finished)
            return this.missing('No prefix provided.')

        const prefix = await args.rest('string')
        const reDigit = /^[0-9]/
        const reSpecial = /[~`!@#\$%\^&*()-_\+={}\[\]|\\\/:;"'<>,.?]/g
        const reSpaces = /\s/
        const valid = !reDigit.test(prefix) && reSpecial.test(prefix) && !reSpaces.test(prefix) && (prefix.length <= 3)

        if (!valid)
            await replyWithInfoEmbed(message, 'Provided prefix must not contain spaces, have at least one special character, and be a maximum of three characters.')
        else {
            await this.container.client.settings.updateGuild(BigInt(message.guildId), { prefix })
            await replyWithInfoEmbed(message, `Prefix set to \`${ prefix }\``)
        }
    }

    private async handleColorArgument(message: Message, args: Args, option: 'CHECK' | 'INFO') {
        if (args.finished)
            return this.missing('No hex code provided.')

        const hexCode = await args.rest('hexCode')
        const color = parseInt(hexCode, 16)
        const data = (option === 'CHECK')
            ? { checkEmbedColor: color }
            : { infoEmbedColor: color }
        const optionCased = `${ option.charAt(0) }${ option.slice(1).toLowerCase() }`

        await this.container.client.settings.updateGuild(BigInt(message.guild.id), data)
        await replyWithInfoEmbed(message, `${ optionCased } embed color set to **#${ hexCode }**.`)
    }
}