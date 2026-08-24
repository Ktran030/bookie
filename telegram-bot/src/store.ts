import Database from 'better-sqlite3'
import { randomUUID } from 'node:crypto'
import { DEFAULT_MAX_POINTS_WORSE } from './lib/threshold.js'

export type BetStatus = 'open' | 'hedged' | 'won' | 'lost' | 'pushed' | 'skipped'

export interface Bet {
  id: string
  chatId: string
  book: string
  event: string
  side: string
  americanOdds: number
  stake: number
  status: BetStatus
  hedgeOfBetId: string | null
  createdAt: string
}

export class Store {
  private db: Database.Database

  constructor(path: string) {
    this.db = new Database(path)
    this.db.pragma('journal_mode = WAL')
    this.migrate()
  }

  private migrate() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS bets (
        id TEXT PRIMARY KEY,
        chat_id TEXT NOT NULL,
        book TEXT NOT NULL,
        event TEXT NOT NULL,
        side TEXT NOT NULL,
        american_odds REAL NOT NULL,
        stake REAL NOT NULL,
        status TEXT NOT NULL,
        hedge_of_bet_id TEXT,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_bets_chat ON bets(chat_id);

      CREATE TABLE IF NOT EXISTS settings (
        chat_id TEXT PRIMARY KEY,
        max_points_worse REAL NOT NULL DEFAULT ${DEFAULT_MAX_POINTS_WORSE}
      );
    `)
  }

  addBet(input: Omit<Bet, 'id' | 'createdAt'>): Bet {
    const bet: Bet = { ...input, id: randomUUID(), createdAt: new Date().toISOString() }
    this.db
      .prepare(
        `INSERT INTO bets (id, chat_id, book, event, side, american_odds, stake, status, hedge_of_bet_id, created_at)
         VALUES (@id, @chatId, @book, @event, @side, @americanOdds, @stake, @status, @hedgeOfBetId, @createdAt)`,
      )
      .run(bet)
    return bet
  }

  updateStatus(id: string, status: BetStatus) {
    this.db.prepare(`UPDATE bets SET status = ? WHERE id = ?`).run(status, id)
  }

  getBet(id: string): Bet | undefined {
    const row = this.db.prepare(`SELECT * FROM bets WHERE id = ?`).get(id) as RawBetRow | undefined
    return row ? fromRow(row) : undefined
  }

  /** Most recently logged bet for this chat that has no hedge yet. */
  getLatestOpenBet(chatId: string): Bet | undefined {
    const row = this.db
      .prepare(
        `SELECT * FROM bets WHERE chat_id = ? AND status = 'open' AND hedge_of_bet_id IS NULL
         ORDER BY created_at DESC LIMIT 1`,
      )
      .get(chatId) as RawBetRow | undefined
    return row ? fromRow(row) : undefined
  }

  listOpenBets(chatId: string): Bet[] {
    const rows = this.db
      .prepare(
        `SELECT * FROM bets WHERE chat_id = ? AND status = 'open' AND hedge_of_bet_id IS NULL
         ORDER BY created_at DESC`,
      )
      .all(chatId) as RawBetRow[]
    return rows.map(fromRow)
  }

  listRecent(chatId: string, limit = 10): Bet[] {
    const rows = this.db
      .prepare(`SELECT * FROM bets WHERE chat_id = ? ORDER BY created_at DESC LIMIT ?`)
      .all(chatId, limit) as RawBetRow[]
    return rows.map(fromRow)
  }

  getMaxPointsWorse(chatId: string): number {
    const row = this.db.prepare(`SELECT max_points_worse FROM settings WHERE chat_id = ?`).get(chatId) as
      | { max_points_worse: number }
      | undefined
    return row?.max_points_worse ?? DEFAULT_MAX_POINTS_WORSE
  }

  setMaxPointsWorse(chatId: string, value: number) {
    this.db
      .prepare(
        `INSERT INTO settings (chat_id, max_points_worse) VALUES (?, ?)
         ON CONFLICT(chat_id) DO UPDATE SET max_points_worse = excluded.max_points_worse`,
      )
      .run(chatId, value)
  }
}

interface RawBetRow {
  id: string
  chat_id: string
  book: string
  event: string
  side: string
  american_odds: number
  stake: number
  status: BetStatus
  hedge_of_bet_id: string | null
  created_at: string
}

function fromRow(row: RawBetRow): Bet {
  return {
    id: row.id,
    chatId: row.chat_id,
    book: row.book,
    event: row.event,
    side: row.side,
    americanOdds: row.american_odds,
    stake: row.stake,
    status: row.status,
    hedgeOfBetId: row.hedge_of_bet_id,
    createdAt: row.created_at,
  }
}
