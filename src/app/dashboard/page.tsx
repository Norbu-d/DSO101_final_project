"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  getRecentTransactions,
  getMonthlyExpenses,
  deleteExpense,
  getCategoryTotals,
  getMonthlyTotal,
  getDailyAverage,
  getUserBudgetAlerts,
} from "@/lib/db";
import { EXPENSE_CATEGORIES, formatNu, getCategoryName } from "@/lib/constants";
import LogExpenseModal from "@/components/LogExpenseModal";
import ReceivedMoneyModal from "@/components/ReceivedMoneyModal";
import BudgetSettingsModal from "@/components/BudgetSettingsModal";
import TransactionRow from "@/components/TransactionRow";
import { supabase } from "@/lib/supabase";
import {
  LogOut,
  History,
  Wallet,
  Bell,
  TrendingUp,
  TrendingDown,
  PieChart,
  Home,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Coffee,
  ShoppingBag,
  Bus,
  BookOpen,
  Zap,
  AlertCircle,
  X,
} from "lucide-react";

type Transaction = {
  id: string;
  type: "expense" | "income";
  amount: number;
  category_id?: string;
  source?: string;
  note: string | null;
  date: string;
  created_at?: string;
};

const BAR_COLORS = ["#7c6ff7", "#e05a30", "#28a05f", "#f5a623", "#5bc0eb"];

