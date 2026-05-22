  export const EXPENSE_CATEGORIES = [
  { id: "food", name: "Food & Drinks", icon: "🍚" },
  { id: "transport", name: "Transport", icon: "🚌" },
  { id: "stationery", name: "Stationery", icon: "📚" },
  { id: "monastery", name: "Monastery", icon: "🙏" },
  { id: "entertainment", name: "Entertainment", icon: "🎮" },
  { id: "clothing", name: "Clothing", icon: "👕" },
  { id: "health", name: "Health", icon: "💊" },
  { id: "phone", name: "Phone/Data", icon: "📱" },
  { id: "other", name: "Other", icon: "📦" },
];

export const INCOME_SOURCES = [
  { id: "parents", name: "Parents / Family", icon: "👨‍👩‍👧" },
  { id: "stipend", name: "Monthly Stipend", icon: "🏛️" },
  { id: "parttime", name: "Part-time Work", icon: "💼" },
  { id: "scholarship", name: "Scholarship", icon: "🎓" },
  { id: "gift", name: "Gift", icon: "🎁" },
  { id: "other", name: "Other", icon: "💰" },
];

export const QUICK_AMOUNTS = [50, 100, 200, 500, 1000, 2000];

// Budget alert threshold: warn at 80% of budget
export const ALERT_THRESHOLD = 0.8;

export const getCategoryName = (categoryId: string) => {
  const category = EXPENSE_CATEGORIES.find((c) => c.id === categoryId);
  return category?.name || categoryId;
};

export const formatNu = (amount: number) => {
  return `Nu. ${amount.toLocaleString("en-IN")}`;
};

export const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

export const today = () => new Date().toISOString().split("T")[0];
