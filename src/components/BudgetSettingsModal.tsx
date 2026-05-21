"use client";

import { useState, useEffect } from "react";
import { EXPENSE_CATEGORIES, formatNu } from "@/lib/constants";
import { getBudgets, setBudget } from "@/lib/db";
import { X } from "lucide-react";

interface Props {
  userId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function BudgetSettingsModal({
  userId,
  onClose,
  onSuccess,
}: Props) {
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    try {
      const existingBudgets = await getBudgets(userId);
      const budgetsMap: Record<string, number> = {};
      existingBudgets.forEach((b) => {
        budgetsMap[b.category_id] = b.amount_limit;
      });
      setBudgets(budgetsMap);
    } catch (err) {
      console.error("Error loading budgets:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBudgetChange = (categoryId: string, value: string) => {
    const amount = parseFloat(value) || 0;
    if (amount < 0) return;
    setBudgets((prev) => ({ ...prev, [categoryId]: amount }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      for (const [categoryId, amount] of Object.entries(budgets)) {
        if (amount > 0) {
          await setBudget(userId, categoryId, amount);
        }
      }
      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save budgets");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

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
              Budget Settings
            </h2>
            <p
              style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}
            >
              Set monthly limits for each category. You'll get an alert at 80%.
            </p>
            <p
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                marginTop: 8,
                lineHeight: 1.4,
              }}
            >
              💡 Tip: Update or remove a budget to automatically clear its
              alert.
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

        {/* Budget Categories */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            marginBottom: 24,
          }}
        >
          {EXPENSE_CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              style={{ display: "flex", alignItems: "center", gap: 12 }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "var(--bg-muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                {cat.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    marginBottom: 4,
                  }}
                >
                  {cat.name}
                </p>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="No limit"
                  value={budgets[cat.id] || ""}
                  onChange={(e) => handleBudgetChange(cat.id, e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: 12,
                    color: "var(--text-primary)",
                    background: "var(--bg-muted)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontFamily: "DM Mono, monospace",
                  }}
                />
              </div>
            </div>
          ))}
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

        {success && (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              background: "var(--green-dim)",
              border: "1px solid var(--green-dim)",
              marginBottom: 16,
            }}
          >
            <p style={{ color: "var(--green)", fontSize: 13, fontWeight: 500 }}>
              ✓ Budgets saved! Alerts will update automatically.
            </p>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: "100%",
            padding: "16px 0",
            borderRadius: 14,
            background: saving ? "var(--accent-dim)" : "var(--accent)",
            color: "#fff",
            fontWeight: 600,
            fontSize: 16,
            border: "none",
            cursor: saving ? "not-allowed" : "pointer",
            transition: "all 0.2s",
          }}
        >
          {saving ? "Saving..." : "Save Budgets"}
        </button>
      </div>
    </div>
  );
}
