
export interface Trade {
  id: string
  user_id: string
  date: string
  asset: string
  direction: 'Long' | 'Short'
  session: string
  setup: string
  entry_price: number | null
  exit_price: number | null
  capital_used: number | null
  leverage: string
  position_size: number | null
  pnl: number | null
  pnl_pct: number | null
  quality_score: number | null
  followed_plan: 'Yes' | 'No' | null
  screenshot_url: string | null
  comment: string | null
  created_at: string
  updated_at: string
}

export interface CustomOption {
  id: string
  user_id: string
  name: string
  created_at: string
}

export interface TradeFormData {
  date: string
  asset: string
  direction: 'Long' | 'Short'
  session: string
  setup: string[]
  entry_price: string
  exit_price: string
  capital_used: string
  leverage: string
  position_size: number
  pnl: number
  pnl_pct: number
  quality_score: string
  followed_plan: 'Yes' | 'No'
  screenshot_url: string
  comment: string
}


