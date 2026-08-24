import type { Scenes } from 'telegraf'

export interface BetWizardState {
  book?: string
  event?: string
  side?: string
  americanOdds?: number
}

export interface HedgeWizardState {
  betId?: string
  hedgeBook?: string
}

export interface MyWizardSession extends Scenes.WizardSessionData {}

export type MyContext = Scenes.WizardContext<MyWizardSession>
