import React from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  PieChart,
  CalendarDays,
  Target,
  WalletCards,
  Plus,
  Calculator,
  Download,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { ActiveTab } from '../types';
import { formatCurrency } from '../utils/formatters';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  monthlyBalance: number;
  monthlyExpense: number;
  onOpenNewTransaction: () => void;
  onOpenFinanceCalc: () => void;
  onOpenExportImport: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  selectedMonth,
  setSelectedMonth,
  monthlyBalance,
  monthlyExpense,
  onOpenNewTransaction,
  onOpenFinanceCalc,
  onOpenExportImport,
}) => {
  const [yearStr, monthStr] = selectedMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const handlePrevMonth = () => {
    let newYear = year;
    let newMonth = month - 1;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    setSelectedMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    let newYear = year;
    let newMonth = month + 1;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    setSelectedMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  const navItems = [
    { id: 'overview', label: '概览看板', icon: LayoutDashboard },
    { id: 'transactions', label: '收支流水', icon: ReceiptText },
    { id: 'statistics', label: '分类统计', icon: PieChart },
    { id: 'calendar', label: '日历对账', icon: CalendarDays },
    { id: 'budget', label: '预算管理', icon: Target },
    { id: 'accounts', label: '成员与账户', icon: WalletCards },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top Banner Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">家庭记账管家</h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 hidden sm:inline-block">
                  专业版
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">家庭收支管理与科学财务预算规划</p>
            </div>
          </div>

          {/* Month Switcher Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 shadow-2xs">
            <button
              id="prev-month-btn"
              onClick={handlePrevMonth}
              title="上个月"
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-all active:scale-95"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="px-3 text-xs sm:text-sm font-bold text-slate-800 font-mono tracking-tight select-none">
              {year}年{month}月
            </div>
            <button
              id="next-month-btn"
              onClick={handleNextMonth}
              title="下个月"
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-all active:scale-95"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Monthly Quick Snapshot */}
          <div className="hidden lg:flex items-center gap-4 bg-slate-50/90 px-4 py-1.5 rounded-xl border border-slate-200/70">
            <div className="text-right">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">本月支出</div>
              <div className="text-xs font-bold text-rose-600 font-mono">
                {formatCurrency(monthlyExpense)}
              </div>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div className="text-right">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">本月结余</div>
              <div
                className={`text-xs font-bold font-mono ${
                  monthlyBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {formatCurrency(monthlyBalance)}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              id="nav-calc-btn"
              onClick={onOpenFinanceCalc}
              title="家庭财务与房贷计算工具"
              className="px-3 py-2 rounded-xl text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/80 border border-slate-200/90 transition-all flex items-center gap-1.5 text-xs font-medium bg-white shadow-2xs active:scale-95"
            >
              <Calculator size={15} />
              <span className="hidden md:inline">财务计算</span>
            </button>

            <button
              id="nav-export-btn"
              onClick={onOpenExportImport}
              title="备份与导入/导出"
              className="px-3 py-2 rounded-xl text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/80 border border-slate-200/90 transition-all flex items-center gap-1.5 text-xs font-medium bg-white shadow-2xs active:scale-95"
            >
              <Download size={15} />
              <span className="hidden md:inline">备份导出</span>
            </button>

            <button
              id="nav-add-transaction-btn"
              onClick={onOpenNewTransaction}
              className="bg-indigo-600 text-white hover:bg-indigo-700 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-sm shadow-indigo-600/25 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Plus size={16} />
              <span>记一笔</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="border-t border-slate-200/80 bg-slate-50/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none" aria-label="Tabs">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`tab-${item.id}`}
                  onClick={() => setActiveTab(item.id as ActiveTab)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Icon size={15} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
