import type { PrismaClient, SakuraInvite } from '@prisma/client'
import { Collection } from 'discord.js'
import type { Invite } from 'discord.js'

export class Invites {
    #prisma: PrismaClient
    #invites: Collection<bigint, Collection<string, SakuraInvite>> = new Collection()

    public constructor(prisma: PrismaClient) {
        this.#prisma = prisma
    }
    
    public async init() {
        const guildIds = await this.#prisma.sakuraInvite.findMany({ distinct: ['guildId'], select: { guildId: true } })
        const invites = await this.#prisma.sakuraInvite.findMany()

        for (const { guildId } of guildIds)
            this.#invites.set(guildId, new Collection())

        for (const invite of invites)
            this.#invites.get(invite.guildId).set(invite.code, invite)
    }

    public async add(guildId: bigint, invite: string | Invite) {
        if (!this.#invites.has(guildId))
            this.#invites.set(guildId, new Collection())

        const code = (typeof invite === 'string') ? invite : invite.code

        if (this.#invites.get(guildId)?.has(code))
            return

        const sakuraInvite = await this.#prisma.sakuraInvite.create({
            data: {
                guildId,
                code,
                expiresAt: (typeof invite === 'string') ? null : invite.expiresAt,
                isPermanent: (typeof invite === 'string') ? false : (invite.expiresTimestamp === 0),
                isValid: (typeof invite === 'string') ? false : true
            }
        })

        this.#invites.get(guildId).set(code, sakuraInvite)
    }

    public get(guildId: bigint, code: string): SakuraInvite {
        return this.#invites.get(guildId)?.get(code)
    }

    public has(guildId: bigint, code: string) {
        return this.#invites.get(guildId)?.has(code)
    }
}