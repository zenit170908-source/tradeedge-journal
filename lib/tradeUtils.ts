
import { Trade } from '@/types'

export const DEFAULT_ASSETS  = ['NQ100', 'S&P500', 'BTC', 'ETH', 'GER40']
export const DEFAULT_SESSIONS = ['Asia', 'London', 'New York AM', 'New York PM']
export const DEFAULT_SETUPS  = ['A-Setup', 'B-Setup', 'Aggressive Setup']
export const LEVERAGE_OPTIONS = ['1x','2x','3x','5x','10x','20x','50x']

export const parseSetups = (val: string | string[] | null): string[] => {
  if (!val) return []
  if (Array.isArray(val)) return val
  try {
    const p = JSON.parse(val)
    return Array.isArray(p) ? p : [val]
  } catch {
    return [val]
  }
}

export const calcPositionSize = (capitalUsed: string | number, leverage: string): number => {
  const cap = parseFloat(String(capitalUsed)) || 0
  const lev = parseFloat(leverage.replace('x', '')) || 1
  return parseFloat((cap * lev).toFixed(2))
}

export const calcPnL = (
  direction: 'Long' | 'Short',
  entry: number,
  exit: number,
  positionSize: number
): { pnl: number; pnlPct: number } => {
  if (!entry || !exit || !positionSize) return { pnl: 0, pnlPct: 0 }
  const priceDiff = direction === 'Long' ? exit - entry : entry - exit
  const pnl    = parseFloat((positionSize * (priceDiff / entry)).toFixed(2))
  const pnlPct = parseFloat(((priceDiff / entry) * 100).toFixed(2))
  return { pnl, pnlPct }
}

export const formatPnL = (val: number | null | undefined): string => {
  if (val === null || val === undefined) return '—'
  const abs = Math.abs(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return val >= 0 ? `+$${abs}` : `-$${abs}`
}

export const computeStats = (trades: Trade[]) => {
  if (!trades.length) return null
  const wins       = trades.filter(t => (t.pnl ?? 0) > 0)
  const losses     = trades.filter(t => (t.pnl ?? 0) < 0)
  const totalPnL   = trades.reduce((s, t) => s + (t.pnl ?? 0), 0)
  const grossProfit = wins.reduce((s, t) => s + (t.pnl ?? 0), 0)
  const grossLoss   = Math.abs(losses.reduce((s, t) => s + (t.pnl ?? 0), 0))

  const now          = new Date()
  const startOfWeek  = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay()); startOfWeek.setHours(0,0,0,0)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  return {
    total: trades.length,
    wins: wins.length,
    losses: losses.length,
    winRate: (wins.length / trades.length) * 100,
    totalPnL,
    avgPnL: totalPnL / trades.length,
    avgWin:  wins.length   ? wins.reduce((s,t) => s+(t.pnl??0),0) / wins.length   : 0,
    avgLoss: losses.length ? losses.reduce((s,t) => s+(t.pnl??0),0) / losses.length : 0,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0,
    weekPnL:  trades.filter(t => new Date(t.date) >= startOfWeek).reduce((s,t) => s+(t.pnl??0),0),
    monthPnL: trades.filter(t => new Date(t.date) >= startOfMonth).reduce((s,t) => s+(t.pnl??0),0),
  }
}

export const buildEquityCurve = (trades: Trade[]) => {
  const sorted = [...trades].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  let cumulative = 0
  return sorted.map(t => {
    cumulative += t.pnl ?? 0
    return { date: t.date, pnl: parseFloat(cumulative.toFixed(2)) }
  })
}

export const computeGroupStats = (trades: Trade[], groupKey: keyof Trade | 'setup') => {
  const groups: Record<string, Trade[]> = {}
  trades.forEach(t => {
    const keys = groupKey === 'setup'
      ? parseSetups(t.setup as string)
      : [String(t[groupKey] ?? '')]
    keys.filter(Boolean).forEach(key => {
      if (!groups[key]) groups[key] = []
      groups[key].push(t)
    })
  })
  return Object.entries(groups).map(([name, g]) => {
    const wins     = g.filter(t => (t.pnl ?? 0) > 0)
    const totalPnL = g.reduce((s, t) => s + (t.pnl ?? 0), 0)
    return { name, total: g.length, wins: wins.length, losses: g.length - wins.length,
      winRate: g.length ? (wins.length / g.length) * 100 : 0, totalPnL, avgPnL: totalPnL / g.length }
  }).sort((a, b) => b.totalPnL - a.totalPnL)
}


