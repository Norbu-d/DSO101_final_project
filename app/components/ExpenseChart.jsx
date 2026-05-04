'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TrendingUp, PieChart as PieChartIcon } from 'lucide-react';

const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1', '#6b7280'];

export default function ExpenseChart({ expenses, expanded = false }) {
  // Group expenses by category
  const categoryTotals = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {});

  const pieData = Object.entries(categoryTotals).map(([name, value]) => ({
    name,
    value,
  }));

  // Group by last 7 days
  const last7Days = [...Array(7)].map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  }).reverse();

  const barData = last7Days.map(date => {
    const dayExpenses = expenses.filter(e => e.date === date);
    const total = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
    return {
      date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      amount: total,
    };
  });

  if (pieData.length === 0) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-semibold text-white mb-2">No Data Yet</h3>
        <p className="text-gray-400">Add expenses to see your spending breakdown!</p>
      </div>
    );
  }

  const total = pieData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="glass rounded-2xl p-6 card-hover">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl">
            <PieChartIcon size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Spending Analytics</h2>
            <p className="text-gray-400 text-sm">Total: ${total.toFixed(2)}</p>
          </div>
        </div>
        <TrendingUp className="text-gray-400" size={20} />
      </div>

      {/* Bar Chart - Daily Spending */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Daily Spending</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip 
              formatter={(value) => `$${value.toFixed(2)}`}
              contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
            />
            <Bar dataKey="amount" fill="#6366f1" radius={[8, 8, 0, 0]}>
              {barData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie Chart - Category Breakdown */}
      <div>
        <h3 className="text-sm font-medium text-gray-300 mb-3">Category Breakdown</h3>
        <ResponsiveContainer width="100%" height={expanded ? 400 : 250}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={expanded ? 120 : 80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => `$${value.toFixed(2)}`}
              contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
            />
            <Legend 
              formatter={(value) => <span className="text-gray-300 text-sm">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}