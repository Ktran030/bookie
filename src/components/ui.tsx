import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-black/20 ${className}`}>
      {children}
    </div>
  )
}

export function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-slate-300">{label}</span>
      {children}
    </label>
  )
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 ${props.className ?? ''}`}
    />
  )
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 ${props.className ?? ''}`}
    />
  )
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'danger'
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles = {
    primary: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-100',
    danger: 'bg-red-900/60 hover:bg-red-900 text-red-200',
  }[variant]
  return (
    <button
      {...props}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${styles} ${className}`}
    >
      {children}
    </button>
  )
}

export function Stat({
  label,
  value,
  tone = 'neutral',
}: {
  label: string
  value: string
  tone?: 'neutral' | 'good' | 'bad'
}) {
  const toneClass = {
    neutral: 'text-slate-100',
    good: 'text-emerald-400',
    bad: 'text-red-400',
  }[tone]
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs uppercase tracking-wide text-slate-500">{label}</span>
      <span className={`text-xl font-semibold tabular-nums ${toneClass}`}>{value}</span>
    </div>
  )
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'good' | 'bad' | 'warn' }) {
  const toneClass = {
    neutral: 'bg-slate-800 text-slate-300',
    good: 'bg-emerald-950 text-emerald-400 border border-emerald-800',
    bad: 'bg-red-950 text-red-400 border border-red-800',
    warn: 'bg-amber-950 text-amber-400 border border-amber-800',
  }[tone]
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${toneClass}`}>{children}</span>
}
