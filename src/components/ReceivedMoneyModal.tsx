'use client'

import { useState } from 'react'
import { INCOME_SOURCES, today, formatNu } from '@/lib/constants'
import { logIncome } from '@/lib/db'
import { X } from 'lucide-react'

interface Props {
  userId: string
  currentBalance: number
  onClose: () => void
  onSuccess: (newBalance: number) => void
}

export default function ReceivedMoneyModal({ userId, currentBalance, onClose, onSuccess }: Props) {
  const [amount, setAmount] = useState('')
  const [source, setSource] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(today())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const parsedAmount = parseFloat(amount) || 0
  const afterBalance = currentBalance + parsedAmount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!parsedAmount || parsedAmount <= 0) { setError('Enter a valid amount'); return }
    if (!source) { setError('Select a source'); return }

    setLoading(true)
    setError('')
    try {
      const { newBalance } = await logIncome(userId, parsedAmount, source, note, date, currentBalance)
      onSuccess(newBalance)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to log income')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'flex-end',
        background: 'rgba(0,0,0,0.45)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          margin: '0 auto',
          background: '#ffffff',
          borderRadius: '20px 20px 0 0',
          padding: '20px 20px 36px',
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
        className="animate-fade-up"
      >
        {/* Handle bar */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: '#e0e0ea', margin: '0 auto 20px' }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>Received Money</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
              Current: <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{formatNu(currentBalance)}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: '#f4f6fa', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-muted)',
            }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>

          {/* Amount input */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, fontWeight: 500 }}>
              Amount received
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--green)', fontWeight: 600, fontSize: 14,
              }}>Nu.</span>
              <input
                className="input"
                type="number"
                placeholder="0"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                style={{ paddingLeft: 48, fontSize: 24, fontWeight: 700, fontFamily: 'DM Mono, monospace' }}
                suppressHydrationWarning
                autoFocus
              />
            </div>

            {/* Balance preview */}
            {parsedAmount > 0 && (
              <div style={{
                marginTop: 8,
                padding: '8px 12px',
                borderRadius: 10,
                background: '#eef9f2',
                border: '1px solid rgba(40,160,95,0.25)',
              }}>
                <p style={{ fontSize: 12, color: 'var(--green)', fontWeight: 500 }}>
                  New balance: {formatNu(afterBalance)}
                </p>
              </div>
            )}

            {/* Quick amounts */}
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              {[500, 1000, 2000, 5000].map(a => (
                <button
                  key={a}
                  type="button"
                  className="amount-chip"
                  onClick={() => setAmount(String(a))}
                  style={amount === String(a)
                    ? { borderColor: 'var(--green)', color: 'var(--green)', background: '#eef9f2' }
                    : {}
                  }
                >
                  {a >= 1000 ? `${a / 1000}k` : a}
                </button>
              ))}
            </div>
          </div>

          {/* Source */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, fontWeight: 500 }}>
              Source
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {INCOME_SOURCES.map(src => (
                <button
                  key={src.id}
                  type="button"
                  onClick={() => setSource(src.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '11px 12px', borderRadius: 10, cursor: 'pointer',
                    border: `1px solid ${source === src.id ? 'rgba(40,160,95,0.5)' : 'var(--border)'}`,
                    background: source === src.id ? '#eef9f2' : 'var(--bg-muted)',
                    color: source === src.id ? 'var(--green)' : 'var(--text-secondary)',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: 17 }}>{src.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: source === src.id ? 500 : 400 }}>{src.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, fontWeight: 500 }}>
              Date
            </label>
            <input
              className="input"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              max={today()}
              suppressHydrationWarning
            />
          </div>

          {/* Note */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, fontWeight: 500 }}>
              Note <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              className="input"
              type="text"
              placeholder="e.g. from my dad"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>

          {error && (
            <div style={{
              padding: '10px 12px', borderRadius: 10,
              background: '#fff0ec', border: '1px solid rgba(224,90,48,0.25)',
              marginBottom: 14,
            }}>
              <p style={{ color: 'var(--red)', fontSize: 13 }}>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '14px 0', borderRadius: 12,
              background: loading ? '#8fcfaf' : 'var(--green)',
              color: '#fff', fontWeight: 600, fontSize: 15,
              border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {loading ? 'Adding...' : 'Add to Balance'}
          </button>
        </form>
      </div>
    </div>
  )
}