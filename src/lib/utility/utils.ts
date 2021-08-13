import { DiscordInviteRegex, PRIORITY } from '#constants'
import type { SapphireClient } from '@sapphire/framework'
import { Invite, NewsChannel, TextChannel } from 'discord.js'
import type { CategoryChannel, EmbedField, Guild, Interaction, Message, MessageActionRowOptions, MessageButtonOptions, MessageEmbed, MessageEmbedFooter, MessageSelectMenuOptions, SelectMenuInteraction } from 'discord.js'

export const addCommas = (num: number) => num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')

export const mod = (a: number, n: number) => ((a % n) + n) % n

export const processCategory = async (client: SapphireClient, category: CategoryChannel) => {
    for (const channel of category.children.values()) {
        if (!channel)
            continue
        if (!((channel instanceof NewsChannel) || (channel instanceof TextChannel)))
            continue

        const messages = await channel.messages.fetch({ limit: 8 })

        if (!messages.size)
            continue

        for (const message of messages.values())
            await processMessage(message, PRIORITY.CATEGORY)
    }

    await client.settings.updateCategory(BigInt(category.guildId), BigInt(category.id))
}

export const processCode = async (client: SapphireClient, guildId: bigint, code: string, priority: PRIORITY) => {
    const result: Invite = await client.queue.add(() => {
        return client
            .fetchInvite(code)
            .catch(error => error)
    }, { priority })

    if (result instanceof Invite) {
        await client.invites.add(guildId, result)
        return result
    } else {
        await client.invites.add(guildId, code)
        return null
    }
}

export const processMessage = async (message: Message, priority: PRIORITY) => {
    const now = new Date
    const { client, content, guild } = message
    const guildId = BigInt(guild.id)
    const codes = [...content.matchAll(DiscordInviteRegex)].map(match => match[1])

    let bad = 0, good = 0

    if (!codes.length)
        return { bad, good }

    for (const code of codes) {
        const invite = client.invites.get([guildId, code]) || await processCode(client, guildId, code, priority)
        const valid = (invite instanceof Invite)
            ? (invite?.expiresAt < now)
            : (invite.isPermanent || (invite.expiresAt < now))

        valid ? good++ : bad++
    }

    return { bad, good }
}

export const replyWithCheckEmbed = async (message: Message, description: string) => {
    const guildId = BigInt(message.guildId)
    const color = message.client.settings.getCheckEmbedColor(guildId)
    const embed: Partial<MessageEmbed> = { color, description }

    return message.reply({ embeds: [embed] })
}

export const replyWithInfoEmbed = async (message: Message, description: string) => {
    const guildId = BigInt(message.guildId)
    const color = message.client.settings.getInfoEmbedColor(guildId)
    const embed: Partial<MessageEmbed> = { color, description }

    return message.reply({ embeds: [embed] })
}

export const replyWithHelpEmbed = async (message: Message, description: string, fields?: EmbedField[], footer?: MessageEmbedFooter, title?: string) => {
    const guildId = BigInt(message.guildId)
    const color = message.client.settings.getInfoEmbedColor(guildId)
    const embed: Partial<MessageEmbed> = { color, description }

    if (fields.length)
        embed.fields = fields
    if (footer)
        embed.footer = footer
    if (title)
        embed.title = title
    
    return message.reply({ embeds: [embed] })
}

export const replyWithButtonPages = async <T>(message: Message, items: T[], itemsPerPage: number, itemFunction: (item: T) => EmbedField) => {
    const color = message.client.settings.getInfoEmbedColor(BigInt(message.guildId))
    const pages: Partial<MessageEmbed>[] = Array
        .from({ length: Math.ceil(items.length / itemsPerPage) }, (_, i) => items.slice(itemsPerPage * i, itemsPerPage * (i + 1)))
        .map((itemChunk, i, chunks) => ({
            color,
            fields: itemChunk.map(itemFunction),
            footer: { text: `Page ${ i + 1 } of ${ Math.min(chunks.length, 25) }` }
        }))

    if (pages.length === 1)
        await message.reply({ embeds: [pages[0]] })
    else {
        let currentPage = 0

        const previousButton: MessageButtonOptions = { customId: 'previous', emoji: '⬅️', style: 'PRIMARY', type: 'BUTTON' }
        const nextButton: MessageButtonOptions = { customId: 'next', emoji: '➡️', style: 'PRIMARY', type: 'BUTTON' }
        const row: MessageActionRowOptions = { components: [previousButton, nextButton], type: 'ACTION_ROW' }
        const reply = await message.reply({ components: [row], embeds: [pages[currentPage]] })
        const filter = (interaction: Interaction) => interaction.user.id === message.author.id
        const collector = reply.createMessageComponentCollector({ componentType: 'BUTTON', dispose: true, filter, time: 20000 })

        collector.on('collect', async interaction => {
            if (!interaction.isButton())
                return
            if (interaction.customId === 'previous')
                currentPage = mod(currentPage - 1, pages.length)
            if (interaction.customId === 'next')
                currentPage = mod(currentPage + 1, pages.length)
            
            await interaction.update({ components: [row], embeds: [pages[currentPage]] })
        })
        collector.on('end', async () => {
            await reply.edit({ components: [], embeds: [pages[currentPage]] })
        })
    }
}

export const replyWithSelectPages = async(message: Message, embedFunction: (guild: Guild) => Partial<MessageEmbed>) => {
    const guilds = message.client.guilds.cache

    if (guilds.size === 1) {
        const embed = embedFunction(message.guild)
        await message.reply({ embeds: [embed] })
    } else {
        const guildSelectMenu: MessageSelectMenuOptions = {
            customId: 'guildSelectMenu',
            options: guilds.map(guild => ({ label: guild.name, value: guild.id })),
            placeholder: 'Select server...',
            type: 'SELECT_MENU'
        }
        const row: MessageActionRowOptions = { components: [guildSelectMenu], type: 'ACTION_ROW' }
        const counts = await message.reply({ components: [row], content: String.fromCharCode(8203) })
        const filter = (interaction: Interaction) => interaction.user.id === message.author.id
        const collector = counts.createMessageComponentCollector({ componentType: 'SELECT_MENU', dispose: true, filter, time: 20000 })

        collector.on('collect', async interaction => {
            if (!interaction.isSelectMenu())
                return
            
            const embed = embedFunction(guilds.get(interaction.values[0]))
            await interaction.update({ components: [row], embeds: [embed] })
        })
        collector.on('end', async interactions => {
            const guildId = (interactions.last() as SelectMenuInteraction)?.values[0]
            const embed = guildId
                ? embedFunction(guilds.get(guildId))
                : { color: 0xF8F8FF, description: 'No server selected' }

            await counts.edit({ components: [], embeds: [embed] })
        })
    }    
}