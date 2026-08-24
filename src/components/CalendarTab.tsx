import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  Receipt,
} from 'lucide-react';
import { Transaction, Category, FamilyMember, Account } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { formatCurrency, formatDateChinese } from '../utils/formatters';

interface CalendarTabProps {
  selectedMonth: string;
  setSelectedMonth: (m: string) => void;
  transactions: Transaction[];
  categories: Category[];
  members: FamilyMember[];
  accounts: Account[];
  onOpenNewTransactionForDate: (date: string) => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export const CalendarTab: React.FC<CalendarTabProps> = ({
  selectedMonth,
  setSelectedMonth,
  transactions,
  categories,
  members,
  accounts,
  onOpenNewTransactionForDate,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const [selectedDay, setSelectedDay] = useState<string>(() => {
    const today = new Date().toISOString().slice(0, 10);
    return today.startsWith(selectedMonth) ? today : `${selectedMonth}-01`;
  });

  const [yearStr, monthStr] = selectedMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const accountMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);

  // Calendar cells computation
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayWeekday = new Date(year, month - 1, 1).getDay(); // 0 = Sunday

  // Aggregate stats per day in selected month
  const dailySummary = useMemo(() => {
    const map = new Map<string, { expense: number; income: number; count: number }>();

    transactions
      .filter((t) => t.date.startsWith(selectedMonth))
      .forEach((t) => {
        if (!map.has(t.date)) {
          map.set(t.date, { expense: 0, income: 0, count: 0 });
        }
        const entry = map.get(t.date)!;
        if (t.type === 'expense') entry.expense += t.amount;
        if (t.type === 'income') entry.income += t.amount;
        entry.count += 1;
      });

    return map;
  }, [transactions, selectedMonth]);

  // Selected Day's transactions
  const selectedDayTransactions = useMemo(() => {
    return transactions.filter((t) => t.date === selectedDay);
  }, [transactions, selectedDay]);

  const selectedDayExpense = useMemo(() => {
    return selectedDayTransactions
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
  }, [selectedDayTransactions]);

  const selectedDayIncome = useMemo(() => {
    return selectedDayTransactions
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);
  }, [selectedDayTransactions]);

