export const DiscordInviteRegex = /(?:https?:\/\/)?(?:\w+\.)?discord(?:(?:app)?\.com\/invite|\.gg)\/(?<code>[a-z0-9-]+)/gi

export enum PRIORITY {
    CATEGORY,
    MESSAGE,
    INVITE_CHECK
}

export enum QUERY {
    COMMAND,
    CATEGORY,
    EVERYTHING
}