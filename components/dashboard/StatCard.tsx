
interface StatCardProps {
  label: string
  value: string
  subtext?: string
  valueClass?: string
}

export default function StatCard({ label, value, subtext, valueClass = '' }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 hover:bg-accent/20 transition-colors">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-xl font-bold ${valueClass || 'text-foreground'}`}>{value}</p>
      {subtext && <p className="text-xs text-muted-foreground mt-0.5">{subtext}</p>}
    </div>
  )
}


