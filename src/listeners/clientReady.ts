  
import { mod, processCategory } from '#utils'
import { ApplyOptions } from '@sapphire/decorators'
import type { ListenerOptions } from '@sapphire/framework'
import { Events, Listener } from '@sapphire/framework'
import type { CategoryChannel, PresenceData } from 'discord.js'

@ApplyOptions<ListenerOptions>({ event: Events.ClientReady, once: true })
export class SakuraListener extends Listener {
    public async run() {
        const { client } = this.container
        let presenceIndex = 0

        for (const guild of client.guilds.cache.values()) {
            const guildId = BigInt(guild.id)
            const uncheckedCategoryIds = await client.settings.getUncheckedCategoryIds(guildId)

            await client.settings.addGuild(guildId)

            for (const uncheckedCategoryId of uncheckedCategoryIds) {
                const uncheckedCategory = guild.channels.cache.get(uncheckedCategoryId.toString()) as CategoryChannel

                await processCategory(client, uncheckedCategory)
            }
        }

        setInterval(() => {
            const presences = [...client.presences.cache.values()]

            if (!presences.length)
                return client.user.setPresence({ status: 'online' })                

            const { name, status, type } = presences[presenceIndex]
            const data = { status, activities: [{ name, type }] } as PresenceData
            client.user.setPresence(data)

            presenceIndex = mod(presenceIndex + 1, presences.length)
        }, 60000)

        console.log(`${ client.user.tag } is online!`)
    }
}