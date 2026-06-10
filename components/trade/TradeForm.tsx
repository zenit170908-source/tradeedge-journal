
'use client'
import { useState, useEffect } from 'react'
import { X, Upload, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DEFAULT_ASSETS, DEFAULT_SESSIONS, DEFAULT_SETUPS, LEVERAGE_OPTIONS, calcPnL, calcPositionSize, formatPnL, parseSetups } from '@/lib/tradeUtils'
import { Trade, TradeFormData, CustomOption } from '@/types'

interface Props {
  trade?: Trade | null
  customAssets: CustomOption[]
  customSessions: CustomOption[]
  customSetups: CustomOption[]
  onSave: (data: Partial<Trade>) => Promise<void>
  onClose: () => void
}

const BLANK: TradeFormData = {
  date: new Date().toISOString().split('T')[0],
  asset: '', direction: 'Long', session: '', setup: [],
  entry_price: '', exit_price: '', capital_used: '', leverage: '1x',
  position_size: 0, pnl: 0, pnl_pct: 0, quality_score: '',
  followed_plan: 'Yes', screenshot_url: '', comment: '',
}

export default function TradeForm({ trade, customAssets, customSessions, customSetups, onSave, onClose }: Props) {
  const allAssets   = [...DEFAULT_ASSETS,   ...customAssets.map(a => a.name)]
  const allSessions = [...DEFAULT_SESSIONS, ...customSessions.map(s => s.name)]
  const allSetups   = [...DEFAULT_SETUPS,   ...customSetups.map(s => s.name)]

  const [form, setForm] = useState<TradeFormData>({
    ...BLANK,
    ...(trade ? {
      ...trade,
      setup:        parseSetups(trade.setup),
      entry_price:  String(trade.entry_price  ?? ''),
      exit_price:   String(trade.exit_price   ?? ''),
      capital_used: String(trade.capital_used ?? ''),
      quality_score:String(trade.quality_score ?? ''),
    } : {}),
  } as TradeFormData)

  const [uploading, setUploading] = useState(false)
  const [saving,    setSaving]    = useState(false)

  useEffect(() => {
    const posSize = calcPositionSize(form.capital_used, form.leverage)
    const { pnl, pnlPct } = calcPnL(form.direction, parseFloat(form.entry_price), parseFloat(form.exit_price), posSize)
    setForm(f => ({ ...f, position_size: posSize, pnl, pnl_pct: pnlPct }))
  }, [form.direction, form.entry_price, form.exit_price, form.capital_used, form.leverage])

  const set = (key: keyof TradeFormData, val: unknown) => setForm(f => ({ ...f, [key]: val }))

  const toggleSetup = (s: string) =>
    setForm(f => ({ ...f, setup: f.setup.includes(s) ? f.setup.filter(x => x !== s) : [...f.setup, s] }))

  const handleScreenshot = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const path = `${user!.id}/${Date.now()}-${file.name}`
    const { data, error } = await supabase.storage.from('trade-screenshots').upload(path, file)
    if (!error && data) {
      const { data: { publicUrl } } = supabase.storage.from('trade-screenshots').getPublicUrl(data.path)
      set('screenshot_url', publicUrl)
    }
    setUploading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.setup.length) { alert('Setup is required'); return }
    setSaving(true)
    const posSize = calcPositionSize(form.capital_used, form.leverage)
    const { pnl, pnlPct } = calcPnL(form.direction, parseFloat(form.entry_price), parseFloat(form.exit_price), posSize)
    await onSave({
      ...form,
      setup:         JSON.stringify(form.setup),
      entry_price:   parseFloat(form.entry_price)   || null,
      exit_price:    parseFloat(form.exit_price)    || null,
      capital_used:  parseFloat(form.capital_used)  || null,
      position_size: posSize, pnl, pnl_pct: pnlPct,
      quality_score: form.quality_score ? parseInt(form.quality_score) : null,
    })
    setSaving(false); onClose()
  }

  const pnlColor  = form.pnl > 0 ? 'text-[hsl(162,100%,39%)]' : form.pnl < 0 ? 'text-destructive' : 'text-muted-foreground'
  const hasCalc   = form.entry_price && form.exit_price && form.capital_used

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="font-bold text-lg">{trade ? 'Edit Trade' : 'Add Trade'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Date / Asset / Direction */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} required
                className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Asset</label>
              <select value={form.asset} onChange={e => set('asset', e.target.value)} required
                className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="">Select...</option>
                {allAssets.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5 col-span-2 md:col-span-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Direction</label>
              <div className="flex rounded-lg overflow-hidden border border-border">
                {(['Long','Short'] as const).map(d => (
                  <button key={d} type="button" onClick={() => set('direction', d)}
                    className={`flex-1 py-2 text-sm font-semibold transition-colors ${form.direction === d ? (d === 'Long' ? 'bg-[hsl(162,100%,39%)] text-black' : 'bg-destructive text-white') : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Session */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Session</label>
            <select value={form.session} onChange={e => set('session', e.target.value)} required
              className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="">Select...</option>
              {allSessions.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          {/* Setup multi-select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Setup <span className="text-destructive">*</span></label>
            <div className="flex flex-wrap gap-2">
              {allSetups.map(s => (
                <button key={s} type="button" onClick={() => toggleSetup(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${form.setup.includes(s) ? 'bg-primary/20 border-primary text-primary' : 'bg-secondary border-border text-muted-foreground hover:text-foreground'}`}>
                  {s}
                </button>
              ))}
            </div>
            {form.setup.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {form.setup.map(s => (
                  <span key={s} className="flex items-center gap-1 px-2.5 py-1 bg-primary/15 border border-primary/20 rounded-md text-xs text-primary">
                    {s}<button type="button" onClick={() => toggleSetup(s)}><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Entry / Exit */}
          <div className="grid grid-cols-2 gap-4">
            {(['entry_price','exit_price'] as const).map(key => (
              <div key={key} className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{key === 'entry_price' ? 'Entry Price' : 'Exit Price'}</label>
                <input type="number" step="any" value={form[key]} onChange={e => set(key, e.target.value)} placeholder="0.00"
                  className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
            ))}
          </div>

          {/* Capital / Leverage */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Capital Used ($)</label>
              <input type="number" step="any" min="0" value={form.capital_used} onChange={e => set('capital_used', e.target.value)} placeholder="0.00"
                className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Leverage</label>
              <select value={form.leverage} onChange={e => set('leverage', e.target.value)}
                className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                {LEVERAGE_OPTIONS.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>

          {/* Calculated PnL */}
          {hasCalc && (
            <div className={`grid grid-cols-3 gap-3 px-4 py-3 rounded-lg border ${form.pnl >= 0 ? 'bg-[hsl(162,100%,39%/0.08)] border-[hsl(162,100%,39%/0.2)]' : 'bg-destructive/8 border-destructive/20'}`}>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Position Size</p>
                <p className="text-sm font-semibold">${form.position_size.toLocaleString('en-US',{minimumFractionDigits:2})}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">PnL ($)</p>
                <p className={`text-sm font-bold ${pnlColor}`}>{formatPnL(form.pnl)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">PnL (%)</p>
                <p className={`text-sm font-bold ${pnlColor}`}>{form.pnl_pct > 0 ? '+' : ''}{form.pnl_pct.toFixed(2)}%</p>
              </div>
            </div>
          )}

          {/* Quality / Plan */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Quality Score</label>
              <select value={form.quality_score} onChange={e => set('quality_score', e.target.value)}
                className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="">Select...</option>
                {[1,2,3,4,5,6,7,8,9,10].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Followed Plan?</label>
              <div className="flex rounded-lg overflow-hidden border border-border">
                {(['Yes','No'] as const).map(v => (
                  <button key={v} type="button" onClick={() => set('followed_plan', v)}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${form.followed_plan === v ? (v === 'Yes' ? 'bg-[hsl(162,100%,39%)] text-black' : 'bg-destructive text-white') : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Screenshot */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Screenshot</label>
            {form.screenshot_url ? (
              <div className="relative">
                <img src={form.screenshot_url} alt="Trade screenshot" className="rounded-lg w-full max-h-40 object-cover border border-border" />
                <button type="button" onClick={() => set('screenshot_url', '')}
                  className="absolute top-2 right-2 bg-background/80 rounded-full p-1 text-muted-foreground hover:text-destructive">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 border border-dashed border-border rounded-lg py-6 cursor-pointer hover:border-primary/40 transition-colors">
                {uploading ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <Upload className="w-5 h-5 text-muted-foreground" />}
                <span className="text-xs text-muted-foreground">{uploading ? 'Uploading...' : 'Click to upload screenshot'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleScreenshot} />
              </label>
            )}
          </div>

          {/* Comment */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Comment / Notes</label>
            <textarea value={form.comment} onChange={e => set('comment', e.target.value)} rows={3} placeholder="Trade review, observations..."
              className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Saving...' : (trade ? 'Update Trade' : 'Add Trade')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


