'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { getRecentTransactions, getMonthlyExpenses, deleteExpense, getCategoryTotals, getMonthlyTotal, getDailyAverage } from '@/lib/db'
import { EXPENSE_CATEGORIES, formatNu } from '@/lib/constants'
import LogExpenseModal from '@/components/LogExpenseModal'
import ReceivedMoneyModal from '@/components/ReceivedMoneyModal'
import TransactionRow from '@/components/TransactionRow'
import { supabase } from '@/lib/supabase'
import { LogOut, History, TrendingDown, TrendingUp, Wallet } from 'lucide-react'

type Transaction = {
  id: string
  type: 'expense' | 'income'
  amount: number
  category_id?: string
  source?: string
  note: string | null
  date: string
  created_at?: string
}

export default function DashboardPage() {
  const { user, profile, loading, signOut, refreshProfile } = useAuth()
  const router = useRouter()

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [monthlyExpenses, setMonthlyExpenses] = useState<Array<{ amount: number; category_id: string; date: string }>>([])
  const [balance, setBalance] = useState(0)
  const [dataLoading, setDataLoading] = useState(true)
  const [showExpense, setShowExpense] = useState(false)
  const [showIncome, setShowIncome] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push('/auth')
  }, [user, loading, router])

  useEffect(() => {
    if (profile) setBalance(profile.current_balance)
  }, [profile])

  const loadData = useCallback(async () => {
    if (!user) return
    setDataLoading(true)
    try {
      const [txns, monthly] = await Promise.all([
        getRecentTransactions(user.id),
        getMonthlyExpenses(user.id),
      ])
      setTransactions(txns as Transaction[])
      setMonthlyExpenses(monthly)
    } finally {
      setDataLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) loadData()
  }, [user, loadData])

  const handleExpenseSuccess = (newBalance: number) => {
    setBalance(newBalance)
    setShowExpense(false)
    loadData()
    refreshProfile()
  }

  const handleIncomeSuccess = (newBalance: number) => {
    setBalance(newBalance)
    setShowIncome(false)
    loadData()
    refreshProfile()
  }

  const handleDelete = async (id: string, amount: number, type: 'expense' | 'income') => {
    if (!user || !confirm('Delete this transaction?')) return
    if (type === 'expense') {
      const newBal = await deleteExpense(id, user.id, amount, balance)
      setBalance(newBal)
    } else {
      // Delete income - reverse balance
      await supabase.from('income_entries').delete().eq('id', id)
      const newBal = balance - amount
      await supabase.from('users').update({ current_balance: newBal }).eq('id', user.id)
      setBalance(newBal)
    }
    loadData()
    refreshProfile()
  }

  const categoryTotals = getCategoryTotals(monthlyExpenses)
  const monthlyTotal = getMonthlyTotal(monthlyExpenses)
  const dailyAvg = getDailyAverage(monthlyExpenses)
  const monthlyReceived = transactions.filter(t => {
    if (t.type !== 'income') return false
    const d = new Date(t.date)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).reduce((s, t) => s + t.amount, 0)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
    </div>
  )

  if (!user || !profile) return null

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 0 100px', minHeight: '100vh' }}>

      {/* Top bar */}
      <div style={{
        padding: '20px 20px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Good day,</p>
          <h1 style={{ fontSize: 18, fontWeight: 600 }}>{profile.name.split(' ')[0]}</h1>
        </div>
        <button
          onClick={signOut}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 8 }}
        >
          <LogOut size={18} />
        </button>
      </div>

      {/* Balance card */}
      <div style={{ padding: '16px 16px 0' }} className="animate-fade-up">
        <div style={{
          background: 'linear-gradient(135deg, #1e1c17 0%, #242018 100%)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '24px 20px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative circle */}
          <div style={{
            position: 'absolute', top: -30, right: -30,
            width: 120, height: 120,
            borderRadius: '50%',
            background: 'rgba(232,160,32,0.06)',
          }} />

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Current Balance</p>
              <p style={{
                fontSize: 34,
                fontWeight: 700,
                color: 'var(--text-primary)',
                fontFamily: 'DM Mono, monospace',
                letterSpacing: '-1px',
              }}>
                {formatNu(balance)}
              </p>
            </div>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'var(--accent-dim)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Wallet size={20} color="var(--accent)" />
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 16, marginTop: 20 }}>
            <div style={{ flex: 1, padding: '10px 12px', background: 'var(--green-dim)', borderRadius: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                <TrendingUp size={12} color="var(--green)" />
                <p style={{ fontSize: 10, color: 'var(--green)' }}>RECEIVED</p>
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--green)', fontFamily: 'DM Mono, monospace' }}>
                {formatNu(monthlyReceived)}
              </p>
            </div>
            <div style={{ flex: 1, padding: '10px 12px', background: 'var(--red-dim)', borderRadius: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                <TrendingDown size={12} color="var(--red)" />
                <p style={{ fontSize: 10, color: 'var(--red)' }}>SPENT</p>
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--red)', fontFamily: 'DM Mono, monospace' }}>
                {formatNu(monthlyTotal)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ padding: '12px 16px', display: 'flex', gap: 10 }} className="animate-fade-up">
        <button
          onClick={() => setShowIncome(true)}
          style={{
            flex: 1, padding: '14px 0', borderRadius: 12,
            background: 'var(--green-dim)', border: '1px solid rgba(76,175,125,0.3)',
            color: 'var(--green)', fontWeight: 600, fontSize: 14, cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(76,175,125,0.2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--green-dim)')}
        >
          + Received Money
        </button>
        <button
          onClick={() => setShowExpense(true)}
          style={{
            flex: 1, padding: '14px 0', borderRadius: 12,
            background: 'var(--orange-dim)', border: '1px solid rgba(232,120,64,0.3)',
            color: 'var(--orange)', fontWeight: 600, fontSize: 14, cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(232,120,64,0.2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--orange-dim)')}
        >
          - Log Expense
        </button>
      </div>

      {/* Spending Insights */}
      {monthlyExpenses.length > 0 && (
        <div style={{ padding: '0 16px 8px' }}>
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600 }}>💡 Spending Insights</h3>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>This month</span>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Daily avg</p>
                <p style={{ fontSize: 14, fontWeight: 600, fontFamily: 'DM Mono, monospace', color: 'var(--text-primary)' }}>
                  Nu. {dailyAvg}
                </p>
              </div>
              <div style={{ width: 1, background: 'var(--border)' }} />
              <div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Transactions</p>
                <p style={{ fontSize: 14, fontWeight: 600, fontFamily: 'DM Mono, monospace', color: 'var(--text-primary)' }}>
                  {monthlyExpenses.length}
                </p>
              </div>
            </div>

            {/* Top categories */}
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>Top Spending Categories</p>
              {categoryTotals.slice(0, 3).map(({ id, total }) => {
                const cat = EXPENSE_CATEGORIES.find(c => c.id === id)
                const pct = monthlyTotal > 0 ? (total / monthlyTotal) * 100 : 0
                return (
                  <div key={id} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {cat?.icon} {cat?.name || id}
                      </span>
                      <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: 'var(--text-primary)' }}>
                        {formatNu(total)}
                      </span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: 'var(--border)' }}>
                      <div style={{
                        height: '100%', borderRadius: 2,
                        width: `${pct}%`,
                        background: 'var(--accent)',
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div style={{ padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, marginTop: 8 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600 }}>Recent Transactions</h3>
          {transactions.length > 5 && (
            <button
              onClick={() => router.push('/dashboard/history')}
              style={{
                background: 'none', border: 'none', color: 'var(--accent)',
                fontSize: 12, cursor: 'pointer', fontWeight: 500,
              }}
            >
              View All
            </button>
          )}
        </div>

        <div className="card" style={{ padding: '4px 16px' }}>
          {dataLoading ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, padding: '16px 0', textAlign: 'center' }}>
              Loading transactions...
            </p>
          ) : transactions.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center' }}>
              <p style={{ fontSize: 24, marginBottom: 8 }}>📋</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No transactions yet.</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>
                Log your first expense or income above.
              </p>
            </div>
          ) : (
            transactions.slice(0, 10).map(t => (
              <TransactionRow
                key={t.id}
                transaction={t}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </div>

      {/* Modals */}
      {showExpense && (
        <LogExpenseModal
          userId={user.id}
          currentBalance={balance}
          onClose={() => setShowExpense(false)}
          onSuccess={handleExpenseSuccess}
        />
      )}
      {showIncome && (
        <ReceivedMoneyModal
          userId={user.id}
          currentBalance={balance}
          onClose={() => setShowIncome(false)}
          onSuccess={handleIncomeSuccess}
        />
      )}

      {/* Bottom Nav */}
      <nav className="mobile-nav">
        <button
          style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 3, background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--accent)',
          }}
        >
          <Wallet size={20} />
          <span style={{ fontSize: 10, fontWeight: 500 }}>Dashboard</span>
        </button>
        <button
          onClick={() => router.push('/dashboard/history')}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 3, background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)',
          }}
        >
          <History size={20} />
          <span style={{ fontSize: 10 }}>History</span>
        </button>
      </nav>
    </div>
  )
}
