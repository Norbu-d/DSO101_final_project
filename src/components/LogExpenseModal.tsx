'use client'

import { useState } from 'react'
import { EXPENSE_CATEGORIES, QUICK_AMOUNTS, today, formatNu } from '@/lib/constants'
import { logExpense } from '@/lib/db'
import { X } from 'lucide-react'

interface Props {
  userId: string
  currentBalance: number
  onClose: () => void
  onSuccess: (newBalance: number) => void
}

export default function LogExpenseModal({ userId, currentBalance, onClose, onSuccess }: Props) {
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(today())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const parsedAmount = parseFloat(amount) || 0
  const afterBalance = currentBalance - parsedAmount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!parsedAmount || parsedAmount <= 0) { setError('Enter a valid amount'); return }
    if (!categoryId) { setError('Select a category'); return }
    if (parsedAmount > currentBalance) { setError('Amount exceeds your balance'); return }

    setLoading(true)
    setError('')
    try {
      const { newBalance } = await logExpense(userId, parsedAmount, categoryId, note, date, currentBalance)
      onSuccess(newBalance)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to log expense')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'flex-end',
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(4px)',
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>

      <div style={{
        width: '100%',
        maxWidth: 480,
        margin: '0 auto',
        background: 'var(--bg-card)',
        borderRadius: '16px 16px 0 0',
        border: '1px solid var(--border)',
        borderBottom: 'none',
        padding: '20px 20px 32px',
        maxHeight: '90vh',
        overflowY: 'auto',
      }} className="animate-fade-up">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 600 }}>Log Expense</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Balance: <span style={{ color: 'var(--text-secondary)' }}>{formatNu(currentBalance)}</span>
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Amount */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Amount</label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--accent)', fontWeight: 600, fontSize: 15,
              }}>Nu.</span>
              <input
                className="input"
                type="number"
                placeholder="0"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                style={{ paddingLeft: 48, fontSize: 22, fontWeight: 600, fontFamily: 'DM Mono, monospace' }}
                autoFocus
              />
            </div>

            {/* Balance preview */}
            {parsedAmount > 0 && (
              <div style={{
                marginTop: 8,
                padding: '8px 12px',
                borderRadius: 8,
                background: afterBalance < 0 ? 'var(--red-dim)' : 'var(--green-dim)',
                border: `1px solid ${afterBalance < 0 ? 'rgba(224,90,78,0.3)' : 'rgba(76,175,125,0.3)'}`,
              }}>
                <p style={{ fontSize: 12, color: afterBalance < 0 ? 'var(--red)' : 'var(--green)' }}>
                  Balance after: {formatNu(afterBalance)}
                </p>
              </div>
            )}

            {/* Quick amounts */}
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              {QUICK_AMOUNTS.slice(0, 5).map(a => (
                <button
                  key={a}
                  type="button"
                  className="amount-chip"
                  onClick={() => setAmount(String(a))}
                  style={amount === String(a) ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : {}}
                >
                  {a >= 1000 ? `${a/1000}k` : a}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Category</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {EXPENSE_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  className={`chip ${categoryId === cat.id ? 'selected' : ''}`}
                  onClick={() => setCategoryId(cat.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px' }}
                >
                  <span style={{ fontSize: 16 }}>{cat.icon}</span>
                  <span style={{ fontSize: 11 }}>{cat.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Date</label>
            <input
              className="input"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              max={today()}
            />
          </div>

          {/* Note */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Note <span style={{ color: 'var(--text-muted)' }}>(optional)</span>
            </label>
            <input
              className="input"
              type="text"
              placeholder="e.g. lunch at canteen"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>

          {error && (
            <p style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{error}</p>
          )}

          <button
            className="btn-primary"
            type="submit"
            disabled={loading}
            style={{ background: 'var(--orange)', fontSize: 15 }}
          >
            {loading ? 'Logging...' : 'LOG EXPENSE — Balance updates instantly'}
          </button>
        </form>
      </div>
    </div>
  )
}
