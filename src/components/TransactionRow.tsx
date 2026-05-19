'use client'

import { EXPENSE_CATEGORIES, INCOME_SOURCES, formatNu, formatDate } from '@/lib/constants'
import { Trash2 } from 'lucide-react'

interface Transaction {
  id: string
  type: 'expense' | 'income'
  amount: number
  category_id?: string
  source?: string
  note: string | null
  date: string
}

interface Props {
  transaction: Transaction
  onDelete?: (id: string, amount: number, type: 'expense' | 'income') => void
}

export default function TransactionRow({ transaction, onDelete }: Props) {
  const isExpense = transaction.type === 'expense'

  const category = isExpense
    ? EXPENSE_CATEGORIES.find(c => c.id === transaction.category_id)
    : INCOME_SOURCES.find(s => s.id === transaction.source)

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 0',
      borderBottom: '1px solid var(--border)',
    }}>

      {/* Icon bubble */}
      <div style={{
        width: 42,
        height: 42,
        borderRadius: 12,
        background: isExpense ? '#fff0ec' : '#eef9f2',
        border: `1px solid ${isExpense ? 'rgba(224,90,48,0.15)' : 'rgba(40,160,95,0.15)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 19,
        flexShrink: 0,
      }}>
        {category?.icon || (isExpense ? '📦' : '💰')}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 14,
          fontWeight: 500,
          color: 'var(--text-primary)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {category?.name || (isExpense ? 'Other' : 'Income')}
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
          {transaction.note
            ? <>{transaction.note} <span style={{ marginLeft: 4 }}>· {formatDate(transaction.date)}</span></>
            : formatDate(transaction.date)
          }
        </p>
      </div>

      {/* Amount */}
      <p style={{
        fontSize: 14,
        fontWeight: 600,
        color: isExpense ? 'var(--red)' : 'var(--green)',
        fontFamily: 'DM Mono, monospace',
        flexShrink: 0,
      }}>
        {isExpense ? '-' : '+'}{formatNu(transaction.amount)}
      </p>

      {/* Delete */}
      {onDelete && (
        <button
          onClick={() => onDelete(transaction.id, transaction.amount, transaction.type)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            padding: 4,
            flexShrink: 0,
            opacity: 0.5,
            transition: 'opacity 0.15s',
            display: 'flex',
            alignItems: 'center',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  )
}