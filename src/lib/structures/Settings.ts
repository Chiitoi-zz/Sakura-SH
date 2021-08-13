import { Except, GuildSetting, RequireAtLeastOne } from '#types'
import type { PrismaClient, Setting } from '@prisma/client'
import { Collection } from 'discord.js'
import type { NewsChannel, TextChannel } from 'discord.js'

export class Settings {
    #prisma: PrismaClient
    #settings: Collection<bigint, GuildSetting> = new Collection()

    public constructor(prisma: PrismaClient) {
        this.#prisma = prisma
    }
    
    public async init() {
        const categories = await this.#prisma.category.findMany()
        const ignored = await this.#prisma.ignore.findMany()
        const settings = await this.#prisma.setting.findMany()

        for (const setting of settings) {
            const { guildId } = setting
            const categoryIds = categories.reduce<bigint[]>((obj, channel) => channel.guildId === guildId ? [...obj, channel.channelId] : obj, [])
            const ignoreIds = ignored.reduce<bigint[]>((obj, channel) => channel.guildId === guildId ? [...obj, channel.channelId] : obj, [])

            this.#settings.set(setting.guildId, { ...setting, categoryIds, ignoreIds })
        }
    }

    public async addCategoryId(guildId: bigint, channelId: bigint) {
        const setting = this.#settings.get(guildId)

        if (setting.categoryIds.includes(channelId))
            return

        await this.#prisma.category.create({ data: { guildId, channelId } })
        setting.categoryIds = [...setting.categoryIds, channelId]
        this.#settings.set(guildId, setting)
    }

    public async addGuild(guildId: bigint) {
        if (this.#settings.has(guildId))
            return

        const setting = await this.#prisma.setting.create({ data: { guildId } })
        this.#settings.set(guildId, { ...setting, categoryIds: [], ignoreIds: [] })

        return setting
    }

    public async addIgnoreId(guildId: bigint, channelId: bigint) {
        const setting = this.#settings.get(guildId)

        if (setting.ignoreIds.includes(channelId))
            return

        await this.#prisma.ignore.create({ data: { guildId, channelId } })
        setting.ignoreIds = [...setting.ignoreIds, channelId]
        this.#settings.set(guildId, setting)
    }

    public get(guildId) {
        return this.#settings.get(guildId)
    }
    
    public getAdditionalRole(guildId: bigint) {
        return this.#settings.get(guildId).additionalRoleId
    }

    public getCategoryIds(guildId: bigint) {
        return this.#settings.get(guildId).categoryIds
    }

    public async getUncheckedCategoryIds(guildId: bigint) {
        const uncheckedCategories = await this.#prisma.category.findMany({
            select: { channelId: true },
            where: { guildId, isChecked: false }
        })
        const uncheckedCategoryIds = uncheckedCategories.map(({ channelId }) => channelId)

        return uncheckedCategoryIds
    }

    public getCheckEmbedColor(guildId: bigint) {
        return this.#settings.get(guildId).checkEmbedColor
    }

    public getIgnoreIds(guildId: bigint) {
        return this.#settings.get(guildId).ignoreIds
    }

    public getInfoEmbedColor(guildId: bigint) {
        return this.#settings.get(guildId).infoEmbedColor
    }

    public getPrefix(guildId: bigint) {
        return this.#settings.get(guildId).prefix
    }

    public async isCheckingCategories(guildId: bigint) {
        const uncheckedCategoryCount = await this.#prisma.category.count({ where: { guildId, isChecked: false } })

        return Boolean(uncheckedCategoryCount)
    }

    public async removeChannel(channel: NewsChannel | TextChannel) {
        const guildId = BigInt(channel.guildId)
        const settings = this.#settings.get(guildId)
        const channelId = BigInt(channel.id)

        if (settings.checkChannelId === channelId) {
            settings.checkChannelId = null
            await this.#prisma.setting.update({ data: { checkChannelId: null }, where: { guildId } })
        }

        if (settings.categoryIds.includes(channelId)) {
            settings.categoryIds = settings.categoryIds.filter(id => id !== channelId)
            await this.#prisma.category.delete({ where: { guildId_channelId: { guildId, channelId } } })
        }

        if (settings.ignoreIds.includes(channelId)) {
            settings.ignoreIds = settings.categoryIds.filter(id => id !== channelId)
            await this.#prisma.ignore.delete({ where: { guildId_channelId: { guildId, channelId } } })
        }

        this.#settings.set(guildId, settings)       
    }

    public async removeCategoryId(guildId: bigint, channelId: bigint) {
        const setting = this.#settings.get(guildId)

        if (!setting.categoryIds.includes(channelId))
            return

        await this.#prisma.category.delete({ where: { guildId_channelId: { guildId, channelId }  } })
        setting.categoryIds = setting.categoryIds.filter(id => id !== channelId)
        this.#settings.set(guildId, setting)
    }

    public async removeGuild(guildId: bigint) {
        if (!this.#settings.has(guildId))
            return

        const setting = await this.#prisma.setting.delete({ where: { guildId } })
        await this.#prisma.category.deleteMany({ where: { guildId } })
        await this.#prisma.ignore.deleteMany({ where: { guildId } })
        this.#settings.delete(guildId)

        return setting
    }

    public async removeIgnoreId(guildId: bigint, channelId: bigint) {
        const setting = this.#settings.get(guildId)

        if (!setting.ignoreIds.includes(channelId))
            return

        await this.#prisma.ignore.delete({ where: { guildId_channelId: { guildId, channelId }  } })
        setting.ignoreIds = setting.ignoreIds.filter(id => id !== channelId)
        this.#settings.set(guildId, setting)
    }

    public async updateCategory(guildId: bigint, channelId: bigint) {
        await this.#prisma.category.update({ data: { isChecked: true  }, where: { guildId_channelId: { guildId, channelId } } })
    }

    public async updateGuild(guildId: bigint, data: RequireAtLeastOne<Except<Setting, 'guildId'>>) {
        const settings = this.#settings.get(guildId)

        if (!settings)
            return       

        const { categoryIds, ignoreIds } = settings
        const setting = await this.#prisma.setting.update({ data, where: { guildId } })
        this.#settings.set(guildId, { ...setting, categoryIds, ignoreIds })
    }
}