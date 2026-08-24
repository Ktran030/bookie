import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { Store } from './store.js'

const dbPath = process.env.DB_PATH ?? './data/bookie.db'
mkdirSync(dirname(dbPath), { recursive: true })

export const store = new Store(dbPath)
