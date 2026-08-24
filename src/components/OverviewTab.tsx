import React, { useMemo } from 'react';
import {
  TrendingDown,
  TrendingUp,
  Wallet,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  Percent,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart as RePieChart,
  Pie,
  Cell,
} from 'recharts';
import { Transaction, Category, FamilyMember, Account, MonthlyBudget } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { formatCurrency, formatCompactCurrency, formatDateChinese } from '../utils/formatters';

interface OverviewTabProps {
  selectedMonth: string;
  transactions: Transaction[];
  categories: Category[];
  members: FamilyMember[];
  accounts: Account[];
  budget: MonthlyBudget;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyBalance: number;
  dailyAverageExpense: number;
  onOpenNewTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onNavigateToTab: (tab: any) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  selectedMonth,
  transactions,
  categories,
  members,
  accounts,
  budget,
  monthlyIncome,
  monthlyExpense,
  monthlyBalance,
  dailyAverageExpense,
  onOpenNewTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onNavigateToTab,
}) => {
  const [yearStr, monthStr] = selectedMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const daysInMonth = new Date(year, month, 0).getDate();

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const accountMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);

  // Current month's transactions
  const monthTxs = useMemo(() => {
    return transactions.filter((t) => t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  // Budget calculations
  const totalBudget = budget.totalBudget || 15000;
  const budgetSpentPercent = totalBudget > 0 ? (monthlyExpense / totalBudget) * 100 : 0;
  const budgetRemaining = Math.max(0, totalBudget - monthlyExpense);
  const isOverBudget = monthlyExpense > totalBudget;

  // Savings / Surplus Rate
  const savingsRate = monthlyIncome > 0 ? (monthlyBalance / monthlyIncome) * 100 : 0;

  // Daily trend data for Area Chart
  const dailyChartData = useMemo(() => {
    const data = [];
    const expenseByDay = new Map<number, number>();
    const incomeByDay = new Map<number, number>();

    monthTxs.forEach((t) => {
      const dayNum = parseInt(t.date.split('-')[2], 10);
      if (t.type === 'expense') {
        expenseByDay.set(dayNum, (expenseByDay.get(dayNum) || 0) + t.amount);
      } else if (t.type === 'income') {
        incomeByDay.set(dayNum, (incomeByDay.get(dayNum) || 0) + t.amount);
      }
    });

    for (let d = 1; d <= daysInMonth; d++) {
      data.push({
        day: `${d}日`,
        expense: expenseByDay.get(d) || 0,
        income: incomeByDay.get(d) || 0,
      });
    }
    return data;
  }, [monthTxs, daysInMonth]);

  // Category breakdown for Pie Chart
  const categoryChartData = useMemo(() => {
    const catAmounts = new Map<string, number>();
    monthTxs
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        catAmounts.set(t.categoryId, (catAmounts.get(t.categoryId) || 0) + t.amount);
      });

    const result = Array.from(catAmounts.entries())
      .map(([catId, amount]) => {
        const cat = categoryMap.get(catId);
        return {
          id: catId,
          name: cat?.name || '其它支出',
          value: amount,
          color: cat?.color || '#94A3B8',
          icon: cat?.icon || 'CircleDot',
          percentage: monthlyExpense > 0 ? (amount / monthlyExpense) * 100 : 0,
        };
      })
      .sort((a, b) => b.value - a.value);

    return result;
  }, [monthTxs, categoryMap, monthlyExpense]);

  // Member spending breakdown
  const memberSpendingData = useMemo(() => {
    const memAmounts = new Map<string, number>();
    monthTxs
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        memAmounts.set(t.memberId, (memAmounts.get(t.memberId) || 0) + t.amount);
      });

    return members
      .map((m) => {
        const amount = memAmounts.get(m.id) || 0;
        return {
          id: m.id,
          name: m.name,
          color: m.avatarColor,
          amount,
          percentage: monthlyExpense > 0 ? (amount / monthlyExpense) * 100 : 0,
        };
      })
      .filter((m) => m.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [monthTxs, members, monthlyExpense]);

  // Recent 6 transactions
  const recentTransactions = useMemo(() => {
    return [...monthTxs]
      .sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || '')))
      .slice(0, 6);
  }, [monthTxs]);

  return (
    <div className="space-y-6">
      {/* Top 5 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Monthly Total Expense */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">本月总支出</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown size={17} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
              {formatCurrency(monthlyExpense)}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
              <span>共 {monthTxs.filter((t) => t.type === 'expense').length} 笔支出</span>
            </div>
          </div>
        </div>

        {/* Card 2: Monthly Total Income */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">本月总收入</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp size={17} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
              {formatCurrency(monthlyIncome)}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              <span>共 {monthTxs.filter((t) => t.type === 'income').length} 笔收入</span>
            </div>
          </div>
        </div>

        {/* Card 3: Monthly Net Balance */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">本月结余</span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                monthlyBalance >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
              }`}
            >
              <Wallet size={17} />
            </div>
          </div>
          <div className="mt-3">
            <div
              className={`text-2xl font-bold font-mono tracking-tight ${
                monthlyBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {formatCurrency(monthlyBalance, true)}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span>结余率:</span>
              <span className="font-bold text-slate-700">{savingsRate.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Card 4: Daily Average */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">日均支出</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar size={17} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
              {formatCurrency(dailyAverageExpense)}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              按本月实际天数折算
            </div>
          </div>
        </div>

        {/* Card 5: Budget Status */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">预算进度</span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isOverBudget
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : budgetSpentPercent > 80
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {budgetSpentPercent.toFixed(0)}%
            </span>
          </div>
          <div className="mt-3">
            <div className="text-xs text-slate-500 mb-1.5 flex justify-between font-mono">
              <span>已用 ¥{monthlyExpense.toFixed(0)}</span>
              <span>限额 ¥{totalBudget.toFixed(0)}</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isOverBudget
                    ? 'bg-rose-500'
                    : budgetSpentPercent > 80
                    ? 'bg-amber-500'
                    : 'bg-indigo-600'
                }`}
                style={{ width: `${Math.min(100, budgetSpentPercent)}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-400 mt-1.5">
              {isOverBudget ? (
                <span className="text-rose-600 font-semibold">已超支 ¥{(monthlyExpense - totalBudget).toFixed(0)}</span>
              ) : (
                <span>剩余可用 ¥{budgetRemaining.toFixed(0)}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Budget Warning Banner if over or near threshold */}
      {isOverBudget && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between text-rose-800">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-rose-600 shrink-0" size={20} />
            <div className="text-xs sm:text-sm">
              <span className="font-bold">预算超支提醒：</span>
              本月家庭支出已达到 {formatCurrency(monthlyExpense)}，超出预设总预算 (
              {formatCurrency(totalBudget)}) {formatCurrency(monthlyExpense - totalBudget)}。建议及时调整非必要开支。
            </div>
          </div>
          <button
            onClick={() => onNavigateToTab('budget')}
            className="text-xs font-semibold text-rose-700 underline hover:text-rose-900 whitespace-nowrap ml-2"
          >
            查看预算
          </button>
        </div>
      )}

      {/* Charts Row: Trend Area Chart & Category Doughnut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Trend Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">每日收支走势分析</h3>
              <p className="text-xs text-slate-400">{year}年{month}月 每日流水起伏趋势</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                <span className="text-slate-600">支出</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                <span className="text-slate-600">收入</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748B' }} interval={3} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={formatCompactCurrency} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val)), '']}
                  labelFormatter={(label) => `${selectedMonth}-${label}`}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    color: '#FFF',
                    borderRadius: '8px',
                    fontSize: '12px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  name="支出"
                  stroke="#F43F5E"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#expenseGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  name="收入"
                  stroke="#10B981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#incomeGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Doughnut Chart */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-800">支出类别结构</h3>
              <p className="text-xs text-slate-400">本月各类开支占比排行</p>
            </div>
            <button
              onClick={() => onNavigateToTab('statistics')}
              className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center font-medium"
            >
              详细分析 <ChevronRight size={14} />
            </button>
          </div>

          {categoryChartData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-8">
              <p className="text-xs">本月暂无支出记录</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="h-44 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={categoryChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={68}
                      paddingAngle={3}
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [formatCurrency(Number(val)), '金额']}
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        color: '#FFF',
                        borderRadius: '8px',
                        fontSize: '12px',
                        border: 'none',
                      }}
                    />
                  </RePieChart>
                </ResponsiveContainer>
                {/* Center text in doughnut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] uppercase font-semibold text-slate-400">总支出</span>
                  <span className="text-xs font-bold font-mono text-slate-800">
                    {formatCompactCurrency(monthlyExpense)}
                  </span>
                </div>
              </div>

              {/* Category Ranking List */}
              <div className="space-y-2 mt-2 max-h-40 overflow-y-auto pr-1">
                {categoryChartData.slice(0, 4).map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs py-0.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-700 font-medium">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-slate-900 font-semibold">{formatCurrency(item.value)}</span>
                      <span className="text-slate-400 text-[11px] w-10 text-right">
                        {item.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Two Columns: Family Member Contribution & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Family Member Spending Share */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">家庭成员开支归属</h3>
              <p className="text-xs text-slate-400">各成员与公用开销占比</p>
            </div>
            <button
              onClick={() => onNavigateToTab('accounts')}
              className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center font-medium"
            >
              管理成员 <ChevronRight size={14} />
            </button>
          </div>

          <div className="space-y-3.5">
            {memberSpendingData.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">暂无成员支出明细</p>
            ) : (
              memberSpendingData.map((mem) => (
                <div key={mem.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold"
                        style={{ backgroundColor: mem.color }}
                      >
                        {mem.name.slice(0, 1)}
                      </div>
                      <span className="font-semibold text-slate-800">{mem.name}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-slate-900 font-bold">{formatCurrency(mem.amount)}</span>
                      <span className="text-slate-400 text-[11px]">({mem.percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        backgroundColor: mem.color,
                        width: `${mem.percentage}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">最新收支记录</h3>
                <p className="text-xs text-slate-400">最近添加的家庭账目明细</p>
              </div>
              <button
                onClick={() => onNavigateToTab('transactions')}
                className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center font-medium"
              >
                查看全部流水 <ChevronRight size={14} />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {recentTransactions.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <p className="text-xs mb-3">本月还没有记账哦</p>
                  <button
                    onClick={onOpenNewTransaction}
                    className="px-3.5 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 inline-flex items-center gap-1 font-semibold"
                  >
                    <Plus size={14} /> 立即记第一笔
                  </button>
                </div>
              ) : (
                recentTransactions.map((t) => {
                  const cat = categoryMap.get(t.categoryId);
                  const mem = memberMap.get(t.memberId);
                  const acc = accountMap.get(t.accountId);
                  const toAcc = t.toAccountId ? accountMap.get(t.toAccountId) : null;

                  return (
                    <div
                      key={t.id}
                      className="py-3 flex items-center justify-between hover:bg-slate-50/80 -mx-2 px-2 rounded-xl transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                          style={{
                            backgroundColor:
                              t.type === 'transfer' ? '#6366F1' : cat?.color || '#94A3B8',
                          }}
                        >
                          <CategoryIcon name={cat?.icon || 'CircleDot'} size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-slate-800">
                              {t.type === 'transfer'
                                ? `转账: ${acc?.name} ➔ ${toAcc?.name}`
                                : cat?.name || '未分类'}
                            </span>
                            {t.subCategory && (
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                                {t.subCategory}
                              </span>
                            )}
                            <span
                              className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                              style={{
                                backgroundColor: `${mem?.avatarColor}15`,
                                color: mem?.avatarColor,
                              }}
                            >
                              {mem?.name}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>{t.date} {t.time}</span>
                            <span>·</span>
                            <span>{acc?.name}</span>
                            {t.note && (
                              <>
                                <span>·</span>
                                <span className="text-slate-600 truncate max-w-[150px] sm:max-w-xs">
                                  {t.note}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`text-sm sm:text-base font-bold font-mono ${
                            t.type === 'expense'
                              ? 'text-rose-600'
                              : t.type === 'income'
                              ? 'text-emerald-600'
                              : 'text-indigo-600'
                          }`}
                        >
                          {t.type === 'expense' ? '-' : t.type === 'income' ? '+' : ''}
                          ¥{t.amount.toFixed(2)}
                        </span>

                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          <button
                            onClick={() => onEditTransaction(t)}
                            title="编辑"
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-200/60 rounded"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => onDeleteTransaction(t.id)}
                            title="删除"
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-2 flex items-center justify-between text-xs text-slate-400">
            <span>记录家庭日常每一笔点滴花销</span>
            <button
              onClick={onOpenNewTransaction}
              className="text-indigo-600 font-semibold hover:text-indigo-800 flex items-center gap-1"
            >
              <Plus size={14} /> 快速记录新账单
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
