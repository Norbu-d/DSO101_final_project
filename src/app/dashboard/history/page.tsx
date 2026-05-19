'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { getRecentTransactions } from '@/lib/db'
import TransactionRow from '@/components/TransactionRow'
import { ArrowLeft, Wallet, History, LogOut } from 'lucide-react'

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
  const { user, profile, loading, signOut } = useAuth()
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
    // Load data when user changes
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (user) loadData()
  }, [user, loadData])

  const filtered = transactions.filter(t => filter === 'all' || t.type === filter)

  const grouped: Record<string, Transaction[]> = {}
  for (const t of filtered) {
    const d = new Date(t.date)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    let label = d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
    if (d.toDateString() === today.toDateString()) label = 'Today'
    else if (d.toDateString() === yesterday.toDateString()) label = 'Yesterday'
    
    if (!grouped[label]) grouped[label] = []
    grouped[label].push(t)
  }

  if (loading) return null

  return (
    <div className="app">
      {/* Sidebar - Desktop only */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-icon">₿</div>
          <span className="logo-text">TenPhel</span>
        </div>
        <nav className="sidebar-nav">
          <button onClick={() => router.push('/dashboard')} className="nav-item">
            <Wallet size={18} />
            <span>Dashboard</span>
          </button>
          <button className="nav-item active">
            <History size={18} />
            <span>History</span>
          </button>
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {profile?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <p className="user-name">{profile?.name || 'User'}</p>
              <p className="user-role">Student</p>
            </div>
          </div>
          <button onClick={signOut} className="signout-btn">
            <LogOut size={16} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Mobile Header */}
        <div className="mobile-header">
          <button onClick={() => router.back()} className="icon-btn">
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="greeting-text">Transaction</p>
            <h1 className="user-greeting">History</h1>
          </div>
          <button onClick={signOut} className="icon-btn">
            <LogOut size={18} />
          </button>
        </div>

        <div className="page-content">
          {/* Desktop Header */}
          <div className="desktop-header">
            <div>
              <h1 className="page-title">Transaction History</h1>
              {!dataLoading && (
                <p className="page-date">
                  {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            <button onClick={() => router.back()} className="btn-secondary" style={{ padding: '8px 20px' }}>
              <ArrowLeft size={16} /> Back
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="filter-tabs">
            <button 
              onClick={() => setFilter('all')} 
              className={`filter-tab ${filter === 'all' ? 'active all' : ''}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilter('expense')} 
              className={`filter-tab ${filter === 'expense' ? 'active expense' : ''}`}
            >
              Expenses
            </button>
            <button 
              onClick={() => setFilter('income')} 
              className={`filter-tab ${filter === 'income' ? 'active income' : ''}`}
            >
              Income
            </button>
          </div>

          {/* Transactions List */}
          {dataLoading ? (
            <div className="empty-state">
              <div className="loading-spinner" />
              <p>Loading transactions...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <History size={48} />
              <p>No transactions found</p>
              <p className="empty-subtitle">Add your first transaction from the dashboard</p>
            </div>
          ) : (
            <div className="transactions-container">
              {Object.entries(grouped).map(([label, txns]) => (
                <div key={label} className="transaction-group">
                  <p className="group-label">{label}</p>
                  <div className="transaction-group-card">
                    {txns.map((t, index) => (
                      <div key={t.id} className="stagger-item" style={{ animationDelay: `${index * 50}ms` }}>
                        <TransactionRow transaction={t} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="mobile-nav">
          <button onClick={() => router.push('/dashboard')} className="mobile-nav-item">
            <Wallet size={20} />
            <span>Home</span>
          </button>
          <button className="mobile-nav-item active">
            <History size={20} />
            <span>History</span>
          </button>
        </nav>
      </main>
    </div>
  )
}