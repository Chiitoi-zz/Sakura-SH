import { Argument } from '@sapphire/framework'
import type { ArgumentContext } from '@sapphire/framework'

export class SakuraArgument extends Argument<string> {
    public run(parameter: string, context: ArgumentContext) {
        const stripped = parameter.replace(/^#/, '')
        const reColor = /^(?:[0-9a-fA-F]{3}){1,2}$/i
        const valid = reColor.test(stripped)
        const standardized = (stripped.length == 3)
            ? stripped.split('').map(char => char.repeat(2)).join('').toUpperCase()
            : stripped.toUpperCase()

        return valid
            ? this.ok(standardized)
            : this.error({ context, message: 'Invalid hex code.', parameter })
    }
}