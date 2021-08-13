import type { SakuraConfig } from '#types'
import { readFile } from 'fs/promises'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let config: SakuraConfig

try {
    config = JSON.parse(await readFile(join(__dirname, '..', 'config.json'), 'utf-8'))
} catch (error) {
    throw 'Rename "example-config.json" to "config.json".'
}

export const { token: TOKEN } = config