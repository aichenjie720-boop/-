import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Check,
  Plus,
  Calendar,
  Clock,
  Tag,
  FileText,
  User,
  Wallet,
  ArrowRightLeft,
  Divide,
  Percent,
} from 'lucide-react';
import { Transaction, TransactionType, Category, FamilyMember, Account } from '../types';
import { CategoryIcon } from './CategoryIcon';
import {
  getCurrentDateStr,
  getCurrentTimeStr,
  evaluateKeypadExpression,
  formatCurrency,
} from '../utils/formatters';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onUpdate?: (id: string, tx: Partial<Transaction>) => void;
  editingTransaction?: Transaction | null;
  categories: Category[];
  members: FamilyMember[];
  accounts: Account[];
  defaultDate?: string;
}

const COMMON_TAGS = [
  '三餐买菜',
  '工作餐',
  '家庭聚餐',
  '商超日用',
  '生活缴费',
  '加油停车',
  '孩子开销',
  '长辈孝敬',
  '周末休闲',
  '网购海淘',
  '医疗药品',
  '固定支出',
];

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  editingTransaction,
  categories,
  members,
  accounts,
  defaultDate,
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [selectedToAccountId, setSelectedToAccountId] = useState<string>('');
  const [date, setDate] = useState<string>(getCurrentDateStr());
  const [time, setTime] = useState<string>(getCurrentTimeStr());
  const [note, setNote] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState<string>('');
  const [showKeypad, setShowKeypad] = useState<boolean>(true);

  // Initialize or reset form
  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmountStr(String(editingTransaction.amount));
      setSelectedCategoryId(editingTransaction.categoryId);
      setSelectedSubCategory(editingTransaction.subCategory || '');
      setSelectedMemberId(editingTransaction.memberId);
      setSelectedAccountId(editingTransaction.accountId);
      setSelectedToAccountId(editingTransaction.toAccountId || '');
      setDate(editingTransaction.date);
      setTime(editingTransaction.time || getCurrentTimeStr());
      setNote(editingTransaction.note || '');
      setTags(editingTransaction.tags || []);
    } else {
      setType('expense');
      setAmountStr('');
      const defaultExpCat = categories.find((c) => c.type === 'expense');
      setSelectedCategoryId(defaultExpCat ? defaultExpCat.id : '');
      setSelectedSubCategory(defaultExpCat?.subcategories?.[0] || '');
      setSelectedMemberId(members[0]?.id || '');
      setSelectedAccountId(accounts[0]?.id || '');
      setSelectedToAccountId(accounts[1]?.id || '');
      setDate(defaultDate || getCurrentDateStr());
      setTime(getCurrentTimeStr());
      setNote('');
      setTags([]);
    }
  }, [editingTransaction, isOpen, defaultDate, categories, members, accounts]);

  // When type changes, ensure valid default category
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => (type === 'transfer' ? c.type === 'expense' : c.type === type));
  }, [categories, type]);

  const currentCategory = useMemo(() => {
    return categories.find((c) => c.id === selectedCategoryId);
  }, [categories, selectedCategoryId]);

  // Real-time parsed amount
  const computedAmount = useMemo(() => {
    const res = evaluateKeypadExpression(amountStr);
    return res !== null && res > 0 ? res : 0;
  }, [amountStr]);

  const handleKeypadPress = (key: string) => {
    if (key === 'C') {
      setAmountStr('');
    } else if (key === 'BACKSPACE') {
      setAmountStr((prev) => prev.slice(0, -1));
    } else if (key === '=') {
      if (computedAmount > 0) {
        setAmountStr(String(Number(computedAmount.toFixed(2))));
      }
    } else {
      // Prevent double decimal points in current token
      if (key === '.') {
        const parts = amountStr.split(/[+\-*/]/);
        const lastPart = parts[parts.length - 1];
        if (lastPart.includes('.')) return;
      }
      // Prevent consecutive operators
      if (['+', '-', '*', '/'].includes(key)) {
        if (!amountStr || ['+', '-', '*', '/'].includes(amountStr.slice(-1))) return;
      }
      setAmountStr((prev) => prev + key);
    }
  };

  const handleToggleTag = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleAddCustomTag = () => {
    if (customTagInput.trim() && !tags.includes(customTagInput.trim())) {
      setTags((prev) => [...prev, customTagInput.trim()]);
      setCustomTagInput('');
    }
  };

  const handleSubmit = (continuous: boolean = false) => {
    const finalAmount = computedAmount;
    if (!finalAmount || finalAmount <= 0) {
      alert('请输入大于 0 的有效记账金额');
      return;
    }

    if (type === 'transfer' && selectedAccountId === selectedToAccountId) {
      alert('转出账户与转入账户不能相同');
      return;
    }

    const payload = {
      type,
      amount: Number(finalAmount.toFixed(2)),
      categoryId: selectedCategoryId || (filteredCategories[0]?.id ?? 'cat_other_expense'),
      subCategory: selectedSubCategory || undefined,
      memberId: selectedMemberId || (members[0]?.id ?? 'mem_shared'),
      accountId: selectedAccountId || (accounts[0]?.id ?? 'acc_wechat'),
      toAccountId: type === 'transfer' ? selectedToAccountId : undefined,
      date,
      time,
      note: note.trim(),
      tags: tags.length > 0 ? tags : undefined,
    };

    if (editingTransaction && onUpdate) {
      onUpdate(editingTransaction.id, payload);
      onClose();
    } else {
      onSave(payload);
      if (continuous) {
        // Reset amount and note for next entry while preserving category/account/member
        setAmountStr('');
        setNote('');
        setTags([]);
      } else {
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="transaction-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="transaction-modal-container"
        className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Header with Type Selector */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex bg-slate-200/70 p-1 rounded-xl border border-slate-200">
            <button
              id="type-btn-expense"
              type="button"
              onClick={() => {
                setType('expense');
                const expCat = categories.find((c) => c.type === 'expense');
                if (expCat) {
                  setSelectedCategoryId(expCat.id);
                  setSelectedSubCategory(expCat.subcategories?.[0] || '');
                }
              }}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              支出
            </button>
            <button
              id="type-btn-income"
              type="button"
              onClick={() => {
                setType('income');
                const incCat = categories.find((c) => c.type === 'income');
                if (incCat) {
                  setSelectedCategoryId(incCat.id);
                  setSelectedSubCategory(incCat.subcategories?.[0] || '');
                }
              }}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              收入
            </button>
            <button
              id="type-btn-transfer"
              type="button"
              onClick={() => setType('transfer')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                type === 'transfer'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              转账
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              {editingTransaction ? '编辑账目' : '新建记录'}
            </span>
            <button
              id="modal-close-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Amount Display & Keypad Preview */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex-1 w-full">
              <div className="text-xs font-semibold text-slate-500 mb-1 flex items-center justify-between">
                <span>金额 ({type === 'expense' ? '支出' : type === 'income' ? '收入' : '转账'})</span>
                {amountStr && (
                  <span className="text-xs text-slate-500 font-mono">
                    计算结果: {formatCurrency(computedAmount)}
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-2xl font-bold font-mono ${
                    type === 'expense'
                      ? 'text-rose-600'
                      : type === 'income'
                      ? 'text-emerald-600'
                      : 'text-indigo-600'
                  }`}
                >
                  ¥
                </span>
                <input
                  id="transaction-amount-input"
                  type="text"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  placeholder="0.00"
                  className="text-3xl font-bold font-mono tracking-tight bg-transparent text-slate-900 focus:outline-none w-full placeholder-slate-300"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowKeypad(!showKeypad)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shrink-0 shadow-2xs"
            >
              {showKeypad ? '收起数字键盘' : '展开数字键盘'}
            </button>
          </div>

          {/* Quick Calculator Keypad */}
          {showKeypad && (
            <div className="grid grid-cols-4 gap-2 bg-slate-100/80 p-3 rounded-xl border border-slate-200">
              {['7', '8', '9', '/'].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => handleKeypadPress(k)}
                  className={`h-11 rounded-lg font-mono text-base font-semibold transition-all active:scale-95 ${
                    k === '/'
                      ? 'bg-slate-200 text-indigo-700 hover:bg-slate-300'
                      : 'bg-white text-slate-800 shadow-xs hover:bg-slate-50 border border-slate-200/50'
                  }`}
                >
                  {k === '/' ? '÷' : k}
                </button>
              ))}
              {['4', '5', '6', '*'].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => handleKeypadPress(k)}
                  className={`h-11 rounded-lg font-mono text-base font-semibold transition-all active:scale-95 ${
                    k === '*'
                      ? 'bg-slate-200 text-indigo-700 hover:bg-slate-300'
                      : 'bg-white text-slate-800 shadow-xs hover:bg-slate-50 border border-slate-200/50'
                  }`}
                >
                  {k === '*' ? '×' : k}
                </button>
              ))}
              {['1', '2', '3', '-'].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => handleKeypadPress(k)}
                  className={`h-11 rounded-lg font-mono text-base font-semibold transition-all active:scale-95 ${
                    k === '-'
                      ? 'bg-slate-200 text-indigo-700 hover:bg-slate-300'
                      : 'bg-white text-slate-800 shadow-xs hover:bg-slate-50 border border-slate-200/50'
                  }`}
                >
                  {k}
                </button>
              ))}
              {['C', '0', '.', '+'].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => handleKeypadPress(k)}
                  className={`h-11 rounded-lg font-mono text-base font-semibold transition-all active:scale-95 ${
                    k === 'C'
                      ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                      : k === '+'
                      ? 'bg-slate-200 text-indigo-700 hover:bg-slate-300'
                      : 'bg-white text-slate-800 shadow-xs hover:bg-slate-50 border border-slate-200/50'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          )}

          {/* Category Picker (For Expense & Income) */}
          {type !== 'transfer' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                选择分类
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1">
                {filteredCategories.map((cat) => {
                  const isSelected = cat.id === selectedCategoryId;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategoryId(cat.id);
                        setSelectedSubCategory(cat.subcategories?.[0] || '');
                      }}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 font-semibold shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center mb-1 text-white shadow-2xs"
                        style={{ backgroundColor: cat.color }}
                      >
                        <CategoryIcon name={cat.icon} size={18} />
                      </div>
                      <span className="text-xs truncate w-full text-center">{cat.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Subcategories */}
              {currentCategory && currentCategory.subcategories && currentCategory.subcategories.length > 0 && (
                <div className="pt-2">
                  <div className="text-xs text-slate-500 font-semibold mb-1.5">二级明细（可选）:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {currentCategory.subcategories.map((sub) => {
                      const isSubSelected = selectedSubCategory === sub;
                      return (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => setSelectedSubCategory(isSubSelected ? '' : sub)}
                          className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                            isSubSelected
                              ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {sub}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Member & Account Selection Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Member Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <User size={14} /> 归属成员 / 使用人
              </label>
              <div className="flex flex-wrap gap-1.5">
                {members.map((mem) => {
                  const isSelected = mem.id === selectedMemberId;
                  return (
                    <button
                      key={mem.id}
                      type="button"
                      onClick={() => setSelectedMemberId(mem.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 border transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-semibold shadow-xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: mem.avatarColor }}
                      />
                      {mem.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Account Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Wallet size={14} /> {type === 'transfer' ? '转出账户' : '支付/收入账户'}
              </label>
              <select
                id="transaction-account-select"
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} (余额: ¥{acc.balance.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Transfer Target Account (if transfer) */}
          {type === 'transfer' && (
            <div className="space-y-1.5 p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100">
              <label className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                <ArrowRightLeft size={14} /> 转入目标账户
              </label>
              <select
                id="transaction-to-account-select"
                value={selectedToAccountId}
                onChange={(e) => setSelectedToAccountId(e.target.value)}
                className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              >
                {accounts
                  .filter((a) => a.id !== selectedAccountId)
                  .map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (余额: ¥{acc.balance.toFixed(2)})
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Date & Time Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={14} /> 记账日期
              </label>
              <input
                id="transaction-date-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={14} /> 时间
              </label>
              <input
                id="transaction-time-input"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
          </div>

          {/* Notes & Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <FileText size={14} /> 备注说明
            </label>
            <input
              id="transaction-note-input"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="添加简要备注（如：周末买菜、山姆会员店等）"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 placeholder-slate-400"
            />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Tag size={14} /> 快捷标签
            </label>
            <div className="flex flex-wrap gap-1.5 items-center">
              {COMMON_TAGS.map((t) => {
                const isSelected = tags.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleToggleTag(t)}
                    className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                      isSelected
                        ? 'bg-slate-800 text-white font-semibold shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium'
                    }`}
                  >
                    #{t}
                  </button>
                );
              })}
              {/* Custom tags entered */}
              {tags
                .filter((t) => !COMMON_TAGS.includes(t))
                .map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleToggleTag(t)}
                    className="px-2.5 py-1 rounded-lg text-xs bg-indigo-600 text-white font-semibold flex items-center gap-1 shadow-2xs"
                  >
                    #{t} <X size={12} />
                  </button>
                ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomTag();
                  }
                }}
                placeholder="+ 自定义标签"
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
              <button
                type="button"
                onClick={handleAddCustomTag}
                className="px-2.5 py-1.5 text-xs bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-medium"
              >
                添加
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs sm:text-sm font-semibold hover:bg-white transition-colors"
          >
            取消
          </button>

          <div className="flex items-center gap-2.5">
            {!editingTransaction && (
              <button
                id="btn-save-and-continue"
                type="button"
                onClick={() => handleSubmit(true)}
                className="px-4 py-2 rounded-xl bg-slate-200 text-slate-800 text-xs sm:text-sm font-semibold hover:bg-slate-300 transition-colors flex items-center gap-1.5"
              >
                <Plus size={16} /> 再记一笔
              </button>
            )}
            <button
              id="btn-save-transaction"
              type="button"
              onClick={() => handleSubmit(false)}
              className="px-6 py-2 rounded-xl bg-indigo-600 text-white text-xs sm:text-sm font-semibold hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Check size={16} /> {editingTransaction ? '保存修改' : '确认记账'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
