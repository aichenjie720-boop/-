import React, { useState, useMemo } from 'react';
import {
  PieChart,
  BarChart,
  TrendingUp,
  Users,
  Wallet,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
} from 'recharts';
import { Transaction, Category, FamilyMember, Account } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { formatCurrency, formatCompactCurrency } from '../utils/formatters';

interface StatisticsTabProps {
  transactions: Transaction[];
  categories: Category[];
  members: FamilyMember[];
  accounts: Account[];
  selectedMonth: string;
}

type StatPeriod = 'current_month' | 'last_month' | 'last_3_months' | 'this_year' | 'all';
type StatDimension = 'category_expense' | 'category_income' | 'members' | 'accounts' | 'monthly_trends';

export const StatisticsTab: React.FC<StatisticsTabProps> = ({
  transactions,
  categories,
  members,
  accounts,
  selectedMonth,
}) => {
  const [period, setPeriod] = useState<StatPeriod>('current_month');
  const [dimension, setDimension] = useState<StatDimension>('category_expense');

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const accountMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);

  // Compute date range based on period
  const scopedTransactions = useMemo(() => {
    const [currYearStr, currMonthStr] = selectedMonth.split('-');
    const currYear = parseInt(currYearStr, 10);
    const currMonth = parseInt(currMonthStr, 10);

    return transactions.filter((t) => {
      if (period === 'current_month') {
        return t.date.startsWith(selectedMonth);
      }
      if (period === 'last_month') {
        let prevY = currYear;
        let prevM = currMonth - 1;
        if (prevM < 1) {
          prevM = 12;
          prevY -= 1;
        }
        const prevPrefix = `${prevY}-${String(prevM).padStart(2, '0')}`;
        return t.date.startsWith(prevPrefix);
      }
      if (period === 'last_3_months') {
        const d = new Date(t.date + 'T00:00:00');
        const endD = new Date(currYear, currMonth, 0);
        const startD = new Date(currYear, currMonth - 3, 1);
        return d >= startD && d <= endD;
      }
      if (period === 'this_year') {
        return t.date.startsWith(`${currYear}-`);
      }
      return true; // 'all'
    });
  }, [transactions, selectedMonth, period]);

  // Total Scoped Totals
  const totalExpense = useMemo(() => {
    return scopedTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [scopedTransactions]);

  const totalIncome = useMemo(() => {
    return scopedTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [scopedTransactions]);

  const netBalance = totalIncome - totalExpense;

  // 1. Category Breakdown Data (Expense)
  const categoryExpenseList = useMemo(() => {
    const map = new Map<string, { total: number; count: number; subcategories: Map<string, number> }>();

    scopedTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        if (!map.has(t.categoryId)) {
          map.set(t.categoryId, { total: 0, count: 0, subcategories: new Map() });
        }
        const entry = map.get(t.categoryId)!;
        entry.total += t.amount;
        entry.count += 1;
        if (t.subCategory) {
          entry.subcategories.set(
            t.subCategory,
            (entry.subcategories.get(t.subCategory) || 0) + t.amount
          );
        }
      });

    return Array.from(map.entries())
      .map(([catId, item]) => {
        const cat = categoryMap.get(catId);
        const percentage = totalExpense > 0 ? (item.total / totalExpense) * 100 : 0;
        const subList = Array.from(item.subcategories.entries())
          .map(([name, amount]) => ({ name, amount }))
          .sort((a, b) => b.amount - a.amount);

        return {
          id: catId,
          name: cat?.name || '其它',
          color: cat?.color || '#64748B',
          icon: cat?.icon || 'CircleDot',
          total: item.total,
          count: item.count,
          average: item.count > 0 ? item.total / item.count : 0,
          percentage,
          subList,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [scopedTransactions, categoryMap, totalExpense]);

  // 2. Category Breakdown Data (Income)
  const categoryIncomeList = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    scopedTransactions
      .filter((t) => t.type === 'income')
      .forEach((t) => {
        if (!map.has(t.categoryId)) {
          map.set(t.categoryId, { total: 0, count: 0 });
        }
        const entry = map.get(t.categoryId)!;
        entry.total += t.amount;
        entry.count += 1;
      });

    return Array.from(map.entries())
      .map(([catId, item]) => {
        const cat = categoryMap.get(catId);
        const percentage = totalIncome > 0 ? (item.total / totalIncome) * 100 : 0;
        return {
          id: catId,
          name: cat?.name || '其它收入',
          color: cat?.color || '#10B981',
          icon: cat?.icon || 'Banknote',
          total: item.total,
          count: item.count,
          average: item.count > 0 ? item.total / item.count : 0,
          percentage,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [scopedTransactions, categoryMap, totalIncome]);

  // 3. Member Spending Comparison Data
  const memberComparisonList = useMemo(() => {
    const map = new Map<string, { expense: number; income: number; count: number }>();
    members.forEach((m) => map.set(m.id, { expense: 0, income: 0, count: 0 }));

    scopedTransactions.forEach((t) => {
      const entry = map.get(t.memberId) || { expense: 0, income: 0, count: 0 };
      if (t.type === 'expense') entry.expense += t.amount;
      if (t.type === 'income') entry.income += t.amount;
      entry.count += 1;
      map.set(t.memberId, entry);
    });

    return members
      .map((m) => {
        const data = map.get(m.id) || { expense: 0, income: 0, count: 0 };
        return {
          id: m.id,
          name: m.name,
          color: m.avatarColor,
          expense: data.expense,
          income: data.income,
          count: data.count,
          expenseShare: totalExpense > 0 ? (data.expense / totalExpense) * 100 : 0,
        };
      })
      .sort((a, b) => b.expense - a.expense);
  }, [members, scopedTransactions, totalExpense]);

  // 4. Account Inflow / Outflow Data
  const accountStatsList = useMemo(() => {
    const map = new Map<string, { expense: number; income: number; count: number }>();
    accounts.forEach((a) => map.set(a.id, { expense: 0, income: 0, count: 0 }));

    scopedTransactions.forEach((t) => {
      const entry = map.get(t.accountId) || { expense: 0, income: 0, count: 0 };
      if (t.type === 'expense') entry.expense += t.amount;
      if (t.type === 'income') entry.income += t.amount;
      entry.count += 1;
      map.set(t.accountId, entry);
    });

    return accounts.map((a) => {
      const s = map.get(a.id) || { expense: 0, income: 0, count: 0 };
      return {
        id: a.id,
        name: a.name,
        color: a.color,
        balance: a.balance,
        expense: s.expense,
        income: s.income,
        count: s.count,
      };
    });
  }, [accounts, scopedTransactions]);

  // 5. 6-12 Months Trend Comparison Data
  const monthlyTrendsData = useMemo(() => {
    const monthlyMap = new Map<string, { expense: number; income: number }>();

    transactions.forEach((t) => {
      const ym = t.date.slice(0, 7);
      if (!monthlyMap.has(ym)) {
        monthlyMap.set(ym, { expense: 0, income: 0 });
      }
      const entry = monthlyMap.get(ym)!;
      if (t.type === 'expense') entry.expense += t.amount;
      if (t.type === 'income') entry.income += t.amount;
    });

    return Array.from(monthlyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([ym, val]) => ({
        month: ym,
        支出: Number(val.expense.toFixed(2)),
        收入: Number(val.income.toFixed(2)),
        净结余: Number((val.income - val.expense).toFixed(2)),
      }));
  }, [transactions]);

  const periodLabels: { [k in StatPeriod]: string } = {
    current_month: '本月',
    last_month: '上个月',
    last_3_months: '近3个月',
    this_year: '今年全年',
    all: '全部历史',
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Controls */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Period Selector */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          {(['current_month', 'last_month', 'last_3_months', 'this_year', 'all'] as StatPeriod[]).map((p) => (
            <button
              key={p}
              id={`stat-period-${p}`}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                period === p
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>

        {/* Aggregate Summary In Scope */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div>
            <span className="text-slate-400">总支出: </span>
            <span className="font-bold text-rose-600">{formatCurrency(totalExpense)}</span>
          </div>
          <div className="h-4 w-px bg-slate-200" />
          <div>
            <span className="text-slate-400">总收入: </span>
            <span className="font-bold text-emerald-600">{formatCurrency(totalIncome)}</span>
          </div>
          <div className="h-4 w-px bg-slate-200" />
          <div>
            <span className="text-slate-400">净结余: </span>
            <span
              className={`font-bold ${netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
            >
              {formatCurrency(netBalance, true)}
            </span>
          </div>
        </div>
      </div>

      {/* Dimension Switcher Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'category_expense', label: '支出分类排行', icon: PieChart },
          { id: 'category_income', label: '收入来源结构', icon: TrendingUp },
          { id: 'members', label: '家庭成员分布', icon: Users },
          { id: 'accounts', label: '账户流水分析', icon: Wallet },
          { id: 'monthly_trends', label: '月度趋势对比', icon: BarChart },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = dimension === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setDimension(tab.id as StatDimension)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dimension 1: Category Expense Breakdown */}
      {dimension === 'category_expense' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Doughnut Chart */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col">
            <h3 className="text-sm font-bold text-slate-800 mb-1">支出分类占比环形图</h3>
            <p className="text-xs text-slate-400 mb-4">{periodLabels[period]}各类支出分布</p>

            <div className="h-64 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={categoryExpenseList}
                    dataKey="total"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {categoryExpenseList.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(Number(val)), '金额']}
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      color: '#FFF',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                </RePieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-slate-400">总计支出</span>
                <span className="text-sm font-bold font-mono text-slate-800">
                  {formatCompactCurrency(totalExpense)}
                </span>
              </div>
            </div>
          </div>

          {/* Ranking Table with Subcategories */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">支出明细排名榜</h3>
                <p className="text-xs text-slate-400">包含主类别、二级明细、笔数与单笔均价</p>
              </div>
              <span className="text-xs text-slate-500">共 {categoryExpenseList.length} 个支出类别</span>
            </div>

            <div className="space-y-3">
              {categoryExpenseList.map((cat, idx) => (
                <div key={cat.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 space-y-2">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center font-mono">
                        {idx + 1}
                      </span>
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                        style={{ backgroundColor: cat.color }}
                      >
                        <CategoryIcon name={cat.icon} size={15} />
                      </div>
                      <span className="font-bold text-slate-800">{cat.name}</span>
                      <span className="text-[11px] text-slate-400 hidden sm:inline">
                        ({cat.count} 笔 · 均 ¥{cat.average.toFixed(1)}/笔)
                      </span>
                    </div>

                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-slate-900 font-bold">{formatCurrency(cat.total)}</span>
                      <span className="text-slate-500 text-xs w-12 text-right">
                        {cat.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ backgroundColor: cat.color, width: `${cat.percentage}%` }}
                    />
                  </div>

                  {/* Subcategories tag pills if any */}
                  {cat.subList.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                      {cat.subList.map((sub) => (
                        <span key={sub.name} className="bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-600">
                          {sub.name}: <strong className="font-mono text-slate-800">¥{sub.amount.toFixed(1)}</strong>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Dimension 2: Category Income Breakdown */}
      {dimension === 'category_income' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col">
            <h3 className="text-sm font-bold text-slate-800 mb-1">收入来源占比</h3>
            <p className="text-xs text-slate-400 mb-4">{periodLabels[period]}家庭收入构成</p>

            <div className="h-64 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={categoryIncomeList}
                    dataKey="total"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {categoryIncomeList.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(Number(val)), '金额']}
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      color: '#FFF',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                </RePieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-slate-400">总计收入</span>
                <span className="text-sm font-bold font-mono text-emerald-600">
                  {formatCompactCurrency(totalIncome)}
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800">收入来源明细</h3>
            <div className="space-y-3">
              {categoryIncomeList.map((cat, idx) => (
                <div key={cat.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 space-y-2">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center font-mono">
                        {idx + 1}
                      </span>
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                        style={{ backgroundColor: cat.color }}
                      >
                        <CategoryIcon name={cat.icon} size={15} />
                      </div>
                      <span className="font-bold text-slate-800">{cat.name}</span>
                      <span className="text-[11px] text-slate-400">({cat.count} 笔)</span>
                    </div>

                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-emerald-600 font-bold">{formatCurrency(cat.total)}</span>
                      <span className="text-slate-500 text-xs w-12 text-right">
                        {cat.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ backgroundColor: cat.color, width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Dimension 3: Member Distribution */}
      {dimension === 'members' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-800">家庭各成员收支贡献与开销</h3>
            <p className="text-xs text-slate-400">了解每位家庭成员的开支占比与收入情况</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {memberComparisonList.map((mem) => (
              <div key={mem.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-xs"
                      style={{ backgroundColor: mem.color }}
                    >
                      {mem.name.slice(0, 1)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{mem.name}</div>
                      <div className="text-[11px] text-slate-400">参与 {mem.count} 笔记账</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    开支占比 {mem.expenseShare.toFixed(1)}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-xs font-mono">
                  <div>
                    <div className="text-slate-400 text-[11px]">支出</div>
                    <div className="font-bold text-rose-600">{formatCurrency(mem.expense)}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[11px]">收入贡献</div>
                    <div className="font-bold text-emerald-600">{formatCurrency(mem.income)}</div>
                  </div>
                </div>

                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ backgroundColor: mem.color, width: `${mem.expenseShare}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dimension 4: Accounts Statistics */}
      {dimension === 'accounts' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-800">各支付渠道流水统计</h3>
            <p className="text-xs text-slate-400">{periodLabels[period]}微信、支付宝、银行卡等账户支出与进账</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {accountStatsList.map((acc) => (
              <div key={acc.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-800 text-sm">{acc.name}</div>
                  <span className="text-xs font-mono font-bold text-slate-700">
                    当前余额: {formatCurrency(acc.balance)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-slate-200">
                  <div>
                    <span className="text-slate-400 text-[11px] block">流出支出</span>
                    <span className="font-bold text-rose-600">{formatCurrency(acc.expense)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">流入收入</span>
                    <span className="font-bold text-emerald-600">{formatCurrency(acc.income)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dimension 5: Monthly Trends Chart */}
      {dimension === 'monthly_trends' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">近 12 个月收支与结余历史趋势大盘</h3>
              <p className="text-xs text-slate-400">宏观对比家庭财务收支演变与储蓄增长</p>
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={monthlyTrendsData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={formatCompactCurrency} />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val)), '']}
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    color: '#FFF',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend />
                <Bar dataKey="支出" fill="#F43F5E" radius={[4, 4, 0, 0]} />
                <Bar dataKey="收入" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="净结余" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
