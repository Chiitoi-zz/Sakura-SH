import type { Invites, Presences, Settings } from '#structures'
import type { NewsChannel, TextChannel } from 'discord.js'
import type PQueue from 'p-queue'

declare module '@sapphire/framework' {
    interface ArgType {
        guildNewsOrTextChannel: NewsChannel | TextChannel
        hexCode: string
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

declare module '@sapphire/pieces' {
    interface Container {
        invites: Invites
        presences: Presences
        queue: PQueue
        runningInviteCheck: boolean
        settings: Settings
    }
}