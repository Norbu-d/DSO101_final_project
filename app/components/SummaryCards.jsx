'use client';

import { TrendingUp, TrendingDown, DollarSign, Calendar, ArrowUp, ArrowDown } from 'lucide-react';

export default function SummaryCards({ expenses }) {
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const averageExpense = expenses.length > 0 ? totalExpenses / expenses.length : 0;
  
  const today = new Date().toISOString().split('T')[0];
  const todayExpenses = expenses.filter(e => e.date === today);
  const todayTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  const monthExpenses = expenses.filter(e => {
    const date = new Date(e.date);
    return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
  });
  const monthTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

  const cards = [
    {
      title: 'Total Spent',
      value: `$${totalExpenses.toFixed(2)}`,
      icon: DollarSign,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-500/20 to-cyan-500/20',
      border: 'border-blue-500/30',
      change: '+12%',
      changeType: 'up',
    },
    {
      title: 'This Month',
      value: `$${monthTotal.toFixed(2)}`,
      icon: Calendar,
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-500/20 to-pink-500/20',
      border: 'border-purple-500/30',
      change: '+8%',
      changeType: 'up',
    },
    {
      title: 'Today',
      value: `$${todayTotal.toFixed(2)}`,
      icon: TrendingDown,
      gradient: 'from-orange-500 to-red-500',
      bgGradient: 'from-orange-500/20 to-red-500/20',
      border: 'border-orange-500/30',
      change: todayTotal > 0 ? '+Today' : 'No spend',
      changeType: todayTotal > 0 ? 'up' : 'down',
    },
    {
      title: 'Average',
      value: `$${averageExpense.toFixed(2)}`,
      icon: TrendingUp,
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-500/20 to-emerald-500/20',
      border: 'border-green-500/30',
      change: 'per transaction',
      changeType: 'neutral',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className={`relative bg-gradient-to-br ${card.bgGradient} backdrop-blur-sm border ${card.border} rounded-2xl p-6 card-hover animate-slideUp`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
              <Icon size={128} className="text-white" />
            </div>
            
            <div className="relative z-10">
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${card.gradient} mb-4 shadow-lg`}>
                <Icon size={24} className="text-white" />
              </div>
              
              <h3 className="text-gray-300 text-sm font-medium mb-2">{card.title}</h3>
              <p className="text-3xl font-bold text-white mb-3">{card.value}</p>
              
              <div className="flex items-center gap-2">
                {card.changeType === 'up' && <ArrowUp size={14} className="text-green-400" />}
                {card.changeType === 'down' && <ArrowDown size={14} className="text-red-400" />}
                <span className={`text-xs ${
                  card.changeType === 'up' ? 'text-green-400' : 
                  card.changeType === 'down' ? 'text-red-400' : 'text-gray-400'
                }`}>
                  {card.change}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}