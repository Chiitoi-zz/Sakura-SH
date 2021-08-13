import type { Invites, Presences, Settings } from '#structures'
import type { NewsChannel, TextChannel } from 'discord.js'
import type PQueue from 'p-queue'

declare module 'discord.js' {
    interface Client {
        invites: Invites
        presences: Presences
        queue: PQueue
        runningInviteCheck: boolean
        settings: Settings
    }
}

declare module '@sapphire/framework' {
    interface ArgType {
        guildNewsOrTextChannel: NewsChannel | TextChannel
        hexCode: string
        prefix: string
    }

    interface Command {
        category: string
        examples?: string[]
        usage?: string[]
    }

    interface Preconditions {
        AdditionalRole: never
        Administrator: never
    }
}