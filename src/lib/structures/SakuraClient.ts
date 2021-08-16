import { TOKEN } from '#config'
import { Invites, Presences, Settings } from '#structures'
import Prisma from '@prisma/client'
import { SapphireClient } from '@sapphire/framework'
import { container } from '@sapphire/pieces'
import { Intents } from 'discord.js'
import type { Message } from 'discord.js'
import PQueue from 'p-queue'

export class SakuraClient extends SapphireClient {
    public constructor() {
        super({
            allowedMentions: { repliedUser: false },
            fetchPrefix: (message: Message) => container.settings.getPrefix(BigInt(message.guild.id)),
            intents: [
                Intents.FLAGS.GUILDS,
                Intents.FLAGS.GUILD_MESSAGES
            ],
            loadDefaultErrorListeners: false
        })
    }

    public async setupContainer() {
        const prisma = new Prisma.PrismaClient()

        container.invites = new Invites(prisma)
        container.queue = new PQueue({ autoStart: true, concurrency: 1, interval: 1250, intervalCap: 1 })
        container.presences = new Presences(prisma)
        container.runningInviteCheck = false
        container.settings = new Settings(prisma)

        await container.invites.init()
        await container.presences.init()
        await container.settings.init()
    }

    public async start() {
        await this.setupContainer()
        return super.login(TOKEN)
    }
}