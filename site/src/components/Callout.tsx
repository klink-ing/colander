import type { ReactNode } from 'react'

const styles = {
  info: {
    border: 'border-blue-300 dark:border-blue-800',
    bg: 'bg-blue-50 dark:bg-blue-950',
    text: 'text-blue-800 dark:text-blue-200',
    icon: 'i',
  },
  warning: {
    border: 'border-amber-300 dark:border-amber-800',
    bg: 'bg-amber-50 dark:bg-amber-950',
    text: 'text-amber-800 dark:text-amber-200',
    icon: '!',
  },
  error: {
    border: 'border-red-300 dark:border-red-800',
    bg: 'bg-red-50 dark:bg-red-950',
    text: 'text-red-800 dark:text-red-200',
    icon: '!!',
  },
} as const

export default function Callout({
  type = 'info',
  children,
}: {
  type?: 'info' | 'warning' | 'error'
  children: ReactNode
}) {
  const s = styles[type]
  return (
    <div className={`my-4 rounded-lg border ${s.border} ${s.bg} p-4 text-sm ${s.text}`}>
      {children}
    </div>
  )
}
