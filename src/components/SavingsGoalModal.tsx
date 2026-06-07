"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Target, Plus, Trash2 } from "lucide-react";
import { formatNu } from "@/lib/constants";
import {
  getSavingsGoals,
  createSavingsGoal,
  contributeToSavingsGoal,
  deleteSavingsGoal,
} from "@/lib/db";

interface Props {
  userId: string;
  currentBalance: number;
  onClose: () => void;
  onBalanceChange?: (newBalance: number) => void;
}

type Goal = {
  id: string;
  name: string;
  target_amount: number;
  saved_amount: number;
  deadline?: string | null;
  created_at: string;
};

type View = "list" | "add" | "contribute";

export default function SavingsGoalModal({ userId, currentBalance, onClose, onBalanceChange }: Props) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("list");
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [contributeAmount, setContributeAmount] = useState("");

  const loadGoals = useCallback(async () => {
    try {
      const data = await getSavingsGoals(userId);
      setGoals(data as Goal[]);
    } catch (err) {
      console.error("Error loading savings goals:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadGoals();
  }, [loadGoals]);

  const handleBack = () => {
    setView("list");
    setError("");
    setSelectedGoal(null);
    setContributeAmount("");
  };

  const handleAddGoal = async () => {
    if (!name.trim() || !targetAmount) {
      setError("Please enter a goal name and target amount");
      return;
    }
    const amount = parseFloat(targetAmount);
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid target amount");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await createSavingsGoal(userId, name.trim(), amount, deadline || undefined);
      await loadGoals();
      setView("list");
      setName("");
      setTargetAmount("");
      setDeadline("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create goal");
    } finally {
      setSaving(false);
    }
  };

  const handleContribute = async () => {
    if (!selectedGoal || !contributeAmount) {
      setError("Please enter an amount");
      return;
    }
    const amount = parseFloat(contributeAmount);
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    if (amount > currentBalance) {
      setError(`Insufficient balance. You have ${formatNu(currentBalance)} available.`);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const { newBalance } = await contributeToSavingsGoal(
        userId,
        selectedGoal.id,
        amount,
        selectedGoal.saved_amount,
        selectedGoal.target_amount,
        currentBalance,
      );
      onBalanceChange?.(newBalance);
      await loadGoals();
      handleBack();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update goal");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (goalId: string) => {
    if (!confirm("Delete this savings goal?")) return;
    try {
      await deleteSavingsGoal(goalId);
      await loadGoals();
    } catch (err) {
      console.error("Error deleting goal:", err);
    }
  };

  const today = new Date().toISOString().split("T")[0];

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
          padding: "20px 20px 40px",
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
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {view !== "list" && (
              <button
                onClick={handleBack}
                style={{
                  background: "var(--bg-muted)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  padding: "4px 10px",
                  fontSize: 14,
                }}
              >
                ←
              </button>
            )}
            <Target size={20} style={{ color: "var(--accent)" }} />
            <h2
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              {view === "list"
                ? "Savings Goals"
                : view === "add"
                  ? "New Goal"
                  : `Save to Goal`}
            </h2>
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

        {/* Loading */}
        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 0",
              color: "var(--text-muted)",
            }}
          >
            <div
              className="loading-spinner"
              style={{ margin: "0 auto 12px" }}
            />
            <p style={{ fontSize: 14 }}>Loading goals...</p>
          </div>
        ) : view === "list" ? (
          <>
            {/* Summary */}
            {goals.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    background: "var(--accent-dim)",
                    border: "1px solid var(--accent-dim)",
                    borderRadius: 12,
                    padding: "14px 16px",
                  }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      marginBottom: 4,
                    }}
                  >
                    Total Goals
                  </p>
                  <p
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: "var(--accent)",
                      fontFamily: "DM Mono, monospace",
                    }}
                  >
                    {goals.length}
                  </p>
                </div>
                <div
                  style={{
                    background: "var(--green-dim)",
                    border: "1px solid var(--green-dim)",
                    borderRadius: 12,
                    padding: "14px 16px",
                  }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      marginBottom: 4,
                    }}
                  >
                    Completed
                  </p>
                  <p
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: "var(--green)",
                      fontFamily: "DM Mono, monospace",
                    }}
                  >
                    {goals.filter((g) => g.saved_amount >= g.target_amount).length}
                  </p>
                </div>
              </div>
            )}

            {/* Goals List */}
            {goals.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "36px 0",
                  color: "var(--text-muted)",
                }}
              >
                <Target
                  size={44}
                  style={{ opacity: 0.25, margin: "0 auto 14px", display: "block" }}
                />
                <p style={{ fontSize: 14, marginBottom: 6, fontWeight: 500 }}>
                  No savings goals yet
                </p>
                <p style={{ fontSize: 12, lineHeight: 1.5 }}>
                  Set a goal and track your progress toward financial milestones
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                {goals.map((goal) => {
                  const pct =
                    goal.target_amount > 0
                      ? Math.min(
                          (goal.saved_amount / goal.target_amount) * 100,
                          100,
                        )
                      : 0;
                  const isComplete = pct >= 100;
                  const remaining = goal.target_amount - goal.saved_amount;
                  return (
                    <div
                      key={goal.id}
                      style={{
                        background: "var(--bg-muted)",
                        border: `1px solid ${isComplete ? "var(--green-dim)" : "var(--border)"}`,
                        borderRadius: 14,
                        padding: 16,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: 10,
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              marginBottom: 3,
                            }}
                          >
                            {isComplete && (
                              <span style={{ fontSize: 14 }}>🎉</span>
                            )}
                            <p
                              style={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: "var(--text-primary)",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {goal.name}
                            </p>
                          </div>
                          {goal.deadline && !isComplete && (
                            <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
                              Due:{" "}
                              {new Date(goal.deadline).toLocaleDateString(
                                "en-IN",
                                { day: "numeric", month: "short", year: "numeric" },
                              )}
                            </p>
                          )}
                          {isComplete && (
                            <p
                              style={{
                                fontSize: 11,
                                color: "var(--green)",
                                fontWeight: 500,
                              }}
                            >
                              Goal reached!
                            </p>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 10 }}>
                          {!isComplete && (
                            <button
                              onClick={() => {
                                setSelectedGoal(goal);
                                setView("contribute");
                              }}
                              style={{
                                padding: "5px 12px",
                                borderRadius: 8,
                                background: "var(--accent-dim)",
                                border: "none",
                                color: "var(--accent)",
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              + Save
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(goal.id)}
                            style={{
                              padding: "5px 8px",
                              borderRadius: 8,
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              color: "var(--text-muted)",
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Progress */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            color: "var(--text-muted)",
                            fontFamily: "DM Mono, monospace",
                          }}
                        >
                          {formatNu(goal.saved_amount)} /{" "}
                          {formatNu(goal.target_amount)}
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: isComplete ? "var(--green)" : "var(--accent)",
                            fontFamily: "DM Mono, monospace",
                          }}
                        >
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${pct}%`,
                            background: isComplete
                              ? "var(--green)"
                              : pct >= 75
                                ? "#f5a623"
                                : "var(--accent)",
                          }}
                        />
                      </div>
                      {!isComplete && (
                        <p
                          style={{
                            fontSize: 11,
                            color: "var(--text-muted)",
                            marginTop: 6,
                          }}
                        >
                          {formatNu(remaining)} remaining
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add Goal Button */}
            <button
              onClick={() => setView("add")}
              style={{
                width: "100%",
                padding: "14px 0",
                borderRadius: 14,
                background: "transparent",
                border: "1.5px dashed var(--accent)",
                color: "var(--accent)",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--accent-dim)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <Plus size={16} />
              Add New Goal
            </button>
          </>
        ) : view === "add" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  marginBottom: 8,
                }}
              >
                Goal Name
              </p>
              <input
                type="text"
                placeholder="e.g. New Laptop, Trip to Paro"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  fontSize: 14,
                  color: "var(--text-primary)",
                  background: "var(--bg-muted)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                }}
              />
            </div>
            <div>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  marginBottom: 8,
                }}
              >
                Target Amount (Nu.)
              </p>
              <input
                type="text"
                inputMode="decimal"
                placeholder="e.g. 5000"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  fontSize: 14,
                  color: "var(--text-primary)",
                  background: "var(--bg-muted)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  fontFamily: "DM Mono, monospace",
                }}
              />
            </div>
            <div>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  marginBottom: 8,
                }}
              >
                Deadline{" "}
                <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
                  (optional)
                </span>
              </p>
              <input
                type="date"
                value={deadline}
                min={today}
                onChange={(e) => setDeadline(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  fontSize: 14,
                  color: "var(--text-primary)",
                  background: "var(--bg-muted)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                }}
              />
            </div>

            {error && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "var(--red-dim)",
                  border: "1px solid var(--red-dim)",
                }}
              >
                <p style={{ color: "var(--red)", fontSize: 13 }}>{error}</p>
              </div>
            )}

            <button
              onClick={handleAddGoal}
              disabled={saving}
              style={{
                width: "100%",
                padding: "15px 0",
                borderRadius: 14,
                background: saving ? "var(--accent-dim)" : "var(--accent)",
                color: "#fff",
                fontWeight: 600,
                fontSize: 15,
                border: "none",
                cursor: saving ? "not-allowed" : "pointer",
                transition: "all 0.2s",
              }}
            >
              {saving ? "Creating..." : "Create Goal"}
            </button>
          </div>
        ) : (
          /* Contribute view */
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {selectedGoal && (() => {
              const contribution = parseFloat(contributeAmount) || 0;
              const newSaved = Math.min(selectedGoal.saved_amount + contribution, selectedGoal.target_amount);
              const newBalance = currentBalance - contribution;
              const newPct = selectedGoal.target_amount > 0 ? Math.min((newSaved / selectedGoal.target_amount) * 100, 100) : 0;
              const currentPct = selectedGoal.target_amount > 0 ? Math.min((selectedGoal.saved_amount / selectedGoal.target_amount) * 100, 100) : 0;
              const willComplete = newSaved >= selectedGoal.target_amount;
              return (
              <>
                {/* Goal progress card */}
                <div
                  style={{
                    background: "var(--accent-dim)",
                    border: "1px solid var(--accent-dim)",
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  <p
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      marginBottom: 10,
                    }}
                  >
                    {selectedGoal.name}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      Goal progress
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--accent)",
                        fontFamily: "DM Mono, monospace",
                      }}
                    >
                      {formatNu(selectedGoal.saved_amount)} /{" "}
                      {formatNu(selectedGoal.target_amount)}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${currentPct}%`,
                        background: "var(--accent)",
                      }}
                    />
                  </div>
                  <p
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      marginTop: 5,
                    }}
                  >
                    {formatNu(selectedGoal.target_amount - selectedGoal.saved_amount)} remaining to goal
                  </p>
                </div>

                {/* Amount input */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: "var(--text-secondary)",
                      }}
                    >
                      Amount to Save (Nu.)
                    </p>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      Balance: <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>{formatNu(currentBalance)}</span>
                    </span>
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={contributeAmount}
                    onChange={(e) => setContributeAmount(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "14px",
                      fontSize: 24,
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      background: "var(--bg-muted)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      fontFamily: "DM Mono, monospace",
                      textAlign: "center",
                    }}
                    autoFocus
                  />
                </div>

                {/* Live preview — only show when amount > 0 */}
                {contribution > 0 && (
                  <div
                    style={{
                      borderRadius: 12,
                      border: `1px solid ${newBalance < 0 ? "var(--red-dim)" : "var(--border)"}`,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        padding: "10px 14px",
                        background: "var(--bg-muted)",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Preview
                    </div>
                    <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                      {/* New balance */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Your balance after</span>
                        <span style={{
                          fontSize: 14,
                          fontWeight: 700,
                          fontFamily: "DM Mono, monospace",
                          color: newBalance < 0 ? "var(--red)" : "var(--green)",
                        }}>
                          {formatNu(Math.max(newBalance, 0))}
                        </span>
                      </div>
                      {/* New goal progress */}
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Goal progress after</span>
                          <span style={{
                            fontSize: 13,
                            fontWeight: 700,
                            fontFamily: "DM Mono, monospace",
                            color: willComplete ? "var(--green)" : "var(--accent)",
                          }}>
                            {newPct.toFixed(0)}%
                          </span>
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${newPct}%`,
                              background: willComplete ? "var(--green)" : "var(--accent)",
                              transition: "width 0.4s ease",
                            }}
                          />
                        </div>
                        {willComplete && (
                          <p style={{ fontSize: 12, color: "var(--green)", marginTop: 6, fontWeight: 600 }}>
                            🎉 This will complete your goal!
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: 10,
                      background: "var(--red-dim)",
                      border: "1px solid var(--red-dim)",
                    }}
                  >
                    <p style={{ color: "var(--red)", fontSize: 13 }}>{error}</p>
                  </div>
                )}

                <button
                  onClick={handleContribute}
                  disabled={saving || (parseFloat(contributeAmount) || 0) <= 0}
                  style={{
                    width: "100%",
                    padding: "15px 0",
                    borderRadius: 14,
                    background: saving ? "var(--green-dim)" : "var(--green)",
                    color: saving ? "var(--green)" : "#fff",
                    fontWeight: 700,
                    fontSize: 15,
                    border: "none",
                    cursor: (saving || (parseFloat(contributeAmount) || 0) <= 0) ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                    opacity: (parseFloat(contributeAmount) || 0) <= 0 ? 0.5 : 1,
                  }}
                >
                  {saving ? "Saving..." : `Save ${contribution > 0 ? formatNu(contribution) : ""} to Goal`}
                </button>
              </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