export default function DashboardPage() {
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const router = useRouter();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState<
    Array<{ amount: number; category_id: string; date: string }>
  >([]);
  const [balance, setBalance] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);
  const [showExpense, setShowExpense] = useState(false);
  const [showIncome, setShowIncome] = useState(false);
  const [budgetAlerts, setBudgetAlerts] = useState<any[]>([]);
  const [showBudgetSettings, setShowBudgetSettings] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    if (!loading && !user) router.push("/auth");
  }, [user, loading, router]);

  useEffect(() => {
    // Initialize balance from profile when it loads
    if (profile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBalance(profile.current_balance);
    }
  }, [profile]);

  const loadData = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    try {
      const [txns, monthly] = await Promise.all([
        getRecentTransactions(user.id),
        getMonthlyExpenses(user.id),
      ]);
      setTransactions(txns as Transaction[]);
      setMonthlyExpenses(monthly);

      // Load budget alerts
      try {
        const alerts = await getUserBudgetAlerts(user.id, monthly);
        setBudgetAlerts(alerts);
        // Clear dismissed alerts when data reloads
        setDismissedAlerts(new Set());
      } catch (err) {
        // No budgets set, skip alerts
      }
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Load data when user changes
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (user) loadData();
  }, [user, loadData]);

  const handleExpenseSuccess = (newBalance: number) => {
    setBalance(newBalance);
    setShowExpense(false);
    loadData();
    refreshProfile();
  };
  const handleIncomeSuccess = (newBalance: number) => {
    setBalance(newBalance);
    setShowIncome(false);
    loadData();
    refreshProfile();
  };
  const handleDelete = async (
    id: string,
    amount: number,
    type: "expense" | "income",
  ) => {
    if (!user || !confirm("Delete this transaction?")) return;
    if (type === "expense") {
      const newBal = await deleteExpense(id, user.id, amount, balance);
      setBalance(newBal);
    } else {
      await supabase.from("income_entries").delete().eq("id", id);
      const newBal = balance - amount;
      await supabase
        .from("users")
        .update({ current_balance: newBal })
        .eq("id", user.id);
      setBalance(newBal);
    }
    loadData();
    refreshProfile();
  };

  const handleDismissAlert = (categoryId: string) => {
    setDismissedAlerts((prev) => new Set(prev).add(categoryId));
  };

  const categoryTotals = getCategoryTotals(monthlyExpenses);
  const monthlyTotal = getMonthlyTotal(monthlyExpenses);
  const dailyAvg = getDailyAverage(monthlyExpenses);
  const monthlyReceived = transactions
    .filter((t) => {
      if (t.type !== "income") return false;
      const d = new Date(t.date),
        now = new Date();
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    })
    .reduce((s, t) => s + t.amount, 0);

  const savings = monthlyReceived - monthlyTotal;
  const savingsRate =
    monthlyReceived > 0 ? (savings / monthlyReceived) * 100 : 0;

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 40,
              height: 40,
              border: "3px solid var(--border)",
              borderTopColor: "var(--accent)",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <p style={{ color: "var(--text-muted)" }}>
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  if (!user || !profile) return null;

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src="/image.png" alt="TenPhel" style={{ width: 60, height: 60, objectFit: 'contain' }} />
          <span className="logo-text">TenPhel</span>
        </div>

        <nav className="sidebar-nav">
          <button
            onClick={() => router.push("/dashboard")}
            className="nav-item active"
          >
            <Home size={18} />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => router.push("/dashboard/history")}
            className="nav-item"
          >
            <History size={18} />
            <span>History</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="user-name">{profile.name}</p>
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
          <div>
            <p className="greeting-text">Good day,</p>
            <h1 className="user-greeting">{profile.name.split(" ")[0]}</h1>
          </div>
          <div className="header-actions">
            <button className="icon-btn">
              <Bell size={18} />
            </button>
            <button onClick={signOut} className="icon-btn">
              <LogOut size={18} />
            </button>
          </div>
        </div>

        <div className="page-content">
          {/* Desktop Header */}
          <div className="desktop-header">
            <div>
              <h1 className="page-title">Dashboard</h1>
              <p className="page-date">
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="header-stats">
              <div className="stat-badge">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <Calendar size={14} />
                  <span>This Month</span>
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-grid">
            {/* Left Column */}
            <div className="dashboard-left">
              {/* Balance Card */}
              <div className="balance-card">
                <div className="balance-glow" />
                <div className="balance-content">
                  <p className="balance-label">Current Balance</p>
                  <p className="balance-amount">{formatNu(balance)}</p>
                  <div className="balance-stats">
                    <div className="stat-item">
                      <TrendingUp size={12} />
                      <div>
                        <p className="stat-label">Received</p>
                        <p className="stat-value">
                          {formatNu(monthlyReceived)}
                        </p>
                      </div>
                    </div>
                    <div className="stat-divider" />
                    <div className="stat-item">
                      <TrendingDown size={12} />
                      <div>
                        <p className="stat-label">Spent</p>
                        <p className="stat-value">{formatNu(monthlyTotal)}</p>
                      </div>
                    </div>
                    <div className="stat-divider" />
                    <div className="stat-item">
                      <Zap size={12} />
                      <div>
                        <p className="stat-label">Saved</p>
                        <p
                          className="stat-value"
                          style={{
                            color: savings >= 0 ? "var(--green)" : "var(--red)",
                          }}
                        >
                          {formatNu(savings)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="action-buttons">
                <button
                  onClick={() => setShowIncome(true)}
                  className="action-btn income"
                >
                  <ArrowUpRight size={18} />
                  <span>Add Income</span>
                </button>
                <button
                  onClick={() => setShowExpense(true)}
                  className="action-btn expense"
                >
                  <ArrowDownRight size={18} />
                  <span>Add Expense</span>
                </button>
              </div>

              {/* Budget Alerts */}
              {budgetAlerts.filter(
                (a: any) => !dismissedAlerts.has(a.categoryId),
              ).length > 0 && (
                <div
                  style={{
                    background: "var(--red-dim)",
                    border: "1px solid var(--red-dim)",
                    borderRadius: 16,
                    padding: "16px",
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                      marginBottom: 12,
                    }}
                  >
                    <AlertCircle
                      size={18}
                      style={{
                        color: "var(--red)",
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "var(--red)",
                          marginBottom: 4,
                        }}
                      >
                        Budget Warning
                      </p>
                      <p
                        style={{
                          fontSize: 12,
                          color: "var(--red)",
                          opacity: 0.85,
                          lineHeight: 1.4,
                        }}
                      >
                        You've spent{" "}
                        {budgetAlerts.filter(
                          (a: any) => !dismissedAlerts.has(a.categoryId),
                        ).length === 1
                          ? "a lot in one category"
                          : "a lot across multiple categories"}{" "}
                        -{" "}
                        {budgetAlerts
                          .filter(
                            (a: any) => !dismissedAlerts.has(a.categoryId),
                          )
                          .some((a: any) => a.percentage >= 100)
                          ? "you've exceeded your budget"
                          : "you're approaching your budget limit"}
                        .
                      </p>
                    </div>
                  </div>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    {budgetAlerts
                      .filter((a: any) => !dismissedAlerts.has(a.categoryId))
                      .map((alert: any) => (
                        <div
                          key={alert.categoryId}
                          style={{
                            padding: "10px 12px",
                            background: "rgba(224, 90, 48, 0.1)",
                            borderRadius: 10,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              flex: 1,
                              minWidth: 0,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 12,
                                color: "var(--text-primary)",
                                fontWeight: 500,
                              }}
                            >
                              {getCategoryName(alert.categoryId)}
                            </span>
                            <span
                              style={{
                                fontSize: 11,
                                color: "var(--text-muted)",
                              }}
                            >
                              {alert.percentage >= 100
                                ? `(+${formatNu(alert.categorySpending - alert.limitAmount)} over)`
                                : `(${formatNu(alert.limitAmount - alert.categorySpending)} left)`}
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: "var(--red)",
                                fontFamily: "DM Mono, monospace",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {alert.percentage.toFixed(0)}%
                            </span>
                            <button
                              onClick={() =>
                                handleDismissAlert(alert.categoryId)
                              }
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: "var(--text-muted)",
                                padding: "4px",
                                display: "flex",
                                alignItems: "center",
                                opacity: 0.6,
                                transition: "opacity 0.2s",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.opacity = "1")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.opacity = "0.6")
                              }
                              title="Dismiss alert"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Spending Insights */}
              {monthlyExpenses.length > 0 && (
                <div className="insights-card">
                  <div className="card-header">
                    <div className="card-title">
                      <PieChart size={18} />
                      <h3>Spending Insights</h3>
                    </div>
                    <div
                      style={{ display: "flex", gap: 8, alignItems: "center" }}
                    >
                      <span className="badge">This month</span>
                      <button
                        onClick={() => setShowBudgetSettings(true)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 8,
                          background: "var(--accent-dim)",
                          border: "1px solid var(--accent-dim)",
                          color: "var(--accent)",
                          fontSize: 11,
                          fontWeight: 500,
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "var(--accent)";
                          e.currentTarget.style.color = "#fff";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background =
                            "var(--accent-dim)";
                          e.currentTarget.style.color = "var(--accent)";
                        }}
                      >
                        Set Budgets
                      </button>
                    </div>
                  </div>

                  <div className="insights-stats">
                    <div className="insight-item">
                      <p className="insight-label">Daily Average</p>
                      <p className="insight-value">{formatNu(dailyAvg)}</p>
                    </div>
                    <div className="insight-item">
                      <p className="insight-label">Transactions</p>
                      <p className="insight-value">{monthlyExpenses.length}</p>
                    </div>
                    <div className="insight-item">
                      <p className="insight-label">Savings Rate</p>
                      <p
                        className="insight-value"
                        style={{
                          color:
                            savingsRate >= 0 ? "var(--green)" : "var(--red)",
                        }}
                      >
                        {savingsRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="categories-section">
                    <p className="categories-title">Top Categories</p>
                    {categoryTotals.slice(0, 3).map(({ id, total }, i) => {
                      const cat = EXPENSE_CATEGORIES.find((c) => c.id === id);
                      const percentage =
                        monthlyTotal > 0 ? (total / monthlyTotal) * 100 : 0;
                      const CategoryIcon = getCategoryIcon(id);
                      return (
                        <div key={id} className="category-item">
                          <div className="category-info">
                            <div className="category-name">
                              <CategoryIcon size={14} />
                              <span>{cat?.name || id}</span>
                            </div>
                            <span className="category-amount">
                              {formatNu(total)}
                            </span>
                          </div>
                          <div className="progress-bar">
                            <div
                              className="progress-fill"
                              style={{
                                width: `${percentage}%`,
                                background: BAR_COLORS[i],
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Recent Transactions */}
            <div className="transactions-card">
              <div className="card-header">
                <div className="card-title">
                  <Wallet size={18} />
                  <h3>Recent Transactions</h3>
                </div>
                {transactions.length > 5 && (
                  <button
                    onClick={() => router.push("/dashboard/history")}
                    className="view-all-btn"
                  >
                    View All
                  </button>
                )}
              </div>

              <div className="transactions-list">
                {dataLoading ? (
                  <div className="empty-state">
                    <div className="loading-spinner" />
                    <p>Loading transactions...</p>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="empty-state">
                    <CreditCard size={48} />
                    <p>No transactions yet</p>
                    <p className="empty-subtitle">
                      Add your first expense or income
                    </p>
                  </div>
                ) : (
                  transactions.slice(0, 10).map((transaction, index) => (
                    <div
                      key={transaction.id}
                      className="stagger-item"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TransactionRow
                        transaction={transaction}
                        onDelete={handleDelete}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="mobile-nav">
          <button
            onClick={() => router.push("/dashboard")}
            className="mobile-nav-item active"
          >
            <Home size={20} />
            <span>Home</span>
          </button>
          <button
            onClick={() => router.push("/dashboard/history")}
            className="mobile-nav-item"
          >
            <History size={20} />
            <span>History</span>
          </button>
        </nav>
      </main>

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
      {showBudgetSettings && (
        <BudgetSettingsModal
          userId={user.id}
          onClose={() => setShowBudgetSettings(false)}
          onSuccess={loadData}
        />
      )}

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

// Helper function to get category icon
function getCategoryIcon(categoryId: string) {
  const icons: Record<string, React.ComponentType<{ size: number }>> = {
    food: Coffee,
    transport: Bus,
    entertainment: ShoppingBag,
    education: BookOpen,
    shopping: ShoppingBag,
    utilities: Zap,
  };
  return icons[categoryId] || CreditCard;
}
