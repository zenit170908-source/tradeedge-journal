
'use client'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { computeGroupStats, formatPnL } from '@/lib/tradeUtils'
import { Trade } from '@/types'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

async function fetchTrades(): Promise<Trade[]> {
  const supabase = createClient()
  const { data } = await supabase.from('trades').select('*').order('date', { ascending: false })
  return data ?? []
}

type GroupRow = ReturnType<typeof computeGroupStats>[number]

function GroupTable({ title, data }: { title: string; data: GroupRow[] }) {
  if (!data.length) return null
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-border">
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b border-border">
            <tr>{['Name','Trades','Win Rate','Total PnL','Avg PnL'].map(h => (
              <th key={h} className="px-4 py-2.5 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((row, i) => (
              <tr key={row.name} className={`hover:bg-accent/20 ${i === 0 ? 'bg-[hsl(162,100%,39%/0.05)]' : ''}`}>
                <td className="px-4 py-2.5 font-medium">{row.name}</td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">{row.total}</td>
                <td className="px-4 py-2.5 text-xs">{row.winRate.toFixed(1)}%</td>
                <td className={`px-4 py-2.5 text-xs font-bold ${row.totalPnL >= 0 ? 'text-[hsl(162,100%,39%)]' : 'text-destructive'}`}>{formatPnL(row.totalPnL)}</td>
                <td className={`px-4 py-2.5 text-xs ${row.avgPnL >= 0 ? 'text-[hsl(162,100%,39%)]' : 'text-destructive'}`}>{formatPnL(row.avgPnL)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const { data: trades = [] } = useQuery({ queryKey: ['trades'], queryFn: fetchTrades })
  const setupStats   = useMemo(() => computeGroupStats(trades, 'setup'),   [trades])
  const sessionStats = useMemo(() => computeGroupStats(trades, 'session'), [trades])
  const assetStats   = useMemo(() => computeGroupStats(trades, 'asset'),   [trades])

  if (!trades.length) return (
    <div className="flex items-center justify-center h-full p-8">
      <p className="text-muted-foreground">No trade data yet.</p>
    </div>
  )

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Performance breakdown by setup, session and asset</p>
      </div>

      <GroupTable title="Performance by Setup"   data={setupStats} />
      <GroupTable title="Performance by Session" data={sessionStats} />
      <GroupTable title="Performance by Asset"   data={assetStats} />

      {setupStats.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-4">Setup PnL Comparison</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={setupStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `$${v}`} />
              <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, 'PnL']}
                contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="totalPnL" fill="hsl(162,100%,39%)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}


