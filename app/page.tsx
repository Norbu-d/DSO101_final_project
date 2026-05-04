'use client';

import { useState, useEffect } from 'react';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import SummaryCards from './components/SummaryCards';
import ExpenseChart from './components/ExpenseChart';
import { Wallet } from 'lucide-react';

export default function Home() {
  const [expenses, setExpenses] = useState([]);

  // Load expenses from localStorage on mount
  useEffect(() => {
    const savedExpenses = localStorage.getItem('expenses');
    if (savedExpenses) {
      setExpenses(JSON.parse(savedExpenses));
    }
  }, []);

  // Save expenses to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(expenses));
  }, [expenses]);

  const addExpense = (expense) => {
    setExpenses([...expenses, expense]);
  };

  const deleteExpense = (id) => {
    setExpenses(expenses.filter(exp => exp.id !== id));
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-slideIn">
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            <div className="bg-white/20 backdrop-blur-lg p-3 rounded-2xl">
              <Wallet size={40} className="text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-2">
            Expense Tracker
          </h1>
          <p className="text-white/80 text-lg">
            Track your daily expenses and take control of your finances
          </p>
        </div>

        {/* Summary Cards */}
        <SummaryCards expenses={expenses} />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <ExpenseForm onAddExpense={addExpense} />
          </div>
          <div>
            <ExpenseChart expenses={expenses} />
          </div>
        </div>

        {/* Expense List */}
        <div className="mt-8">
          <ExpenseList expenses={expenses} onDeleteExpense={deleteExpense} />
        </div>
      </div>
    </div>
  );
}