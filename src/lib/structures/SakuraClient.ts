import { TOKEN } from '#config'
import { Invites, Presences, Settings } from '#structures'
import Prisma from '@prisma/client'
import { SapphireClient } from '@sapphire/framework'
import { Intents } from 'discord.js'
import type { Message } from 'discord.js'
import PQueue from 'p-queue'

export class SakuraClient extends SapphireClient {
    public queue = new PQueue({ autoStart: true, concurrency: 1, interval: 1250, intervalCap: 1 })
    public runningInviteCheck = false

    public constructor() {
        super({
            allowedMentions: { repliedUser: false },
            fetchPrefix: (message: Message) => this.settings.getPrefix(BigInt(message.guild.id)),
            intents: [
                Intents.FLAGS.GUILDS,
                Intents.FLAGS.GUILD_MESSAGES
            ],
            loadDefaultErrorListeners: false
        })

        const prisma = new Prisma.PrismaClient()

        this.invites = new Invites(prisma)
        this.presences = new Presences(prisma)
        this.settings = new Settings(prisma)
    }

    public async start() {
        await this.presences.init()
        await this.settings.init()
        return super.login(TOKEN)
    }
}