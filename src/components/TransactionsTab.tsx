import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Trash2,
  Edit2,
  Calendar,
  X,
  Download,
  Plus,
  ArrowUpDown,
  Tag as TagIcon,
  CheckSquare,
  Square,
  Layers,
} from 'lucide-react';
import { Transaction, Category, FamilyMember, Account, FilterOptions } from '../types';
import { CategoryIcon } from './CategoryIcon';
import {
  formatCurrency,
  formatDateChinese,
  generateCsvData,
  downloadFile,
} from '../utils/formatters';

interface TransactionsTabProps {
  transactions: Transaction[];
  categories: Category[];
  members: FamilyMember[];
  accounts: Account[];
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  onOpenNewTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onBatchDeleteTransactions: (ids: string[]) => void;
}

export const TransactionsTab: React.FC<TransactionsTabProps> = ({
  transactions,
  categories,
  members,
  accounts,
  filters,
  setFilters,
  onOpenNewTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onBatchDeleteTransactions,
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const accountMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);

  // Filtered transactions
  const filteredList = useMemo(() => {
    return transactions.filter((t) => {
      if (filters.type !== 'all' && t.type !== filters.type) return false;
      if (filters.categoryId && filters.categoryId !== 'all' && t.categoryId !== filters.categoryId) return false;
      if (filters.memberId && filters.memberId !== 'all' && t.memberId !== filters.memberId) return false;
      if (
        filters.accountId &&
        filters.accountId !== 'all' &&
        t.accountId !== filters.accountId &&
        t.toAccountId !== filters.accountId
      )
        return false;
      if (filters.startDate && t.date < filters.startDate) return false;
      if (filters.endDate && t.date > filters.endDate) return false;
      if (filters.minAmount !== undefined && t.amount < filters.minAmount) return false;
      if (filters.maxAmount !== undefined && t.amount > filters.maxAmount) return false;
      if (filters.tag && !(t.tags || []).includes(filters.tag)) return false;
      if (filters.searchKeyword) {
        const kw = filters.searchKeyword.toLowerCase();
        const noteMatch = (t.note || '').toLowerCase().includes(kw);
        const subMatch = (t.subCategory || '').toLowerCase().includes(kw);
        const tagMatch = (t.tags || []).some((tag) => tag.toLowerCase().includes(kw));
        const cat = categoryMap.get(t.categoryId)?.name.toLowerCase().includes(kw);
        if (!noteMatch && !subMatch && !tagMatch && !cat) return false;
      }
      return true;
    });
  }, [transactions, filters, categoryMap]);

  // Sorted list
  const sortedList = useMemo(() => {
    return [...filteredList].sort((a, b) => {
      const aTime = a.date + (a.time || '');
      const bTime = b.date + (b.time || '');
      return sortOrder === 'desc' ? bTime.localeCompare(aTime) : aTime.localeCompare(bTime);
    });
  }, [filteredList, sortOrder]);

  // Summary of filtered items
  const summary = useMemo(() => {
    let exp = 0;
    let inc = 0;
    filteredList.forEach((t) => {
      if (t.type === 'expense') exp += t.amount;
      if (t.type === 'income') inc += t.amount;
    });
    return {
      count: filteredList.length,
      expense: exp,
      income: inc,
      balance: inc - exp,
    };
  }, [filteredList]);

  // Group transactions by date
  const groupedByDate = useMemo<Record<string, Transaction[]>>(() => {
    const groups: Record<string, Transaction[]> = {};
    sortedList.forEach((t) => {
      if (!groups[t.date]) groups[t.date] = [];
      groups[t.date].push(t);
    });
    return groups;
  }, [sortedList]);

  // Batch Selection Handlers
  const handleSelectAll = () => {
    if (selectedIds.length === sortedList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sortedList.map((t) => t.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`确定要删除选中的 ${selectedIds.length} 笔记录吗？此操作可在稍后撤销。`)) {
      onBatchDeleteTransactions(selectedIds);
      setSelectedIds([]);
    }
  };

  const handleExportFilteredCsv = () => {
    const csv = generateCsvData(sortedList, categories, members, accounts);
    downloadFile(csv, `家庭收支流水清单_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
  };

  const handleResetFilters = () => {
    setFilters({
      type: 'all',
      categoryId: 'all',
      memberId: 'all',
      accountId: 'all',
      startDate: '',
      endDate: '',
      searchKeyword: '',
      minAmount: undefined,
      maxAmount: undefined,
      tag: undefined,
    });
  };

  const hasActiveFilters =
    filters.type !== 'all' ||
    filters.categoryId !== 'all' ||
    filters.memberId !== 'all' ||
    filters.accountId !== 'all' ||
    Boolean(filters.startDate) ||
    Boolean(filters.endDate) ||
    Boolean(filters.searchKeyword) ||
    filters.minAmount !== undefined ||
    filters.maxAmount !== undefined ||
    Boolean(filters.tag);

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
        {/* Quick Filter Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Keyword Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              id="filter-search-input"
              type="text"
              value={filters.searchKeyword}
              onChange={(e) => setFilters((prev) => ({ ...prev, searchKeyword: e.target.value }))}
              placeholder="搜索备注、二级明细、标签或分类..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400"
            />
            {filters.searchKeyword && (
              <button
                onClick={() => setFilters((prev) => ({ ...prev, searchKeyword: '' }))}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Type Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
            {(['all', 'expense', 'income', 'transfer'] as const).map((t) => {
              const labels = { all: '全部', expense: '支出', income: '收入', transfer: '转账' };
              const isSelected = filters.type === t;
              return (
                <button
                  key={t}
                  id={`filter-type-${t}`}
                  onClick={() => setFilters((prev) => ({ ...prev, type: t }))}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                    isSelected
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {labels[t]}
                </button>
              );
            })}
          </div>

          {/* Toggle Filter Options & Order */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 ${
                showAdvancedFilters || hasActiveFilters
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Filter size={14} />
              <span>筛选</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" />
              )}
            </button>

            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              title={sortOrder === 'desc' ? '按时间倒序' : '按时间正序'}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <ArrowUpDown size={15} />
            </button>

            <button
              onClick={onOpenNewTransaction}
              className="bg-indigo-600 text-white px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-1 shrink-0"
            >
              <Plus size={15} /> 记一笔
            </button>
          </div>
        </div>

        {/* Expandable Advanced Multi-Filter Options */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Category Filter */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                分类筛选
              </label>
              <select
                value={filters.categoryId}
                onChange={(e) => setFilters((prev) => ({ ...prev, categoryId: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">全部分类</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.type === 'expense' ? '【支出】' : '【收入】'} {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Member Filter */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                家庭成员
              </label>
              <select
                value={filters.memberId}
                onChange={(e) => setFilters((prev) => ({ ...prev, memberId: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">全部成员</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Account Filter */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                支付账户
              </label>
              <select
                value={filters.accountId}
                onChange={(e) => setFilters((prev) => ({ ...prev, accountId: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">全部账户</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Start & End */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                起止日期
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700"
                />
                <span className="text-slate-400 text-xs">至</span>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                  className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700"
                />
              </div>
            </div>

            {/* Reset Action */}
            {hasActiveFilters && (
              <div className="sm:col-span-2 md:col-span-4 flex justify-end">
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1"
                >
                  <X size={13} /> 清空所有筛选条件
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter Stats & Batch Operations Bar */}
      <div className="bg-white rounded-2xl p-3.5 px-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="text-slate-600 hover:text-indigo-600 flex items-center gap-1 font-medium"
            >
              {selectedIds.length > 0 && selectedIds.length === sortedList.length ? (
                <CheckSquare size={16} className="text-indigo-600" />
              ) : (
                <Square size={16} />
              )}
              <span>全选 ({sortedList.length} 条)</span>
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200" />

          <div className="flex items-center gap-3">
            <span>
              支出: <strong className="text-rose-600 font-mono">{formatCurrency(summary.expense)}</strong>
            </span>
            <span>
              收入: <strong className="text-emerald-600 font-mono">{formatCurrency(summary.income)}</strong>
            </span>
            <span>
              结余:{' '}
              <strong
                className={`font-mono ${
                  summary.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {formatCurrency(summary.balance, true)}
              </strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              onClick={handleBatchDelete}
              className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold hover:bg-rose-100 transition-colors flex items-center gap-1"
            >
              <Trash2 size={13} /> 批量删除 ({selectedIds.length})
            </button>
          )}

          <button
            onClick={handleExportFilteredCsv}
            className="px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-colors flex items-center gap-1"
          >
            <Download size={13} /> 导出当前结果 (CSV)
          </button>
        </div>
      </div>

      {/* Date-Grouped Transaction List */}
      {Object.keys(groupedByDate).length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs">
          <Layers className="mx-auto text-slate-300 mb-3" size={40} />
          <h4 className="text-sm font-bold text-slate-700 mb-1">未检索到相关流水账目</h4>
          <p className="text-xs text-slate-400 mb-4">可以尝试更改筛选条件或添加新的一笔收支</p>
          <button
            onClick={onOpenNewTransaction}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700"
          >
            记一笔账
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {(Object.entries(groupedByDate) as [string, Transaction[]][]).map(([dateStr, items]) => {
            const dayExp = items
              .filter((t) => t.type === 'expense')
              .reduce((s, t) => s + t.amount, 0);
            const dayInc = items
              .filter((t) => t.type === 'income')
              .reduce((s, t) => s + t.amount, 0);

            return (
              <div
                key={dateStr}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden"
              >
                {/* Date Group Header */}
                <div className="bg-slate-50/80 px-4 py-2.5 border-b border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-slate-400" />
                    <span className="font-bold text-slate-800">{formatDateChinese(dateStr)}</span>
                    <span className="text-slate-400 font-mono">({dateStr})</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono">
                    {dayExp > 0 && (
                      <span className="text-slate-500">
                        支: <strong className="text-rose-600">{formatCurrency(dayExp)}</strong>
                      </span>
                    )}
                    {dayInc > 0 && (
                      <span className="text-slate-500">
                        收: <strong className="text-emerald-600">{formatCurrency(dayInc)}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Items in this date */}
                <div className="divide-y divide-slate-100">
                  {items.map((tx) => {
                    const cat = categoryMap.get(tx.categoryId);
                    const mem = memberMap.get(tx.memberId);
                    const acc = accountMap.get(tx.accountId);
                    const toAcc = tx.toAccountId ? accountMap.get(tx.toAccountId) : null;
                    const isSelected = selectedIds.includes(tx.id);

                    return (
                      <div
                        key={tx.id}
                        className={`p-3.5 sm:px-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors group ${
                          isSelected ? 'bg-indigo-50/40' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleToggleSelect(tx.id)}
                            className="text-slate-400 hover:text-indigo-600"
                          >
                            {isSelected ? (
                              <CheckSquare size={16} className="text-indigo-600" />
                            ) : (
                              <Square size={16} />
                            )}
                          </button>

                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                            style={{
                              backgroundColor:
                                tx.type === 'transfer' ? '#6366F1' : cat?.color || '#94A3B8',
                            }}
                          >
                            <CategoryIcon name={cat?.icon || 'CircleDot'} size={20} />
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-sm font-bold text-slate-800">
                                {tx.type === 'transfer'
                                  ? `转账: ${acc?.name} ➔ ${toAcc?.name}`
                                  : cat?.name || '未分类'}
                              </span>

                              {tx.subCategory && (
                                <span className="text-[11px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                                  {tx.subCategory}
                                </span>
                              )}

                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                                style={{
                                  backgroundColor: `${mem?.avatarColor}15`,
                                  color: mem?.avatarColor,
                                }}
                              >
                                {mem?.name}
                              </span>

                              <span className="text-[10px] text-slate-400 bg-slate-100/70 px-1.5 py-0.5 rounded">
                                {acc?.name}
                              </span>
                            </div>

                            {/* Notes and tags */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs text-slate-500">
                              {tx.time && <span className="text-slate-400 font-mono">{tx.time}</span>}
                              {tx.note && <span>{tx.note}</span>}
                              {(tx.tags || []).map((tg) => (
                                <span
                                  key={tg}
                                  className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded font-medium flex items-center gap-0.5"
                                >
                                  <TagIcon size={10} /> {tg}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Amount & Quick Actions */}
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span
                              className={`text-base font-bold font-mono ${
                                tx.type === 'expense'
                                  ? 'text-rose-600'
                                  : tx.type === 'income'
                                  ? 'text-emerald-600'
                                  : 'text-indigo-600'
                              }`}
                            >
                              {tx.type === 'expense' ? '-' : tx.type === 'income' ? '+' : ''}
                              ¥{tx.amount.toFixed(2)}
                            </span>
                          </div>

                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            <button
                              onClick={() => onEditTransaction(tx)}
                              title="编辑"
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => onDeleteTransaction(tx.id)}
                              title="删除"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