  // Build calendar matrix
  const calendarCells = useMemo(() => {
    const cells = [];
    // Padding for days before the 1st
    for (let i = 0; i < firstDayWeekday; i++) {
      cells.push({ dayNum: null, dateStr: '' });
    }
    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${selectedMonth}-${String(d).padStart(2, '0')}`;
      const stats = dailySummary.get(dateStr) || { expense: 0, income: 0, count: 0 };
      cells.push({
        dayNum: d,
        dateStr,
        expense: stats.expense,
        income: stats.income,
        count: stats.count,
      });
    }
    return cells;
  }, [firstDayWeekday, daysInMonth, selectedMonth, dailySummary]);

  const handlePrevMonth = () => {
    let newYear = year;
    let newMonth = month - 1;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    const ym = `${newYear}-${String(newMonth).padStart(2, '0')}`;
    setSelectedMonth(ym);
    setSelectedDay(`${ym}-01`);
  };

  const handleNextMonth = () => {
    let newYear = year;
    let newMonth = month + 1;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    const ym = `${newYear}-${String(newMonth).padStart(2, '0')}`;
    setSelectedMonth(ym);
    setSelectedDay(`${ym}-01`);
  };

  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar Grid Container */}
      <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4 hover:border-slate-300 transition-all">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CalendarIcon size={17} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">家庭日历对账视图</h3>
              <p className="text-xs text-slate-400">每日流水直观排布与快速定位</p>
            </div>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60">
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 text-xs sm:text-sm font-bold font-mono text-slate-800">
              {year}年 {month}月
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Weekday Header */}
        <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-slate-500 uppercase tracking-wider pb-1 border-b border-slate-100">
          {weekdays.map((w, i) => (
            <div key={w} className={i === 0 || i === 6 ? 'text-rose-500' : ''}>
              {w}
            </div>
          ))}
        </div>

        {/* Days Matrix */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {calendarCells.map((cell, idx) => {
            if (!cell.dayNum) {
              return <div key={`empty-${idx}`} className="h-16 sm:h-20 bg-slate-50/40 rounded-xl" />;
            }

            const isSelected = cell.dateStr === selectedDay;
            const hasExpense = (cell.expense || 0) > 0;
            const hasIncome = (cell.income || 0) > 0;

            return (
              <button
                key={cell.dateStr}
                onClick={() => setSelectedDay(cell.dateStr)}
                className={`h-16 sm:h-20 p-1.5 rounded-xl border flex flex-col justify-between text-left transition-all relative ${
                  isSelected
                    ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/40 shadow-xs'
                    : hasExpense && (cell.expense || 0) > 500
                    ? 'border-rose-200 bg-rose-50/30 hover:border-rose-300'
                    : 'border-slate-200 bg-white hover:bg-slate-50/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-xs font-mono font-bold ${
                      isSelected ? 'text-indigo-600' : 'text-slate-700'
                    }`}
                  >
                    {cell.dayNum}
                  </span>
                  {cell.count && cell.count > 0 ? (
                    <span className="text-[10px] text-slate-400 font-mono hidden sm:inline font-medium">
                      {cell.count}笔
                    </span>
                  ) : null}
                </div>

                <div className="w-full space-y-0.5 font-mono text-[10px] sm:text-[11px] truncate">
                  {hasExpense && (
                    <div className="text-rose-600 font-bold truncate">
                      -¥{Math.round(cell.expense || 0)}
                    </div>
                  )}
                  {hasIncome && (
                    <div className="text-emerald-600 font-bold truncate">
                      +¥{Math.round(cell.income || 0)}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Detail Sidebar */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">{formatDateChinese(selectedDay)}</h3>
              <p className="text-xs text-slate-400 font-mono">{selectedDay}</p>
            </div>

            <button
              onClick={() => onOpenNewTransactionForDate(selectedDay)}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-1 shadow-sm shadow-indigo-600/20 active:scale-95"
            >
              <Plus size={14} /> 记此日账目
            </button>
          </div>

          {/* Day Totals Summary */}
          <div className="grid grid-cols-2 gap-3 my-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 font-mono text-xs">
            <div>
              <span className="text-slate-400 text-[11px] block font-sans font-semibold">当日支出</span>
              <span className="font-bold text-rose-600 text-base">
                {formatCurrency(selectedDayExpense)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block font-sans font-semibold">当日收入</span>
              <span className="font-bold text-emerald-600 text-base">
                {formatCurrency(selectedDayIncome)}
              </span>
            </div>
          </div>

          {/* Transaction List for Selected Day */}
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {selectedDayTransactions.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Receipt className="mx-auto text-slate-300 mb-2" size={32} />
                <p className="text-xs">该日无记账流水记录</p>
              </div>
            ) : (
              selectedDayTransactions.map((tx) => {
                const cat = categoryMap.get(tx.categoryId);
                const mem = memberMap.get(tx.memberId);
                const acc = accountMap.get(tx.accountId);
                const toAcc = tx.toAccountId ? accountMap.get(tx.toAccountId) : null;

                return (
                  <div
                    key={tx.id}
                    className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-center justify-between hover:bg-slate-100/70 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-2xs"
                        style={{
                          backgroundColor:
                            tx.type === 'transfer' ? '#6366F1' : cat?.color || '#94A3B8',
                        }}
                      >
                        <CategoryIcon name={cat?.icon || 'CircleDot'} size={16} />
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                          <span>
                            {tx.type === 'transfer'
                              ? `转账: ${acc?.name}➔${toAcc?.name}`
                              : cat?.name || '未分类'}
                          </span>
                          {tx.subCategory && (
                            <span className="text-[10px] bg-white border border-slate-200 text-slate-600 px-1 rounded font-medium">
                              {tx.subCategory}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                          <span>{mem?.name}</span>
                          <span>·</span>
                          <span>{acc?.name}</span>
                          {tx.note && <span>· {tx.note}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs sm:text-sm font-bold font-mono ${
                          tx.type === 'expense'
                            ? 'text-rose-600'
                            : tx.type === 'income'
                            ? 'text-emerald-600'
                            : 'text-indigo-600'
                        }`}
                      >
                        {tx.type === 'expense' ? '-' : tx.type === 'income' ? '+' : ''}¥
                        {tx.amount.toFixed(2)}
                      </span>

                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                        <button
                          onClick={() => onEditTransaction(tx)}
                          className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => onDeleteTransaction(tx.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
