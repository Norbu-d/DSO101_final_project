"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Users, Plus, Trash2, Check, Clock } from "lucide-react";
import { formatNu } from "@/lib/constants";
import {
  createBillSplit,
  getBillSplits,
  toggleParticipantPaid,
  deleteBillSplit,
  type BillSplit,
} from "@/lib/db";

interface Props {
  userId: string;
  onClose: () => void;
}

type Tab = "new" | "history";
type SplitType = "equal" | "custom";

type Participant = {
  name: string;
  share: string;
};

export default function BillSplitModal({ userId, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("new");
  const [splitType, setSplitType] = useState<SplitType>("equal");
  const [title, setTitle] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([
    { name: "", share: "" },
    { name: "", share: "" },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [splitResult, setSplitResult] = useState<BillSplit | null>(null);

  const [history, setHistory] = useState<BillSplit[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const data = await getBillSplits(userId);
      setHistory(data);
    } catch (err) {
      console.error("Error loading bill splits:", err);
    } finally {
      setHistoryLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (tab === "history") loadHistory();
  }, [tab, loadHistory]);

  const total = parseFloat(totalAmount) || 0;
  const equalShare = participants.length > 0 ? total / participants.length : 0;

  const addParticipant = () => {
    setParticipants((prev) => [...prev, { name: "", share: "" }]);
  };

  const removeParticipant = (idx: number) => {
    if (participants.length <= 2) return;
    setParticipants((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateParticipant = (idx: number, field: keyof Participant, value: string) => {
    setParticipants((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p)),
    );
  };

  const getCustomTotal = () =>
    participants.reduce((sum, p) => sum + (parseFloat(p.share) || 0), 0);

  const handleSplit = async () => {
    if (!title.trim()) {
      setError("Please enter a bill title");
      return;
    }
    if (!total || total <= 0) {
      setError("Please enter a valid total amount");
      return;
    }
    if (participants.some((p) => !p.name.trim())) {
      setError("Please enter a name for each person");
      return;
    }
    if (splitType === "custom") {
      const customTotal = getCustomTotal();
      if (Math.abs(customTotal - total) > 0.01) {
        setError(
          `Custom shares (${formatNu(customTotal)}) must equal the total (${formatNu(total)})`,
        );
        return;
      }
    }

    setSaving(true);
    setError("");
    try {
      const splitParticipants = participants.map((p) => ({
        name: p.name.trim(),
        share_amount:
          splitType === "equal"
            ? parseFloat(equalShare.toFixed(2))
            : parseFloat(parseFloat(p.share).toFixed(2)),
      }));
      const result = await createBillSplit(
        userId,
        title.trim(),
        total,
        splitParticipants,
      );
      // Fetch the full split with participants to show result
      const allSplits = await getBillSplits(userId);
      const created = allSplits.find((s) => s.id === result.id) || null;
      setSplitResult(created);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create split");
    } finally {
      setSaving(false);
    }
  };

  const handleNewSplit = () => {
    setSplitResult(null);
    setTitle("");
    setTotalAmount("");
    setParticipants([{ name: "", share: "" }, { name: "", share: "" }]);
    setSplitType("equal");
    setError("");
  };

  const handleTogglePaid = async (splitId: string, participantId: string, isPaid: boolean) => {
    try {
      await toggleParticipantPaid(participantId, !isPaid);
      setHistory((prev) =>
        prev.map((s) =>
          s.id === splitId
            ? {
                ...s,
                bill_split_participants: s.bill_split_participants.map((p) =>
                  p.id === participantId ? { ...p, is_paid: !isPaid } : p,
                ),
              }
            : s,
        ),
      );
    } catch (err) {
      console.error("Error toggling paid status:", err);
    }
  };

  const handleDeleteSplit = async (splitId: string) => {
    if (!confirm("Delete this bill split?")) return;
    try {
      await deleteBillSplit(splitId);
      setHistory((prev) => prev.filter((s) => s.id !== splitId));
    } catch (err) {
      console.error("Error deleting split:", err);
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
          padding: "20px 20px 40px",
          maxHeight: "92vh",
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
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Users size={20} style={{ color: "var(--yellow)" }} />
            <h2
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              Split Bill
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

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            background: "var(--bg-muted)",
            borderRadius: 12,
            padding: 4,
            marginBottom: 24,
            gap: 4,
          }}
        >
          {(["new", "history"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                padding: "9px 0",
                borderRadius: 9,
                border: "none",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
                background: tab === t ? "var(--bg-card)" : "transparent",
                color: tab === t ? "var(--text-primary)" : "var(--text-muted)",
                boxShadow:
                  tab === t ? "0 1px 3px rgba(0,0,0,0.2)" : "none",
              }}
            >
              {t === "new" ? "New Split" : "History"}
            </button>
          ))}
        </div>

        {tab === "new" ? (
          splitResult ? (
            /* Result view */
            <div>
              <div
                style={{
                  textAlign: "center",
                  marginBottom: 24,
                  padding: "16px 0",
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    background: "var(--yellow-dim)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 12px",
                  }}
                >
                  <Users size={24} style={{ color: "var(--yellow)" }} />
                </div>
                <h3
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    marginBottom: 4,
                  }}
                >
                  {splitResult.title}
                </h3>
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  Total: {formatNu(splitResult.total_amount)}
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  marginBottom: 24,
                }}
              >
                {splitResult.bill_split_participants.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "14px 16px",
                      background: "var(--bg-muted)",
                      borderRadius: 12,
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background: "var(--yellow-dim)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 14,
                          fontWeight: 700,
                          color: "var(--yellow)",
                        }}
                      >
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: "var(--text-primary)",
                        }}
                      >
                        {p.name}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: "var(--yellow)",
                        fontFamily: "DM Mono, monospace",
                      }}
                    >
                      {formatNu(p.share_amount)}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => {
                    setTab("history");
                    loadHistory();
                    handleNewSplit();
                  }}
                  style={{
                    flex: 1,
                    padding: "13px 0",
                    borderRadius: 12,
                    background: "var(--bg-muted)",
                    border: "1px solid var(--border)",
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  View History
                </button>
                <button
                  onClick={handleNewSplit}
                  style={{
                    flex: 1,
                    padding: "13px 0",
                    borderRadius: 12,
                    background: "var(--yellow)",
                    border: "none",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  New Split
                </button>
              </div>
            </div>
          ) : (
            /* New split form */
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Title */}
              <div>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                    marginBottom: 8,
                  }}
                >
                  Bill Title
                </p>
                <input
                  type="text"
                  placeholder="e.g. Dinner, Movie tickets, Trip costs"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
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

              {/* Total Amount */}
              <div>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                    marginBottom: 8,
                  }}
                >
                  Total Amount (Nu.)
                </p>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px",
                    fontSize: 22,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    background: "var(--bg-muted)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontFamily: "DM Mono, monospace",
                    textAlign: "center",
                  }}
                />
              </div>

              {/* Split Type Toggle */}
              <div>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                    marginBottom: 8,
                  }}
                >
                  Split Type
                </p>
                <div
                  style={{
                    display: "flex",
                    background: "var(--bg-muted)",
                    borderRadius: 10,
                    padding: 3,
                    gap: 3,
                  }}
                >
                  {(["equal", "custom"] as SplitType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setSplitType(type)}
                      style={{
                        flex: 1,
                        padding: "8px 0",
                        borderRadius: 8,
                        border: "none",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.2s",
                        background:
                          splitType === type ? "var(--yellow)" : "transparent",
                        color: splitType === type ? "#fff" : "var(--text-muted)",
                      }}
                    >
                      {type === "equal" ? "Equal Split" : "Custom Amounts"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Participants */}
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "var(--text-secondary)",
                    }}
                  >
                    People ({participants.length})
                  </p>
                  {splitType === "equal" && total > 0 && (
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--yellow)",
                        fontWeight: 600,
                        fontFamily: "DM Mono, monospace",
                      }}
                    >
                      {formatNu(equalShare)} each
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {participants.map((p, idx) => (
                    <div
                      key={idx}
                      style={{ display: "flex", gap: 8, alignItems: "center" }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: "var(--yellow-dim)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 700,
                          color: "var(--yellow)",
                          flexShrink: 0,
                        }}
                      >
                        {idx + 1}
                      </div>
                      <input
                        type="text"
                        placeholder={`Person ${idx + 1}`}
                        value={p.name}
                        onChange={(e) =>
                          updateParticipant(idx, "name", e.target.value)
                        }
                        style={{
                          flex: 1,
                          padding: "10px 12px",
                          fontSize: 13,
                          color: "var(--text-primary)",
                          background: "var(--bg-muted)",
                          border: "1px solid var(--border)",
                          borderRadius: 10,
                        }}
                      />
                      {splitType === "custom" && (
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="Amount"
                          value={p.share}
                          onChange={(e) =>
                            updateParticipant(idx, "share", e.target.value)
                          }
                          style={{
                            width: 90,
                            padding: "10px 10px",
                            fontSize: 13,
                            color: "var(--text-primary)",
                            background: "var(--bg-muted)",
                            border: "1px solid var(--border)",
                            borderRadius: 10,
                            fontFamily: "DM Mono, monospace",
                            flexShrink: 0,
                          }}
                        />
                      )}
                      <button
                        onClick={() => removeParticipant(idx)}
                        disabled={participants.length <= 2}
                        style={{
                          padding: "8px",
                          borderRadius: 8,
                          background: "transparent",
                          border: "none",
                          cursor:
                            participants.length <= 2 ? "not-allowed" : "pointer",
                          color:
                            participants.length <= 2
                              ? "var(--border)"
                              : "var(--text-muted)",
                          display: "flex",
                          alignItems: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                {splitType === "custom" && total > 0 && (
                  <div
                    style={{
                      marginTop: 10,
                      padding: "8px 12px",
                      borderRadius: 8,
                      background:
                        Math.abs(getCustomTotal() - total) < 0.01
                          ? "var(--green-dim)"
                          : "var(--red-dim)",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        color:
                          Math.abs(getCustomTotal() - total) < 0.01
                            ? "var(--green)"
                            : "var(--red)",
                      }}
                    >
                      Assigned
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        fontFamily: "DM Mono, monospace",
                        color:
                          Math.abs(getCustomTotal() - total) < 0.01
                            ? "var(--green)"
                            : "var(--red)",
                      }}
                    >
                      {formatNu(getCustomTotal())} / {formatNu(total)}
                    </span>
                  </div>
                )}

                <button
                  onClick={addParticipant}
                  style={{
                    width: "100%",
                    marginTop: 10,
                    padding: "10px 0",
                    borderRadius: 10,
                    background: "transparent",
                    border: "1px dashed var(--border)",
                    color: "var(--text-muted)",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--yellow)";
                    e.currentTarget.style.color = "var(--yellow)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.color = "var(--text-muted)";
                  }}
                >
                  <Plus size={14} />
                  Add Person
                </button>
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
                onClick={handleSplit}
                disabled={saving}
                style={{
                  width: "100%",
                  padding: "15px 0",
                  borderRadius: 14,
                  background: saving ? "var(--yellow-dim)" : "var(--yellow)",
                  color: saving ? "var(--yellow)" : "#fff",
                  fontWeight: 700,
                  fontSize: 15,
                  border: "none",
                  cursor: saving ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                }}
              >
                {saving ? "Splitting..." : "Split the Bill"}
              </button>
            </div>
          )
        ) : (
          /* History tab */
          <div>
            {historyLoading ? (
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
                <p style={{ fontSize: 14 }}>Loading history...</p>
              </div>
            ) : history.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 0",
                  color: "var(--text-muted)",
                }}
              >
                <Clock
                  size={44}
                  style={{ opacity: 0.25, margin: "0 auto 14px", display: "block" }}
                />
                <p style={{ fontSize: 14, marginBottom: 6, fontWeight: 500 }}>
                  No splits yet
                </p>
                <p style={{ fontSize: 12 }}>
                  Create your first bill split to see it here
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {history.map((split) => {
                  const paidCount = split.bill_split_participants.filter(
                    (p) => p.is_paid,
                  ).length;
                  const total2 = split.bill_split_participants.length;
                  return (
                    <div
                      key={split.id}
                      style={{
                        background: "var(--bg-muted)",
                        border: "1px solid var(--border)",
                        borderRadius: 14,
                        padding: 16,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: 12,
                        }}
                      >
                        <div>
                          <p
                            style={{
                              fontSize: 14,
                              fontWeight: 600,
                              color: "var(--text-primary)",
                              marginBottom: 3,
                            }}
                          >
                            {split.title}
                          </p>
                          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                            {new Date(split.created_at).toLocaleDateString(
                              "en-IN",
                              { day: "numeric", month: "short", year: "numeric" },
                            )}{" "}
                            · {formatNu(split.total_amount)} total ·{" "}
                            <span style={{ color: paidCount === total2 ? "var(--green)" : "var(--yellow)" }}>
                              {paidCount}/{total2} paid
                            </span>
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteSplit(split.id)}
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
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {split.bill_split_participants.map((p) => (
                          <div
                            key={p.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "8px 10px",
                              background: p.is_paid
                                ? "var(--green-dim)"
                                : "var(--bg-card)",
                              borderRadius: 8,
                              border: `1px solid ${p.is_paid ? "var(--green-dim)" : "var(--border)"}`,
                              transition: "all 0.2s",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 13,
                                  color: p.is_paid
                                    ? "var(--green)"
                                    : "var(--text-secondary)",
                                  fontWeight: 500,
                                  textDecoration: p.is_paid
                                    ? "line-through"
                                    : "none",
                                  opacity: p.is_paid ? 0.7 : 1,
                                }}
                              >
                                {p.name}
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
                                  fontSize: 13,
                                  fontWeight: 600,
                                  fontFamily: "DM Mono, monospace",
                                  color: p.is_paid
                                    ? "var(--green)"
                                    : "var(--text-primary)",
                                }}
                              >
                                {formatNu(p.share_amount)}
                              </span>
                              <button
                                onClick={() =>
                                  handleTogglePaid(split.id, p.id, p.is_paid)
                                }
                                title={
                                  p.is_paid ? "Mark as unpaid" : "Mark as paid"
                                }
                                style={{
                                  width: 26,
                                  height: 26,
                                  borderRadius: "50%",
                                  background: p.is_paid
                                    ? "var(--green)"
                                    : "var(--bg-muted)",
                                  border: `1.5px solid ${p.is_paid ? "var(--green)" : "var(--border)"}`,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  cursor: "pointer",
                                  transition: "all 0.2s",
                                  flexShrink: 0,
                                }}
                              >
                                {p.is_paid ? (
                                  <Check
                                    size={13}
                                    style={{ color: "#fff" }}
                                  />
                                ) : (
                                  <div
                                    style={{
                                      width: 8,
                                      height: 8,
                                      borderRadius: "50%",
                                      background: "var(--border)",
                                    }}
                                  />
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
