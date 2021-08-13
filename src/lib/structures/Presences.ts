import { SakuraPresence } from '#types'
import { Presence, PrismaClient } from '@prisma/client'
import { Collection } from 'discord.js'

export class Presences {
    #prisma: PrismaClient
    #presences: Collection<number, Presence> = new Collection()

    public constructor(prisma: PrismaClient) {
        this.#prisma = prisma
    }

    public async init() {
        const presences = await this.#prisma.presence.findMany()

        for (const presence of presences)
            this.#presences.set(presence.id, presence)
    }

    public async add({ type, name, status }: SakuraPresence) {
        const presence = await this.#prisma.presence.create({ data: { type, name, status } })
        this.#presences.set(presence.id, presence)

        return presence
    }

    public get cache() {
        return this.#presences
    }

    public async remove(id: number) {
        if (!this.#presences.has(id))
            return

        const presence = await this.#prisma.presence.delete({ where: { id  } })
        this.#presences.delete(id)

        return presence
    }
}