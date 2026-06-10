
'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Trade, CustomOption } from '@/types'
import { formatPnL, parseSetups } from '@/lib/tradeUtils'
import TradeForm from '@/components/trade/TradeForm'
import { Plus, Pencil, Trash2, Image as ImageIcon, X } from 'lucide-react'

async function fetchTrades(): Promise<Trade[]> {
  const supabase = createClient()
  const { data } = await supabase.from('trades').select('*').order('date', { ascending: false })
  return data ?? []
}

async function fetchCustom(table: string): Promise<CustomOption[]> {
  const supabase = createClient()
  const { data } = await supabase.from(table).select('*').order('name')
  return data ?? []
}

export default function JournalPage() {
  const qc = useQueryClient()
  const [formOpen, setFormOpen]     = useState(false)
  const [editTrade, setEditTrade]   = useState<Trade | null>(null)
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null)

  const { data: trades = [] }         = useQuery({ queryKey: ['trades'],          queryFn: fetchTrades })
  const { data: customAssets = [] }   = useQuery({ queryKey: ['custom_assets'],   queryFn: () => fetchCustom('custom_assets') })
  const { data: customSessions = [] } = useQuery({ queryKey: ['custom_sessions'], queryFn: () => fetchCustom('custom_sessions') })
  const { data: customSetups = [] }   = useQuery({ queryKey: ['custom_setups'],   queryFn: () => fetchCustom('custom_setups') })

  const supabase  = createClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['trades'] })

  const saveMutation = useMutation({
    mutationFn: async (payload: Partial<Trade>) => {
      if (editTrade) {
        await supabase.from('trades').update(payload).eq('id', editTrade.id)
      } else {
        const { data: { user } } = await supabase.auth.getUser()
        await supabase.from('trades').insert({ ...payload, user_id: user!.id })
      }
    },
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation({
  mutationFn: async (id: string) => {
    const { error } = await supabase.from('trades').delete().eq('id', id)
    if (error) throw error
  },
  onSuccess: invalidate,
})

  return (
    <div className="p-5 md:p-8 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Journal</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{trades.length} total trades</p>
        </div>
        <button onClick={() => { setEditTrade(null); setFormOpen(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Add Trade
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                {['Date','Asset','Dir','Session','Setup','Entry','Exit','Capital','Lev','Size','PnL ($)','PnL (%)','Score','Plan','SS','Actions'].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {trades.length === 0 ? (
                <tr><td colSpan={16} className="text-center py-12 text-muted-foreground">No trades yet. Add your first trade!</td></tr>
              ) : trades.map(t => (
                <tr key={t.id} className="hover:bg-accent/30 transition-colors group">
                  <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{t.date}</td>
                  <td className="px-3 py-2.5 font-medium whitespace-nowrap">{t.asset}</td>
                  <td className="px-3 py-2.5">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${t.direction === 'Long' ? 'bg-[hsl(162,100%,39%)] text-black' : 'bg-destructive/80 text-white'}`}>
                      {t.direction[0]}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{t.session}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {parseSetups(t.setup).map(s => (
                        <span key={s} className="px-1.5 py-0.5 bg-primary/10 border border-primary/20 rounded text-[10px] text-primary font-medium whitespace-nowrap">{s}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-xs font-mono">{t.entry_price ?? '—'}</td>
                  <td className="px-3 py-2.5 text-xs font-mono">{t.exit_price ?? '—'}</td>
                  <td className="px-3 py-2.5 text-xs font-mono text-muted-foreground">{t.capital_used ? `$${t.capital_used}` : '—'}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{t.leverage ?? '—'}</td>
                  <td className="px-3 py-2.5 text-xs font-mono">{t.position_size ? `$${t.position_size.toLocaleString()}` : '—'}</td>
                  <td className={`px-3 py-2.5 text-xs font-bold whitespace-nowrap ${(t.pnl ?? 0) > 0 ? 'text-[hsl(162,100%,39%)]' : (t.pnl ?? 0) < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {formatPnL(t.pnl)}
                  </td>
                  <td className={`px-3 py-2.5 text-xs font-bold whitespace-nowrap ${(t.pnl_pct ?? 0) > 0 ? 'text-[hsl(162,100%,39%)]' : (t.pnl_pct ?? 0) < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {t.pnl_pct != null ? `${t.pnl_pct > 0 ? '+' : ''}${t.pnl_pct.toFixed(2)}%` : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-center">
                    {t.quality_score
                      ? <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center mx-auto">{t.quality_score}</span>
                      : '—'}
                  </td>
                  <td className="px-3 py-2.5">
                    {t.followed_plan && (
                      <span className={`text-xs font-medium ${t.followed_plan === 'Yes' ? 'text-[hsl(162,100%,39%)]' : 'text-destructive'}`}>{t.followed_plan}</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    {t.screenshot_url
                      ? <button onClick={() => setScreenshotUrl(t.screenshot_url)} className="text-primary hover:text-primary/80"><ImageIcon className="w-4 h-4" /></button>
                      : '—'}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditTrade(t); setFormOpen(true) }} className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-primary/10"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { if (confirm('Delete this trade?')) deleteMutation.mutate(t.id) }} className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {formOpen && (
        <TradeForm trade={editTrade} customAssets={customAssets} customSessions={customSessions} customSetups={customSetups}
          onSave={saveMutation.mutateAsync} onClose={() => { setFormOpen(false); setEditTrade(null) }} />
      )}

      {screenshotUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90" onClick={() => setScreenshotUrl(null)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white"><X className="w-6 h-6" /></button>
          <img src={screenshotUrl} alt="Screenshot" className="max-w-full max-h-full object-contain rounded-lg" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}


