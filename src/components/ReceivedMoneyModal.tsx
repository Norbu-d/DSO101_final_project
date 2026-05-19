'use client'

import { useState, useRef, useEffect } from 'react'
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
  
  const amountInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Focus on amount input when modal opens (works on mobile)
    setTimeout(() => {
      amountInputRef.current?.focus()
    }, 100)
  }, [])

  const parsedAmount = parseFloat(amount) || 0
  const afterBalance = currentBalance + parsedAmount

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove any non-numeric characters except decimal point
    let value = e.target.value.replace(/[^0-9.]/g, '')
    // Ensure only one decimal point
    const parts = value.split('.')
    if (parts.length > 2) value = parts[0] + '.' + parts.slice(1).join('')
    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) value = parts[0] + '.' + parts[1].slice(0, 2)
    setAmount(value)
  }

  const handleQuickAmount = (value: number) => {
    setAmount(String(value))
    // Keep focus on input field
    amountInputRef.current?.focus()
  }

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
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'flex-end',
        background: 'rgba(0,0,0,0.6)',
        WebkitTapHighlightColor: 'transparent',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          margin: '0 auto',
          background: 'var(--bg-card)',
          borderRadius: '24px 24px 0 0',
          padding: '20px 20px 36px',
          maxHeight: '90vh',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
        className="animate-fade-up"
      >
        {/* Handle bar */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border)', margin: '0 auto 20px' }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)' }}>Received Money</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              Current: <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{formatNu(currentBalance)}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--bg-muted)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-muted)',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>

          {/* Amount input */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, fontWeight: 500 }}>
              Amount Received (Nu.)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                ref={amountInputRef}
                className="input"
                type="text"
                inputMode="decimal"
                pattern="[0-9]*"
                placeholder="0.00"
                value={amount}
                onChange={handleAmountChange}
                style={{ 
                  fontSize: 28, 
                  fontWeight: 700, 
                  fontFamily: 'DM Mono, monospace',
                  padding: '14px 16px',
                  textAlign: 'center',
                  letterSpacing: '1px'
                }}
                suppressHydrationWarning
              />
            </div>

            {/* Balance preview */}
            {parsedAmount > 0 && (
              <div style={{
                marginTop: 12,
                padding: '10px 14px',
                borderRadius: 12,
                background: 'var(--green-dim)',
                border: '1px solid var(--green-dim)',
              }}>
                <p style={{ fontSize: 13, color: 'var(--green)', fontWeight: 500 }}>
                  New balance: {formatNu(afterBalance)}
                </p>
              </div>
            )}

            {/* Quick amounts */}
            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              {[500, 1000, 2000, 5000].map(a => (
                <button
                  key={a}
                  type="button"
                  className="amount-chip"
                  onClick={() => handleQuickAmount(a)}
                  style={{
                    flex: '1 0 auto',
                    minWidth: '80px',
                    padding: '12px 8px',
                    fontSize: 14,
                    fontWeight: 500,
                    background: amount === String(a) ? 'var(--green-dim)' : 'var(--bg-muted)',
                    borderColor: amount === String(a) ? 'var(--green)' : 'var(--border)',
                    color: amount === String(a) ? 'var(--green)' : 'var(--text-secondary)',
                  }}
                >
                  Nu. {a >= 1000 ? `${a / 1000}k` : a}
                </button>
              ))}
            </div>
          </div>

          {/* Source */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 10, fontWeight: 500 }}>
              Source
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {INCOME_SOURCES.map(src => (
                <button
                  key={src.id}
                  type="button"
                  onClick={() => setSource(src.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '14px 12px', borderRadius: 12, cursor: 'pointer',
                    border: `1.5px solid ${source === src.id ? 'var(--green)' : 'var(--border)'}`,
                    background: source === src.id ? 'var(--green-dim)' : 'var(--bg-muted)',
                    color: source === src.id ? 'var(--green)' : 'var(--text-secondary)',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: 20 }}>{src.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: source === src.id ? 600 : 500 }}>{src.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, fontWeight: 500 }}>
              Date
            </label>
            <input
              className="input"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              max={today()}
              style={{ padding: '12px 14px', fontSize: 15 }}
              suppressHydrationWarning
            />
          </div>

          {/* Note */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, fontWeight: 500 }}>
              Note <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              className="input"
              type="text"
              inputMode="text"
              placeholder="e.g., from parents"
              value={note}
              onChange={e => setNote(e.target.value)}
              style={{ padding: '12px 14px', fontSize: 14 }}
            />
          </div>

          {error && (
            <div style={{
              padding: '12px 14px', borderRadius: 12,
              background: 'var(--red-dim)', border: '1px solid var(--red-dim)',
              marginBottom: 16,
            }}>
              <p style={{ color: 'var(--red)', fontSize: 13 }}>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '16px 0', borderRadius: 14,
              background: loading ? 'var(--green-dim)' : 'var(--green)',
              color: '#fff', fontWeight: 600, fontSize: 16,
              border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {loading ? 'Adding...' : 'Add to Balance'}
          </button>
        </form>
      </div>
    </div>
  )
}