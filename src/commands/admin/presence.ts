import { SakuraCommand } from '#structures'
import type { SakuraCommandOptions } from '#types'
import { replyWithButtonPages, replyWithInfoEmbed } from '#utils'
import type { Presence } from '@prisma/client'
import { ApplyOptions } from '@sapphire/decorators'
import type { Args } from '@sapphire/framework'
import type { ClientPresenceStatus, Message } from 'discord.js'

@ApplyOptions<SakuraCommandOptions>({
    description: 'Modifies the bot\'s presence list',
    examples: ['presence add "Watching over lost souls"', 'presence add "Listening to your heart" dnd', 'presence remove 1', 'presence remove 1 4 9'],
    requiredClientPermissions: ['EMBED_LINKS'],
    subCommands: ['add', 'remove', 'show'],
    usage: ['presence add <activity> [status]', 'presence remove <presenceId>'],
})
export class PresenceCommand extends SakuraCommand {
    public async add(message: Message, args: Args) {
        if (args.finished)
            return this.missing('No activity provided')

        const activity = await args.pick('string')
        const isValidActivity = ['competing', 'listening to', 'playing', 'watching'].some(start => activity.toLowerCase().startsWith(start))

        if (!isValidActivity) {
            await replyWithInfoEmbed(message, 'Activity must start with either **Competing in**, **Listening to**, **Playing** or **Watching**.')
            
            return
        }

        const status = await args.pick('string').catch(() => 'online') 
        const isValidStatus = ['dnd', 'idle', 'online'].includes(status.toLowerCase())

        if (!isValidStatus) {
            await replyWithInfoEmbed(message, 'Status must be either **dnd**, **idle** or **online**.')
            
            return
        }

        const presence = await this.container.client.presences.add({ status: status.toLowerCase() as ClientPresenceStatus, ...this.formatActivity(activity) })
        await replyWithInfoEmbed(message, `Added presence #${ presence.id }.`)
    }

    public async remove(message: Message, args: Args) {
        if (args.finished)
            return this.missing('No "presenceId" provided')

        const { client } = this.container
        const presences = client.presences.cache

        if (!presences.size) {
            await replyWithInfoEmbed(message, `${ client.user.username } has no added presences.`)
            
            return
        }

        const presenceId = await args.rest('integer').catch(() => 0)

        if (presenceId <= 0) {
            await replyWithInfoEmbed(message, 'Invalid "presenceId" provided.')
            
            return
        }
        if (!presences.has(presenceId)) {
            await replyWithInfoEmbed(message, 'No presence found.')
            
            return
        }

        const presence = await client.presences.remove(presenceId)
        await replyWithInfoEmbed(message, `Removed presence #${ presence.id }.`)
    }

    public async show(message: Message, args: Args) {
        if (!args.finished)
            return

        const { client } = this.container
        const presences = [...client.presences.cache.values()]

        if (!presences.length) {
            await replyWithInfoEmbed(message, `${ client.user.username } has no added presences.`)
            
            return
        }

        await replyWithButtonPages(message, presences, 10, this.formatItem)
    }

    private formatActivity(activity: string): { name: string, type: 'COMPETING' | 'LISTENING' | 'PLAYING' | 'WATCHING' } {
        const activityLowered = activity.toLowerCase()

        if (activityLowered.startsWith('competing in'))
            return { name: activity.substring(12).trim(), type: 'COMPETING' }
        else if (activityLowered.startsWith('listening to'))
            return { name: activity.substring(12).trim(), type: 'LISTENING' }
        else if (activityLowered.startsWith('playing'))
            return { name: activity.substring(7).trim(), type: 'PLAYING' }
        else
            return { name: activity.substring(8).trim(), type: 'WATCHING' }
    }

    private formatItem({ id, status, name, type }: Presence) {
        let activity: string

        if (type === 'COMPETING')
            activity = `Competing in ${ name }`
        else if (type === 'LISTENING')
            activity = `Listening to ${ name }`
        else if (type === 'PLAYING')
            activity = `Playing ${ name }`
        else
            activity = `Watching ${ name }`

        return { inline: false, name: `Presence #${ id }`, value: [`Activity - ${ activity }`, `Status - ${ status }`].join('\n' ) }
    }
}