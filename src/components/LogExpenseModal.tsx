"use client";

import { useState, useRef, useEffect } from "react";
import {
  EXPENSE_CATEGORIES,
  QUICK_AMOUNTS,
  today,
  formatNu,
  getCategoryName,
} from "@/lib/constants";
import { logExpense, checkBudgetAlert, getMonthlyExpenses } from "@/lib/db";
import { X, AlertCircle } from "lucide-react";

interface Props {
  userId: string;
  currentBalance: number;
  onClose: () => void;
  onSuccess: (newBalance: number) => void;
}

export default function LogExpenseModal({
  userId,
  currentBalance,
  onClose,
  onSuccess,
}: Props) {
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(today());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [budgetAlert, setBudgetAlert] = useState<{
    triggered: boolean;
    percentage: number;
    categorySpending: number;
    limitAmount: number;
  } | null>(null);
  const [showBudgetWarning, setShowBudgetWarning] = useState(false);

  const amountInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus on amount input when modal opens (works on mobile)
    setTimeout(() => {
      amountInputRef.current?.focus();
    }, 100);
  }, []);

  const parsedAmount = parseFloat(amount) || 0;
  const afterBalance = currentBalance - parsedAmount;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove any non-numeric characters except decimal point
    let value = e.target.value.replace(/[^0-9.]/g, "");
    // Ensure only one decimal point
    const parts = value.split(".");
    if (parts.length > 2) value = parts[0] + "." + parts.slice(1).join("");
    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2)
      value = parts[0] + "." + parts[1].slice(0, 2);
    setAmount(value);
  };

  const handleQuickAmount = (value: number) => {
    setAmount(String(value));
    // Keep focus on input field
    amountInputRef.current?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsedAmount || parsedAmount <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (!categoryId) {
      setError("Select a category");
      return;
    }
    if (parsedAmount > currentBalance) {
      setError("Amount exceeds your balance");
      return;
    }

    // Check budget alert first
    try {
      const monthlyExpenses = await getMonthlyExpenses(userId);
      const alert = await checkBudgetAlert(userId, categoryId, monthlyExpenses);

      if (alert.triggered) {
        setBudgetAlert(alert);
        setShowBudgetWarning(true);
        return;
      }
    } catch {
      // If budget check fails, continue anyway (no budgets set)
    }

    // No budget alert, proceed with logging
    await submitExpense();
  };

  const submitExpense = async () => {
    setLoading(true);
    setError("");
    try {
      const { newBalance } = await logExpense(
        userId,
        parsedAmount,
        categoryId,
        note,
        date,
        currentBalance,
      );
      onSuccess(newBalance);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to log expense");
    } finally {
      setLoading(false);
      setShowBudgetWarning(false);
      setBudgetAlert(null);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "flex-end",
        background: "rgba(0,0,0,0.6)",
        WebkitTapHighlightColor: "transparent",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          margin: "0 auto",
          background: "var(--bg-card)",
          borderRadius: "24px 24px 0 0",
          padding: "20px 20px 36px",
          maxHeight: "90vh",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
        }}
        className="animate-fade-up"
      >
        {/* Handle bar */}
        <div
          style={{
            width: 40,
            height: 4,
            borderRadius: 2,
            background: "var(--border)",
            margin: "0 auto 20px",
          }}
        />

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              Log Expense
            </h2>
            <p
              style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}
            >
              Available:{" "}
              <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>
                {formatNu(currentBalance)}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "var(--bg-muted)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--text-muted)",
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Amount input */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                fontSize: 13,
                color: "var(--text-secondary)",
                display: "block",
                marginBottom: 8,
                fontWeight: 500,
              }}
            >
              Amount (Nu.)
            </label>
            <div style={{ position: "relative" }}>
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
                  fontFamily: "DM Mono, monospace",
                  padding: "14px 16px",
                  textAlign: "center",
                  letterSpacing: "1px",
                }}
                suppressHydrationWarning
              />
            </div>

            {/* Balance preview */}
            {parsedAmount > 0 && (
              <div
                style={{
                  marginTop: 12,
                  padding: "10px 14px",
                  borderRadius: 12,
                  background:
                    afterBalance < 0 ? "var(--red-dim)" : "var(--green-dim)",
                  border: `1px solid ${afterBalance < 0 ? "var(--red-dim)" : "var(--green-dim)"}`,
                }}
              >
                <p
                  style={{
                    fontSize: 13,
                    color: afterBalance < 0 ? "var(--red)" : "var(--green)",
                    fontWeight: 500,
                  }}
                >
                  Balance after: {formatNu(afterBalance)}
                </p>
              </div>
            )}

            {/* Quick amounts */}
            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 14,
                flexWrap: "wrap",
              }}
            >
              {QUICK_AMOUNTS.slice(0, 6).map((a) => (
                <button
                  key={a}
                  type="button"
                  className="amount-chip"
                  onClick={() => handleQuickAmount(a)}
                  style={{
                    flex: "1 0 auto",
                    minWidth: "70px",
                    padding: "12px 8px",
                    fontSize: 14,
                    fontWeight: 500,
                    background:
                      amount === String(a)
                        ? "var(--red-dim)"
                        : "var(--bg-muted)",
                    borderColor:
                      amount === String(a) ? "var(--red)" : "var(--border)",
                    color:
                      amount === String(a)
                        ? "var(--red)"
                        : "var(--text-secondary)",
                  }}
                >
                  Nu. {a >= 1000 ? `${a / 1000}k` : a}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                fontSize: 13,
                color: "var(--text-secondary)",
                display: "block",
                marginBottom: 10,
                fontWeight: 500,
              }}
            >
              Category
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 8,
              }}
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    padding: "12px 8px",
                    borderRadius: 12,
                    cursor: "pointer",
                    border: `1.5px solid ${categoryId === cat.id ? "var(--accent)" : "var(--border)"}`,
                    background:
                      categoryId === cat.id
                        ? "var(--accent-dim)"
                        : "var(--bg-muted)",
                    color:
                      categoryId === cat.id
                        ? "var(--accent)"
                        : "var(--text-secondary)",
                    transition: "all 0.15s",
                    minHeight: "70px",
                  }}
                >
                  <span style={{ fontSize: 24 }}>{cat.icon}</span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: categoryId === cat.id ? 600 : 400,
                      textAlign: "center",
                    }}
                  >
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                fontSize: 13,
                color: "var(--text-secondary)",
                display: "block",
                marginBottom: 8,
                fontWeight: 500,
              }}
            >
              Date
            </label>
            <input
              className="input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={today()}
              style={{ padding: "12px 14px", fontSize: 15 }}
              suppressHydrationWarning
            />
          </div>

          {/* Note */}
          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                fontSize: 13,
                color: "var(--text-secondary)",
                display: "block",
                marginBottom: 8,
                fontWeight: 500,
              }}
            >
              Note{" "}
              <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
                (optional)
              </span>
            </label>
            <input
              className="input"
              type="text"
              inputMode="text"
              placeholder="e.g., lunch at canteen"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{ padding: "12px 14px", fontSize: 14 }}
            />
          </div>

          {error && (
            <div
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                background: "var(--red-dim)",
                border: "1px solid var(--red-dim)",
                marginBottom: 16,
              }}
            >
              <p style={{ color: "var(--red)", fontSize: 13 }}>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "16px 0",
              borderRadius: 14,
              background: loading ? "var(--red-dim)" : "var(--red)",
              color: "#fff",
              fontWeight: 600,
              fontSize: 16,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
            }}
          >
            {loading ? "Logging..." : "Log Expense"}
          </button>
        </form>
      </div>

      {/* Budget Alert Warning Modal */}
      {showBudgetWarning && budgetAlert && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1001,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.7)",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "var(--bg-card)",
              borderRadius: 16,
              padding: "24px",
              maxWidth: 400,
              border: "1px solid var(--red-dim)",
            }}
          >
            <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
              <AlertCircle
                size={20}
                style={{ color: "var(--red)", flexShrink: 0, marginTop: 2 }}
              />
              <div>
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    marginBottom: 8,
                  }}
                >
                  Budget Alert
                </h3>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--text-secondary)",
                    lineHeight: 1.5,
                    marginBottom: 12,
                  }}
                >
                  Your {getCategoryName(categoryId)} spending is at{" "}
                  <strong style={{ color: "var(--red)", fontSize: 14 }}>
                    {budgetAlert.percentage.toFixed(0)}%
                  </strong>{" "}
                  of your monthly budget (Nu. {budgetAlert.limitAmount}).
                </p>
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    lineHeight: 1.4,
                  }}
                >
                  Current: {formatNu(budgetAlert.categorySpending)} • Remaining:{" "}
                  {formatNu(
                    Math.max(
                      0,
                      budgetAlert.limitAmount - budgetAlert.categorySpending,
                    ),
                  )}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => {
                  setShowBudgetWarning(false);
                  setBudgetAlert(null);
                }}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: 10,
                  background: "var(--bg-muted)",
                  border: "1px solid var(--border)",
                  color: "var(--text-secondary)",
                  fontWeight: 500,
                  fontSize: 14,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                Cancel
              </button>
              <button
                onClick={submitExpense}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: 10,
                  background: loading ? "var(--red-dim)" : "var(--red)",
                  border: "none",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                }}
              >
                {loading ? "Logging..." : "Continue Anyway"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
