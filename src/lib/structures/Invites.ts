import type { PrismaClient, SakuraInvite } from '@prisma/client'
import { Collection } from 'discord.js'
import type { Invite } from 'discord.js'

export class Invites {
    #prisma: PrismaClient
    #invites: Collection<[bigint, string], SakuraInvite> = new Collection()

    public constructor(prisma: PrismaClient) {
        this.#prisma = prisma
    }
    
    public async init() {
        const invites = await this.#prisma.sakuraInvite.findMany()

        for (const invite of invites)
            this.#invites.set([invite.guildId, invite.code], invite)
    }

    public async add(guildId: bigint, invite: string | Invite) {
        const key: [bigint, string] = (typeof invite === 'string')
            ? [guildId, invite]    
            : [guildId, invite.code]
            

        if (this.#invites.has(key))
            return

        const sakuraInvite = await this.#prisma.sakuraInvite.create({
            data: {
                guildId,
                code: key[1],
                expiresAt: (typeof invite === 'string') ? null : invite.expiresAt,
                isPermanent: (typeof invite === 'string') ? false : (invite.maxAge === 0),
                isVanity: (typeof invite === 'string') ? false : (invite.guild.vanityURLCode === key[1])
            }
        })
        this.#invites.set(key, sakuraInvite)
    }

    public get(key: [bigint, string]): SakuraInvite {
        return this.#invites.get(key)
    }

    public has(key: [bigint, string]) {
        return this.#invites.has(key)
    }
}