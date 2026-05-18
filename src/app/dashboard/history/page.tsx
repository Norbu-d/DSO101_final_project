'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { getRecentTransactions } from '@/lib/db'
import TransactionRow from '@/components/TransactionRow'
import { ArrowLeft, Wallet, History } from 'lucide-react'

type Transaction = {
  id: string
  type: 'expense' | 'income'
  amount: number
  category_id?: string
  source?: string
  note: string | null
  date: string
}

export default function HistoryPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'expense' | 'income'>('all')

  useEffect(() => {
    if (!loading && !user) router.push('/auth')
  }, [user, loading, router])

  const loadData = useCallback(async () => {
    if (!user) return
    const data = await getRecentTransactions(user.id)
    setTransactions(data as Transaction[])
    setDataLoading(false)
  }, [user])

  useEffect(() => {
    if (user) loadData()
  }, [user, loadData])

  const filtered = transactions.filter(t => filter === 'all' || t.type === filter)

  // Group by date label
  const grouped: Record<string, Transaction[]> = {}
  for (const t of filtered) {
    const d = new Date(t.date)
    const label = d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
    if (!grouped[label]) grouped[label] = []
    grouped[label].push(t)
  }

  if (loading) return null

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 0 100px', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ padding: '20px 16px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => router.back()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 600 }}>Transaction History</h1>
      </div>

      {/* Filter tabs */}
      <div style={{ padding: '0 16px 16px', display: 'flex', gap: 6 }}>
        {(['all', 'expense', 'income'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="chip"
            style={{
              ...(filter === f ? {
                background: 'var(--accent-dim)',
                borderColor: 'var(--accent)',
                color: 'var(--accent)',
              } : {}),
              textTransform: 'capitalize',
            }}
          >
            {f === 'all' ? 'All' : f === 'expense' ? '🔴 Expenses' : '🟢 Income'}
          </button>
        ))}
      </div>

      {/* Transactions */}
      <div style={{ padding: '0 16px' }}>
        {dataLoading ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 13, padding: '24px 0', textAlign: 'center' }}>
            Loading...
          </p>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center' }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>📋</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No transactions found.</p>
          </div>
        ) : (
          Object.entries(grouped).map(([label, txns]) => (
            <div key={label} style={{ marginBottom: 8 }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {label}
              </p>
              <div className="card" style={{ padding: '4px 16px' }}>
                {txns.map(t => (
                  <TransactionRow key={t.id} transaction={t} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom Nav */}
      <nav className="mobile-nav">
        <button
          onClick={() => router.push('/dashboard')}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 3, background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)',
          }}
        >
          <Wallet size={20} />
          <span style={{ fontSize: 10 }}>Dashboard</span>
        </button>
        <button
          style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 3, background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--accent)',
          }}
        >
          <History size={20} />
          <span style={{ fontSize: 10, fontWeight: 500 }}>History</span>
        </button>
      </nav>
    </div>
  )
}
