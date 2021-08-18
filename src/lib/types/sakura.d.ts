import { QUERY } from '#constants'
import type { Setting } from '@prisma/client'
import type { Command } from '@sapphire/framework'
import type { SubCommandPluginCommand } from '@sapphire/plugin-subcommands'
import type { ActivityType, Collection, ClientPresenceStatus } from 'discord.js'

export interface CategoryCounts {
    channels: ChannelCounts[],
    issues: number,
    manual: string[],
    name: string
}

export interface ChannelCounts { bad: number, channelId: string, good: number }

export type CheckCounts = { categories: CategoryCounts[], elapsedTime: bigint }

export type GuildSetting = Setting & {
    categoryIds: bigint[]
    ignoreIds: bigint[]
}

export type QueryResult =
    | { result: Command, type: QUERY.COMMAND }
    | { result: Collection<string, Command>, type: QUERY.CATEGORY }
    | { result: Collection<string, Collection<string, Command>>, type: QUERY.EVERYTHING }

export interface SakuraConfig {
    token: string
}

export type SakuraCommandOptions = SubCommandPluginCommand.Options & {
    examples?: string[]
    usage?: string[]
}

export type SakuraPresence = {
    type: Exclude<ActivityType, 'CUSTOM' | 'STREAMING'>
    name: string,
    status: ClientPresenceStatus
}