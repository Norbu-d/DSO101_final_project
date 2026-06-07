import { supabase } from "./supabase";
import { EXPENSE_CATEGORIES } from "./constants";

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function signUp(
  email: string,
  password: string,
  name: string,
  initialBalance: number,
) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });
  if (authError) throw authError;

  if (authData.user) {
    const { error: profileError } = await supabase.from("users").insert({
      id: authData.user.id,
      email,
      name,
      current_balance: initialBalance,
      is_premium: false,
    });
    if (profileError) throw profileError;

    // Seed default categories for user
    const defaultCats = EXPENSE_CATEGORIES.map((c) => ({
      id: `${authData.user!.id}_${c.id}`,
      name: c.name,
      icon: c.icon,
      is_default: true,
      user_id: authData.user!.id,
    }));
    await supabase.from("categories").insert(defaultCats);
  }

  return authData;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

export async function logExpense(
  userId: string,
  amount: number,
  categoryId: string,
  note: string,
  date: string,
  currentBalance: number,
) {
  const newBalance = currentBalance - amount;
  if (newBalance < 0) throw new Error("Insufficient balance");

  const { data, error } = await supabase
    .from("expenses")
    .insert({
      user_id: userId,
      amount,
      category_id: categoryId,
      note: note || null,
      date,
    })
    .select()
    .single();

  if (error) throw error;

  // Update user balance
  await supabase
    .from("users")
    .update({ current_balance: newBalance })
    .eq("id", userId);

  return { expense: data, newBalance };
}

export async function getExpenses(userId: string, limit = 50) {
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function getMonthlyExpenses(userId: string) {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", userId)
    .gte("date", start.toISOString().split("T")[0])
    .order("date", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function deleteExpense(
  expenseId: string,
  userId: string,
  amount: number,
  currentBalance: number,
) {
  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", expenseId);
  if (error) throw error;

  const newBalance = currentBalance + amount;
  await supabase
    .from("users")
    .update({ current_balance: newBalance })
    .eq("id", userId);
  return newBalance;
}

// ─── Income ───────────────────────────────────────────────────────────────────

export async function logIncome(
  userId: string,
  amount: number,
  source: string,
  note: string,
  date: string,
  currentBalance: number,
) {
  const { data, error } = await supabase
    .from("income_entries")
    .insert({
      user_id: userId,
      amount,
      source,
      note: note || null,
      date,
    })
    .select()
    .single();

  if (error) throw error;

  const newBalance = currentBalance + amount;
  await supabase
    .from("users")
    .update({ current_balance: newBalance })
    .eq("id", userId);

  return { income: data, newBalance };
}

export async function getIncomeEntries(userId: string, limit = 20) {
  const { data, error } = await supabase
    .from("income_entries")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function getTotalReceived(userId: string) {
  try {
    const { data: userProfile, error: userError } = await supabase
      .from("users")
      .select("current_balance")
      .eq("id", userId)
      .maybeSingle();

    const { data: incomeEntries, error: incomeError } = await supabase
      .from("income_entries")
      .select("amount")
      .eq("user_id", userId);

    if (userError || incomeError) throw userError || incomeError;

    const profileBalance = userProfile?.current_balance || 0;
    const totalIncome =
      incomeEntries?.reduce(
        (sum: number, entry: { amount: number }) =>
          sum + parseFloat(entry.amount.toString()),
        0,
      ) || 0;

    return profileBalance + totalIncome;
  } catch (err) {
    console.error("Error fetching total received:", err);
    return 0;
  }
}

// ─── Combined transactions ────────────────────────────────────────────────────

export async function getRecentTransactions(userId: string) {
  const [expenses, income] = await Promise.all([
    getExpenses(userId, 30),
    getIncomeEntries(userId, 10),
  ]);

  const combined = [
    ...expenses.map((e) => ({ ...e, type: "expense" as const })),
    ...income.map((i) => ({ ...i, type: "income" as const })),
  ];

  return combined.sort((a, b) => {
    const dateA = new Date(
      a.date + (a.created_at ? "T" + a.created_at.split("T")[1] : ""),
    ).getTime();
    const dateB = new Date(
      b.date + (b.created_at ? "T" + b.created_at.split("T")[1] : ""),
    ).getTime();
    return dateB - dateA;
  });
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export function getCategoryTotals(
  expenses: Array<{ category_id: string; amount: number }>,
) {
  const totals: Record<string, number> = {};
  for (const e of expenses) {
    totals[e.category_id] = (totals[e.category_id] || 0) + e.amount;
  }
  return Object.entries(totals)
    .map(([id, total]) => ({ id, total }))
    .sort((a, b) => b.total - a.total);
}

export function getMonthlyTotal(expenses: Array<{ amount: number }>) {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

export function getDailyAverage(
  expenses: Array<{ amount: number; date: string }>,
) {
  if (!expenses.length) return 0;
  const daysInMonth = new Date().getDate();
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  return Math.round(total / daysInMonth);
}

// ─── Budgets & Alerts ────────────────────────────────────────────────────────

export async function setBudget(
  userId: string,
  categoryId: string,
  amountLimit: number,
) {
  const { data } = await supabase
    .from("budgets")
    .select("id")
    .eq("user_id", userId)
    .eq("category_id", categoryId)
    .single();

  if (data) {
    // Update existing budget
    const { error: updateError } = await supabase
      .from("budgets")
      .update({ amount_limit: amountLimit })
      .eq("user_id", userId)
      .eq("category_id", categoryId);
    if (updateError) throw updateError;
  } else {
    // Create new budget
    const { error: insertError } = await supabase.from("budgets").insert({
      user_id: userId,
      category_id: categoryId,
      amount_limit: amountLimit,
      period: "monthly",
    });
    if (insertError) throw insertError;
  }
}

export async function getBudgets(userId: string) {
  const { data, error } = await supabase
    .from("budgets")
    .select("*")
    .eq("user_id", userId)
    .eq("period", "monthly");

  if (error) throw error;
  return data || [];
}

// Check if budget alert threshold (80%) is crossed for a category
export async function checkBudgetAlert(
  userId: string,
  categoryId: string,
  monthlyExpenses: Array<{ category_id: string; amount: number }>,
) {
  const budgets = await getBudgets(userId);
  const budget = budgets.find((b) => b.category_id === categoryId);

  if (!budget)
    return {
      triggered: false,
      percentage: 0,
      categorySpending: 0,
      limitAmount: 0,
    };

  const categorySpending = monthlyExpenses
    .filter((e) => e.category_id === categoryId)
    .reduce((sum, e) => sum + e.amount, 0);

  const percentage = (categorySpending / budget.amount_limit) * 100;
  const triggered = percentage >= 80;

  return {
    triggered,
    percentage,
    categorySpending,
    limitAmount: budget.amount_limit,
  };
}

// Get all alerts for user (categories exceeding 80% threshold)
export async function getUserBudgetAlerts(
  userId: string,
  monthlyExpenses: Array<{ category_id: string; amount: number }>,
) {
  const budgets = await getBudgets(userId);
  const alerts = [];

  for (const budget of budgets) {
    const alert = await checkBudgetAlert(
      userId,
      budget.category_id,
      monthlyExpenses,
    );
    if (alert.triggered) {
      alerts.push({
        categoryId: budget.category_id,
        ...alert,
      });
    }
  }

  return alerts;
}
