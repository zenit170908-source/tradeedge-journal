
'use client'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { computeStats, buildEquityCurve, formatPnL } from '@/lib/tradeUtils'
import { Trade } from '@/types'
import StatCard from '@/components/dashboard/StatCard'
import EquityCurve from '@/components/dashboard/EquityCurve'
import { TrendingUp } from 'lucide-react'

async function fetchTrades(): Promise<Trade[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('trades').select('*').order('date', { ascending: false })
  if (error) throw error
  return data ?? []
}

export default function DashboardPage() {
  const { data: trades = [] } = useQuery({ queryKey: ['trades'], queryFn: fetchTrades })
  const stats        = useMemo(() => computeStats(trades), [trades])
  const equityCurve  = useMemo(() => buildEquityCurve(trades), [trades])

  if (!trades.length) return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
        <TrendingUp className="w-8 h-8 text-primary" />
      </div>
      <h2 className="text-xl font-bold">No trades yet</h2>
      <p className="text-muted-foreground text-sm max-w-xs">
        Head to the Journal tab to log your first trade and start tracking your performance.
      </p>
    </div>
  )

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Your trading performance overview</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total PnL"     value={formatPnL(stats.totalPnL)}  valueClass={stats.totalPnL >= 0 ? 'text-[hsl(162,100%,39%)]' : 'text-destructive'} subtext={`${stats.total} trades`} />
          <StatCard label="Win Rate"      value={`${stats.winRate.toFixed(1)}%`} subtext={`${stats.wins}W / ${stats.losses}L`} />
          <StatCard label="Profit Factor" value={stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)} subtext="Gross profit / loss" />
          <StatCard label="Avg Trade"     value={formatPnL(stats.avgPnL)}    valueClass={stats.avgPnL >= 0 ? 'text-[hsl(162,100%,39%)]' : 'text-destructive'} subtext="Per trade" />
          <StatCard label="This Week"     value={formatPnL(stats.weekPnL)}   valueClass={stats.weekPnL >= 0 ? 'text-[hsl(162,100%,39%)]' : 'text-destructive'} subtext="Week to date" />
          <StatCard label="This Month"    value={formatPnL(stats.monthPnL)}  valueClass={stats.monthPnL >= 0 ? 'text-[hsl(162,100%,39%)]' : 'text-destructive'} subtext="Month to date" />
          <StatCard label="Avg Win"       value={formatPnL(stats.avgWin)}    valueClass="text-[hsl(162,100%,39%)]" subtext={`${stats.wins} winning trades`} />
          <StatCard label="Avg Loss"      value={formatPnL(stats.avgLoss)}   valueClass="text-destructive" subtext={`${stats.losses} losing trades`} />
        </div>
      )}

      <EquityCurve data={equityCurve} />
    </div>
  )
}


