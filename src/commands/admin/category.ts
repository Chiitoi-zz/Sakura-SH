import { SakuraCommand } from '#structures'
import type { SakuraCommandOptions } from '#types'
import { processCategory, replyWithInfoEmbed } from '#utils'
import { ApplyOptions } from '@sapphire/decorators'
import type { Args } from '@sapphire/framework'
import type { Message } from 'discord.js'

@ApplyOptions<SakuraCommandOptions>({
    description: 'Modifies a server\'s category list',
    examples: ['category add 123456789123456789', 'category remove 987654321987654321'],
    requiredClientPermissions: ['EMBED_LINKS'],
    subCommands: ['add', 'remove'],
    usage: ['category <add|remove> [categoryChannel]']
})
export class CategoryCommand extends SakuraCommand {
    public async add(message: Message, args: Args) {
        const { category, categoryId, guildId, inList } = await this.handleCategoryArgument(message, args) || {}

        if (inList)
            await replyWithInfoEmbed(message, `"<#${ categoryId }>" has already been added.`)
        else {
            const { client, settings } = this.container

            await settings.addCategoryId(guildId, categoryId)
            await replyWithInfoEmbed(message, `${ client.user.username } will queue "<#${ categoryId }>" and check when possible.`)
            await processCategory(category)
        }
    }

    public async remove(message: Message, args: Args) {
        const { categoryId, guildId, inList } = await this.handleCategoryArgument(message, args) || {}
        
        if (!inList)
            await replyWithInfoEmbed(message, `"<#${ categoryId }>" is not in the list of added categories.`)
        else {
            await this.container.settings.removeCategoryId(guildId, categoryId)
            await replyWithInfoEmbed(message, `${ this.container.client.user.username } will no longer check "<#${ categoryId }>".`)
        }
    }

    private async handleCategoryArgument(message: Message, args: Args) {
        if (args.finished)
            return this.missing('No category provided.')

        const category = await args.rest('guildCategoryChannel')

        if (!category) {
            await replyWithInfoEmbed(message, 'No category found.')

            return
        }

        const guildId = BigInt(message.guildId)          
        const categoryId = BigInt(category.id)
        const inList = this.container.settings.getCategoryIds(guildId).includes(categoryId)

        return { category, categoryId, guildId, inList }
    }
}