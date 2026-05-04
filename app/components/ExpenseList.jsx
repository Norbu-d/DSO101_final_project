'use client';

import { Trash2, Calendar, DollarSign, Receipt } from 'lucide-react';

const CATEGORY_STYLES = {
  'Food & Dining': { icon: '🍕', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  'Transportation': { icon: '🚗', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  'Shopping': { icon: '🛍️', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
  'Entertainment': { icon: '🎬', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  'Bills & Utilities': { icon: '📄', color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/30' },
  'Healthcare': { icon: '🏥', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
  'Education': { icon: '📚', color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30' },
  'Other': { icon: '📌', color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/30' },
};

export default function ExpenseList({ expenses, onDeleteExpense }) {
  if (expenses.length === 0) {
    return (
      <div className="glass rounded-2xl p-12 text-center animate-scaleIn">
        <div className="text-7xl mb-4">💰</div>
        <h3 className="text-xl font-semibold text-white mb-2">No Expenses Yet</h3>
        <p className="text-gray-400">Start adding your first expense using the form above!</p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 px-6 py-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Recent Transactions</h2>
            <p className="text-gray-400 text-sm">{expenses.length} total transactions</p>
          </div>
          <Receipt className="text-gray-400" size={24} />
        </div>
      </div>

      <div className="divide-y divide-gray-800 max-h-96 overflow-y-auto">
        {sortedExpenses.map((expense, index) => {
          const categoryStyle = CATEGORY_STYLES[expense.category] || CATEGORY_STYLES['Other'];
          return (
            <div
              key={expense.id}
              className="p-4 hover:bg-white/5 transition-all group animate-slideUp"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${categoryStyle.bg} rounded-xl flex items-center justify-center text-2xl`}>
                  {categoryStyle.icon}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white">{expense.description}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${categoryStyle.bg} ${categoryStyle.color}`}>
                      {expense.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {formatDate(expense.date)}
                    </span>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-xl font-bold text-white">
                    ${expense.amount.toFixed(2)}
                  </div>
                </div>
                
                <button
                  onClick={() => onDeleteExpense(expense.id)}
                  className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}