'use client';

import { useState } from 'react';
import { Plus, CreditCard, Tag, Calendar, FileText, Sparkles } from 'lucide-react';

const CATEGORIES = [
  { name: 'Food & Dining', icon: '🍕', color: '#ef4444', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  { name: 'Transportation', icon: '🚗', color: '#f59e0b', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  { name: 'Shopping', icon: '🛍️', color: '#10b981', bg: 'bg-green-500/10', border: 'border-green-500/30' },
  { name: 'Entertainment', icon: '🎬', color: '#8b5cf6', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  { name: 'Bills & Utilities', icon: '📄', color: '#ec4899', bg: 'bg-pink-500/10', border: 'border-pink-500/30' },
  { name: 'Healthcare', icon: '🏥', color: '#06b6d4', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
  { name: 'Education', icon: '📚', color: '#6366f1', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30' },
  { name: 'Other', icon: '📌', color: '#6b7280', bg: 'bg-gray-500/10', border: 'border-gray-500/30' },
];

export default function ExpenseForm({ onAddExpense }) {
  const [formData, setFormData] = useState({
    amount: '',
    category: 'Food & Dining',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Please enter a description';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onAddExpense({
        id: Date.now(),
        ...formData,
        amount: parseFloat(formData.amount),
      });
      setFormData({
        amount: '',
        category: 'Food & Dining',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 card-hover">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl">
          <Sparkles size={20} className="text-white" />
        </div>
        <h2 className="text-xl font-bold text-white">Add New Expense</h2>
      </div>

      <div className="space-y-4">
        {/* Amount Field */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
            <CreditCard size={16} />
            Amount
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">$</span>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              className={`w-full pl-8 pr-4 py-3 bg-gray-900/50 border ${errors.amount ? 'border-red-500' : 'border-gray-700'} rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 input-focus transition-all`}
            />
          </div>
          {errors.amount && <p className="text-red-400 text-sm mt-1">{errors.amount}</p>}
        </div>

        {/* Category Field */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
            <Tag size={16} />
            Category
          </label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.name}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, category: cat.name }))}
                className={`p-2 rounded-xl border transition-all ${
                  formData.category === cat.name
                    ? `${cat.bg} ${cat.border} border-2`
                    : 'border-gray-700 bg-gray-900/30 hover:bg-gray-800/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{cat.icon}</span>
                  <span className={`text-sm ${
                    formData.category === cat.name ? 'text-white' : 'text-gray-400'
                  }`}>
                    {cat.name.split(' ')[0]}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Description Field */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
            <FileText size={16} />
            Description
          </label>
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="What did you spend on?"
            className={`w-full px-4 py-3 bg-gray-900/50 border ${errors.description ? 'border-red-500' : 'border-gray-700'} rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 input-focus transition-all`}
          />
          {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
        </div>

        {/* Date Field */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
            <Calendar size={16} />
            Date
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 input-focus transition-all"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full btn-gradient py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 mt-6"
        >
          <Plus size={20} />
          Add Expense
        </button>
      </div>
    </form>
  );
}