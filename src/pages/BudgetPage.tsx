import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
} from 'recharts';
import confetti from 'canvas-confetti';
import {
  Wallet,
  Plus,
  ArrowRightLeft,
  Trash2,
  Check,
  X,
  TrendingUp,
  CreditCard,
  Edit2,
} from 'lucide-react';
import { useRelationship } from '../context/RelationshipContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { EXPENSE_CATEGORIES } from '../lib/quotes';
import { formatINR } from '../lib/utils';
import type { Expense } from '../types';

const LOCAL_STORAGE_EXPENSES = '4ever_expenses_v1';

const CATEGORY_COLORS: Record<string, string> = {
  food: '#f59e0b',
  chai: '#fbbf24',
  transport: '#3b82f6',
  auto: '#06b6d4',
  groceries: '#10b981',
  fun: '#ec4899',
  books: '#8b5cf6',
  trip: '#f43f5e',
  other: '#94a3b8',
};

export const BudgetPage: React.FC = () => {
  const { relationship, partnerProfile, updateRelationship } = useRelationship();
  const { user, profile } = useAuth();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [budgetLimit, setBudgetLimit] = useState<number>(relationship?.budget_limit || 5000);
  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [limitInput, setLimitInput] = useState<string>(String(relationship?.budget_limit || 5000));
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // New expense form
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<keyof typeof EXPENSE_CATEGORIES>('food');
  const [paidBy, setPaidBy] = useState<'me' | 'partner' | 'both'>('me');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));

  // Load expenses
  const loadExpenses = useCallback(async () => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_EXPENSES);
      if (stored) setExpenses(JSON.parse(stored));
    } catch {
      // ignore
    }

    if (relationship?.id) {
      try {
        const { data, error } = await supabase
          .from('expenses')
          .select('*')
          .eq('relationship_id', relationship.id)
          .order('expense_date', { ascending: false });

        if (!error && data && data.length > 0) {
          setExpenses(data as Expense[]);
          localStorage.setItem(LOCAL_STORAGE_EXPENSES, JSON.stringify(data));
        }
      } catch {
        // fallback
      }
    }
  }, [relationship]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const saveExpenses = (updated: Expense[]) => {
    setExpenses(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_EXPENSES, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleSaveBudgetLimit = async () => {
    const val = Number(limitInput);
    if (val > 0) {
      setBudgetLimit(val);
      setIsEditingLimit(false);
      await updateRelationship({ budget_limit: val });
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!title.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    let payerId = 'both';
    if (paidBy === 'me') payerId = user?.id || 'me';
    else if (paidBy === 'partner') payerId = partnerProfile?.id || 'partner';

    const newExpense: Expense = {
      id: crypto.randomUUID(),
      relationship_id: relationship?.id || 'local_rel',
      title: title.trim(),
      amount: parsedAmount,
      category,
      paid_by: payerId,
      split_type: paidBy === 'both' ? 'equal' : paidBy === 'me' ? 'full_a' : 'full_b',
      expense_date: expenseDate,
      created_at: new Date().toISOString(),
    };

    const updated = [newExpense, ...expenses];
    saveExpenses(updated);

    if (relationship?.id && user) {
      try {
        await supabase.from('expenses').insert([newExpense]);
      } catch {
        // ignore
      }
    }

    setTitle('');
    setAmount('');
    setModalOpen(false);
  };

  const handleDeleteExpense = async (id: string) => {
    const updated = expenses.filter((e) => e.id !== id);
    saveExpenses(updated);

    if (relationship?.id && user) {
      try {
        await supabase.from('expenses').delete().eq('id', id);
      } catch {
        // ignore
      }
    }
  };

  // Balance calculations:
  // Calculate who paid what
  const myId = user?.id || 'me';
  const partnerId = partnerProfile?.id || 'partner';

  let myTotalPaid = 0;
  let partnerTotalPaid = 0;
  let totalSpent = 0;

  expenses.forEach((e) => {
    totalSpent += e.amount;
    if (e.paid_by === myId || e.paid_by === 'me') {
      myTotalPaid += e.amount;
    } else if (e.paid_by === partnerId || e.paid_by === 'partner') {
      partnerTotalPaid += e.amount;
    } else {
      // Split 50-50
      myTotalPaid += e.amount / 2;
      partnerTotalPaid += e.amount / 2;
    }
  });

  // Net settlement
  // If myTotalPaid > partnerTotalPaid, partner owes me (myTotalPaid - partnerTotalPaid)/2
  const netDifference = (myTotalPaid - partnerTotalPaid) / 2;
  const partnerName = partnerProfile?.display_name || 'Partner';
  const myName = profile?.display_name || 'You';

  const handleSettleUp = () => {
    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#34d399', '#f59e0b'],
    });
    alert('All accounts marked settled! You two are completely even.');
  };

  // Chart data: Category breakdown
  const categoryTotals: Record<string, number> = {};
  expenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  const pieChartData = Object.entries(categoryTotals).map(([cat, total]) => ({
    name: EXPENSE_CATEGORIES[cat as keyof typeof EXPENSE_CATEGORIES]?.label || cat,
    categoryKey: cat,
    value: total,
    color: CATEGORY_COLORS[cat] || '#94a3b8',
  }));

  // 7-day trend data
  const last7Days: { dateStr: string; label: string; amount: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString(undefined, { weekday: 'narrow' });
    const dayTotal = expenses
      .filter((e) => e.expense_date === dateStr)
      .reduce((sum, e) => sum + e.amount, 0);
    last7Days.push({ dateStr, label, amount: dayTotal });
  }

  // Budget progress
  const budgetPercent = Math.min(100, Math.round((totalSpent / budgetLimit) * 100));

  const filteredExpenses =
    selectedCategoryFilter === 'all'
      ? expenses
      : expenses.filter((e) => e.category === selectedCategoryFilter);

  return (
    <div className="space-y-8 pb-20 pt-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-white flex items-center gap-2.5">
            <Wallet className="w-7 h-7 text-emerald-400" />
            <span>Shared Budget & Splitter</span>
          </h1>
          <p className="text-sm text-white/60 mt-1">
            Keep things transparent, split bills fairly, and track monthly spends.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      {/* Top Banner: Budget Limit + Who Paid More Split Settlement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Budget Tracker */}
        <div className="glass-card rounded-3xl border border-white/10 p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" /> Monthly Budget Limit
            </span>
            <button
              onClick={() => setIsEditingLimit((prev) => !prev)}
              className="text-xs text-white/50 hover:text-white flex items-center gap-1"
            >
              <Edit2 className="w-3 h-3" /> Edit Limit
            </button>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-bold text-white font-serif">
                  ₹{formatINR(totalSpent)}
                </span>
                <span className="text-sm text-white/40 ml-2">of ₹{formatINR(budgetLimit)}</span>
              </div>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  budgetPercent > 90
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : budgetPercent > 70
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {budgetPercent}% used
              </span>
            </div>

            <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden mt-3">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  budgetPercent > 90
                    ? 'bg-gradient-to-r from-rose-500 to-red-600'
                    : budgetPercent > 70
                    ? 'bg-gradient-to-r from-amber-500 to-amber-300'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                }`}
                style={{ width: `${budgetPercent}%` }}
              />
            </div>
          </div>

          {isEditingLimit ? (
            <div className="flex items-center gap-2 pt-2">
              <input
                type="number"
                value={limitInput}
                onChange={(e) => setLimitInput(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs w-32 focus:outline-none focus:border-emerald-400/50"
              />
              <button
                onClick={handleSaveBudgetLimit}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 text-black text-xs font-semibold"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-white/50 pt-1">
              <span>₹{formatINR(Math.max(0, budgetLimit - totalSpent))} remaining</span>
              <span>Resets every 1st of month</span>
            </div>
          )}
        </div>

        {/* Split Calculator Balance */}
        <div className="glass-card rounded-3xl border border-white/10 p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <ArrowRightLeft className="w-3.5 h-3.5" /> Fair Split Settlement
            </span>
            <span className="text-xs text-white/40">50 / 50 model</span>
          </div>

          <div>
            {Math.abs(netDifference) < 1 ? (
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-emerald-400 font-serif">
                  All Settled Up! 🎉
                </h3>
                <p className="text-xs text-white/50">
                  Neither person owes anything. Perfect balance!
                </p>
              </div>
            ) : netDifference > 0 ? (
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-amber-300 font-serif">
                  {partnerName} owes you ₹{formatINR(Math.abs(netDifference))}
                </h3>
                <p className="text-xs text-white/50">
                  You paid ₹{formatINR(myTotalPaid)} total, {partnerName} paid ₹{formatINR(partnerTotalPaid)}.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-rose-300 font-serif">
                  You owe {partnerName} ₹{formatINR(Math.abs(netDifference))}
                </h3>
                <p className="text-xs text-white/50">
                  {partnerName} paid ₹{formatINR(partnerTotalPaid)} total, you paid ₹{formatINR(myTotalPaid)}.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSettleUp}
              className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 text-emerald-400" /> Settle Up All Dues
            </button>
          </div>
        </div>
      </div>

      {/* Visual Charts: Category Breakdown & 7-Day Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="glass-card rounded-3xl border border-white/10 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-amber-400" /> Category Breakdown
            </h3>
            <span className="text-xs text-white/40">{pieChartData.length} active categories</span>
          </div>

          {pieChartData.length === 0 ? (
            <div className="h-60 flex items-center justify-center text-xs text-white/40">
              No expenses recorded yet
            </div>
          ) : (
            <div className="h-64 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="w-full sm:w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: '#14151a',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                      }}
                      formatter={(val: number | string | readonly (number | string)[] | undefined) => [
                        `₹${formatINR(Number(val) || 0)}`,
                        'Amount',
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legends list */}
              <div className="w-full sm:w-1/2 space-y-1.5 max-h-52 overflow-y-auto pr-2">
                {pieChartData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: d.color }}
                      />
                      <span className="text-white/80">{d.name}</span>
                    </div>
                    <span className="font-semibold text-white font-mono">
                      ₹{formatINR(d.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 7-Day Spending Bar Chart */}
        <div className="glass-card rounded-3xl border border-white/10 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-blue-400" /> Last 7 Days Trend
            </h3>
            <span className="text-xs text-white/40">Daily spend in ₹</span>
          </div>

          <div className="h-64 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7Days}>
                <XAxis dataKey="label" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#14151a',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                  }}
                  formatter={(val: number | string | readonly (number | string)[] | undefined) => [
                    `₹${formatINR(Number(val) || 0)}`,
                    'Spent',
                  ]}
                />
                <Bar dataKey="amount" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Expense History List */}
      <div className="glass-card rounded-3xl border border-white/10 p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <h3 className="font-semibold text-white text-base">Expense Log</h3>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedCategoryFilter('all')}
              className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                selectedCategoryFilter === 'all'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-white/5 text-white/60 hover:text-white'
              }`}
            >
              All
            </button>
            {Object.entries(EXPENSE_CATEGORIES).map(([key, cat]) => (
              <button
                key={key}
                onClick={() => setSelectedCategoryFilter(key)}
                className={`px-2.5 py-1 rounded-xl text-xs font-medium flex items-center gap-1 transition-all ${
                  selectedCategoryFilter === key
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-white/5 text-white/60 hover:text-white'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="py-10 text-center text-xs text-white/40 italic">
            No expenses found. Click &quot;Add Expense&quot; above to log your first chai or date bill!
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredExpenses.map((exp) => {
              const catCfg = EXPENSE_CATEGORIES[exp.category] || { label: exp.category, icon: '💸' };
              const isPaidByMe = exp.paid_by === myId || exp.paid_by === 'me';
              const isPaidByPartner = exp.paid_by === partnerId || exp.paid_by === 'partner';

              return (
                <div
                  key={exp.id}
                  className="p-3.5 rounded-2xl bg-black/20 border border-white/5 flex items-center justify-between gap-3 hover:border-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg">
                      {catCfg.icon}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white">{exp.title}</h4>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-white/40">
                        <span>{new Date(exp.expense_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        <span>•</span>
                        <span className="text-amber-300/80">
                          {isPaidByMe ? 'Paid by You' : isPaidByPartner ? `Paid by ${partnerName}` : 'Split 50-50'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-white text-base">
                      ₹{formatINR(exp.amount)}
                    </span>
                    <button
                      onClick={() => handleDeleteExpense(exp.id)}
                      className="text-white/30 hover:text-rose-400 p-1.5 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-md rounded-2xl border border-white/10 p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-semibold text-white">Log New Expense</h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddExpense} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">
                    What was it for?
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Dinner date or Swiggy order"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-emerald-400/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="e.g. 450"
                      required
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-emerald-400/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-400/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">
                    Category
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(EXPENSE_CATEGORIES).map(([key, cat]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setCategory(key as keyof typeof EXPENSE_CATEGORIES)}
                        className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-medium transition-all ${
                          category === key
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                            : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                        }`}
                      >
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">
                    Who paid for this?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'me', label: `Me (${myName})` },
                      { id: 'partner', label: partnerName },
                      { id: 'both', label: 'Split 50/50' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setPaidBy(item.id as 'me' | 'partner' | 'both')}
                        className={`p-2 rounded-xl border text-xs font-medium transition-all ${
                          paidBy === item.id
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                            : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-semibold text-xs transition-all shadow-lg shadow-emerald-500/20"
                  >
                    Save Expense
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
