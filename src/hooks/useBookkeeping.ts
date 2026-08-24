import { useState, useEffect, useMemo } from 'react';
import {
  Transaction,
  Category,
  FamilyMember,
  Account,
  MonthlyBudget,
  FilterOptions,
} from '../types';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_MEMBERS,
  DEFAULT_ACCOUNTS,
  DEFAULT_BUDGET,
  INITIAL_TRANSACTIONS,
} from '../data/initialData';
import { getCurrentYearMonth, getCurrentDateStr } from '../utils/formatters';

const STORAGE_KEY_TXS = 'family_ledger_transactions_v2';
const STORAGE_KEY_CATS = 'family_ledger_categories_v2';
const STORAGE_KEY_MEMS = 'family_ledger_members_v2';
const STORAGE_KEY_ACCS = 'family_ledger_accounts_v2';
const STORAGE_KEY_BUDGETS = 'family_ledger_budgets_v2';

export function useBookkeeping() {
  // Current active year-month for monthly view
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentYearMonth());

  // Core Data loaded from localStorage or initialized
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TXS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load transactions from localStorage', e);
    }
    return INITIAL_TRANSACTIONS;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CATS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load categories', e);
    }
    return DEFAULT_CATEGORIES;
  });

  const [members, setMembers] = useState<FamilyMember[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MEMS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load members', e);
    }
    return DEFAULT_MEMBERS;
  });

  const [accounts, setAccounts] = useState<Account[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACCS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load accounts', e);
    }
    return DEFAULT_ACCOUNTS;
  });

  const [budgets, setBudgets] = useState<MonthlyBudget[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BUDGETS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load budgets', e);
    }
    return [DEFAULT_BUDGET];
  });

  // Undo support for deletions
  const [lastDeletedTx, setLastDeletedTx] = useState<Transaction | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters for ledger view
  const [filters, setFilters] = useState<FilterOptions>({
    type: 'all',
    categoryId: 'all',
    memberId: 'all',
    accountId: 'all',
    startDate: '',
    endDate: '',
    searchKeyword: '',
  });

  // Persist state updates to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TXS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CATS, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MEMS, JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ACCS, JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_BUDGETS, JSON.stringify(budgets));
  }, [budgets]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // --- Transactions Operations ---
  const addTransaction = (newTx: Omit<Transaction, 'id' | 'createdAt'>) => {
    const tx: Transaction = {
      ...newTx,
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      createdAt: Date.now(),
    };

    setTransactions((prev) => [tx, ...prev]);

    // Update account balances
    if (tx.type === 'expense') {
      setAccounts((prev) =>
        prev.map((acc) => (acc.id === tx.accountId ? { ...acc, balance: acc.balance - tx.amount } : acc))
      );
    } else if (tx.type === 'income') {
      setAccounts((prev) =>
        prev.map((acc) => (acc.id === tx.accountId ? { ...acc, balance: acc.balance + tx.amount } : acc))
      );
    } else if (tx.type === 'transfer' && tx.toAccountId) {
      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id === tx.accountId) return { ...acc, balance: acc.balance - tx.amount };
          if (acc.id === tx.toAccountId) return { ...acc, balance: acc.balance + tx.amount };
          return acc;
        })
      );
    }

    showToast('记账已保存');
    return tx;
  };

  const updateTransaction = (id: string, updated: Partial<Transaction>) => {
    const oldTx = transactions.find((t) => t.id === id);
    if (!oldTx) return;

    // Rollback old account impact
    let tempAccounts = [...accounts];
    if (oldTx.type === 'expense') {
      tempAccounts = tempAccounts.map((a) => (a.id === oldTx.accountId ? { ...a, balance: a.balance + oldTx.amount } : a));
    } else if (oldTx.type === 'income') {
      tempAccounts = tempAccounts.map((a) => (a.id === oldTx.accountId ? { ...a, balance: a.balance - oldTx.amount } : a));
    } else if (oldTx.type === 'transfer' && oldTx.toAccountId) {
      tempAccounts = tempAccounts.map((a) => {
        if (a.id === oldTx.accountId) return { ...a, balance: a.balance + oldTx.amount };
        if (a.id === oldTx.toAccountId) return { ...a, balance: a.balance - oldTx.amount };
        return a;
      });
    }

    const mergedTx: Transaction = { ...oldTx, ...updated };

    // Apply new account impact
    if (mergedTx.type === 'expense') {
      tempAccounts = tempAccounts.map((a) => (a.id === mergedTx.accountId ? { ...a, balance: a.balance - mergedTx.amount } : a));
    } else if (mergedTx.type === 'income') {
      tempAccounts = tempAccounts.map((a) => (a.id === mergedTx.accountId ? { ...a, balance: a.balance + mergedTx.amount } : a));
    } else if (mergedTx.type === 'transfer' && mergedTx.toAccountId) {
      tempAccounts = tempAccounts.map((a) => {
        if (a.id === mergedTx.accountId) return { ...a, balance: a.balance - mergedTx.amount };
        if (a.id === mergedTx.toAccountId) return { ...a, balance: a.balance + mergedTx.amount };
        return a;
      });
    }

    setAccounts(tempAccounts);
    setTransactions((prev) => prev.map((t) => (t.id === id ? mergedTx : t)));
    showToast('账目修改已保存');
  };

  const deleteTransaction = (id: string) => {
    const txToDelete = transactions.find((t) => t.id === id);
    if (!txToDelete) return;

    setLastDeletedTx(txToDelete);

    // Rollback account balances
    if (txToDelete.type === 'expense') {
      setAccounts((prev) =>
        prev.map((acc) => (acc.id === txToDelete.accountId ? { ...acc, balance: acc.balance + txToDelete.amount } : acc))
      );
    } else if (txToDelete.type === 'income') {
      setAccounts((prev) =>
        prev.map((acc) => (acc.id === txToDelete.accountId ? { ...acc, balance: acc.balance - txToDelete.amount } : acc))
      );
    } else if (txToDelete.type === 'transfer' && txToDelete.toAccountId) {
      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id === txToDelete.accountId) return { ...acc, balance: acc.balance + txToDelete.amount };
          if (acc.id === txToDelete.toAccountId) return { ...acc, balance: acc.balance - txToDelete.amount };
          return acc;
        })
      );
    }

    setTransactions((prev) => prev.filter((t) => t.id !== id));
    showToast('账目已删除');
  };

  const batchDeleteTransactions = (ids: string[]) => {
    if (!ids.length) return;
    const idSet = new Set(ids);
    setTransactions((prev) => prev.filter((t) => !idSet.has(t.id)));
    showToast(`已批量删除 ${ids.length} 条记录`);
  };

  const undoDelete = () => {
    if (!lastDeletedTx) return;
    setTransactions((prev) => [lastDeletedTx, ...prev]);

    // Restore account balances
    if (lastDeletedTx.type === 'expense') {
      setAccounts((prev) =>
        prev.map((acc) => (acc.id === lastDeletedTx.accountId ? { ...acc, balance: acc.balance - lastDeletedTx.amount } : acc))
      );
    } else if (lastDeletedTx.type === 'income') {
      setAccounts((prev) =>
        prev.map((acc) => (acc.id === lastDeletedTx.accountId ? { ...acc, balance: acc.balance + lastDeletedTx.amount } : acc))
      );
    }
    setLastDeletedTx(null);
    showToast('已撤销删除');
  };

  // --- Category Management ---
  const addCategory = (category: Omit<Category, 'id'>) => {
    const newCat: Category = {
      ...category,
      id: 'cat_custom_' + Date.now(),
    };
    setCategories((prev) => [...prev, newCat]);
    showToast(`分类 "${newCat.name}" 创建成功`);
    return newCat;
  };

  const updateCategory = (id: string, updated: Partial<Category>) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
    showToast('分类已更新');
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    showToast('分类已删除');
  };

  // --- Member Management ---
  const addMember = (member: Omit<FamilyMember, 'id'>) => {
    const newMem: FamilyMember = {
      ...member,
      id: 'mem_custom_' + Date.now(),
    };
    setMembers((prev) => [...prev, newMem]);
    showToast(`成员 "${newMem.name}" 添加成功`);
    return newMem;
  };

  const updateMember = (id: string, updated: Partial<FamilyMember>) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...updated } : m)));
    showToast('成员信息已更新');
  };

  const deleteMember = (id: string) => {
    if (members.length <= 1) {
      showToast('至少保留一名家庭成员');
      return;
    }
    setMembers((prev) => prev.filter((m) => m.id !== id));
    showToast('成员已删除');
  };

  // --- Account Management ---
  const addAccount = (account: Omit<Account, 'id'>) => {
    const newAcc: Account = {
      ...account,
      id: 'acc_custom_' + Date.now(),
    };
    setAccounts((prev) => [...prev, newAcc]);
    showToast(`账户 "${newAcc.name}" 添加成功`);
    return newAcc;
  };

  const updateAccount = (id: string, updated: Partial<Account>) => {
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, ...updated } : a)));
    showToast('账户信息已更新');
  };

  const deleteAccount = (id: string) => {
    if (accounts.length <= 1) {
      showToast('至少保留一个支付账户');
      return;
    }
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    showToast('账户已删除');
  };

  // --- Budget Management ---
  const currentMonthBudget = useMemo(() => {
    const found = budgets.find((b) => b.yearMonth === selectedMonth);
    if (found) return found;
    // Return latest or default
    return {
      yearMonth: selectedMonth,
      totalBudget: 15000,
      categoryBudgets: DEFAULT_BUDGET.categoryBudgets,
    };
  }, [budgets, selectedMonth]);

  const updateCurrentBudget = (updated: Partial<MonthlyBudget>) => {
    setBudgets((prev) => {
      const idx = prev.findIndex((b) => b.yearMonth === selectedMonth);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...updated };
        return next;
      } else {
        return [...prev, { ...currentMonthBudget, ...updated, yearMonth: selectedMonth }];
      }
    });
    showToast('预算设置已更新');
  };

  // --- Reset & Import/Export ---
  const resetToSampleData = () => {
    setTransactions(INITIAL_TRANSACTIONS);
    setCategories(DEFAULT_CATEGORIES);
    setMembers(DEFAULT_MEMBERS);
    setAccounts(DEFAULT_ACCOUNTS);
    setBudgets([DEFAULT_BUDGET]);
    showToast('已重置为标准示例数据');
  };

  const importAllData = (data: {
    transactions?: Transaction[];
    categories?: Category[];
    members?: FamilyMember[];
    accounts?: Account[];
    budgets?: MonthlyBudget[];
  }) => {
    if (data.transactions) setTransactions(data.transactions);
    if (data.categories) setCategories(data.categories);
    if (data.members) setMembers(data.members);
    if (data.accounts) setAccounts(data.accounts);
    if (data.budgets) setBudgets(data.budgets);
    showToast('数据恢复成功！');
  };

  // --- Filtered and Monthly Computed Data ---
  const currentMonthTransactions = useMemo(() => {
    return transactions.filter((t) => t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  const monthlyExpense = useMemo(() => {
    return currentMonthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [currentMonthTransactions]);

  const monthlyIncome = useMemo(() => {
    return currentMonthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [currentMonthTransactions]);

  const monthlyBalance = monthlyIncome - monthlyExpense;

  // Days in month calculation for daily average
  const dailyAverageExpense = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const now = new Date();
    const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;
    const daysPassed = isCurrentMonth ? Math.max(1, now.getDate()) : new Date(year, month, 0).getDate();
    return daysPassed > 0 ? monthlyExpense / daysPassed : 0;
  }, [selectedMonth, monthlyExpense]);

  // Net Asset calculation
  const totalAssets = useMemo(() => {
    return accounts.reduce((sum, acc) => (acc.type !== 'credit' ? sum + acc.balance : sum), 0);
  }, [accounts]);

  const totalLiabilities = useMemo(() => {
    return accounts.reduce((sum, acc) => (acc.type === 'credit' && acc.balance < 0 ? sum + Math.abs(acc.balance) : sum), 0);
  }, [accounts]);

  const netWorth = totalAssets - totalLiabilities;

  // Filtered transactions for list view
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (filters.type !== 'all' && t.type !== filters.type) return false;
      if (filters.categoryId !== 'all' && t.categoryId !== filters.categoryId) return false;
      if (filters.memberId !== 'all' && t.memberId !== filters.memberId) return false;
      if (filters.accountId !== 'all' && t.accountId !== filters.accountId && t.toAccountId !== filters.accountId) return false;
      if (filters.startDate && t.date < filters.startDate) return false;
      if (filters.endDate && t.date > filters.endDate) return false;
      if (filters.minAmount !== undefined && t.amount < filters.minAmount) return false;
      if (filters.maxAmount !== undefined && t.amount > filters.maxAmount) return false;
      if (filters.searchKeyword) {
        const kw = filters.searchKeyword.toLowerCase();
        const noteMatch = (t.note || '').toLowerCase().includes(kw);
        const subMatch = (t.subCategory || '').toLowerCase().includes(kw);
        const tagMatch = (t.tags || []).some((tag) => tag.toLowerCase().includes(kw));
        if (!noteMatch && !subMatch && !tagMatch) return false;
      }
      return true;
    });
  }, [transactions, filters]);

  // Lookup maps for fast lookup
  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const accountMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);

  return {
    selectedMonth,
    setSelectedMonth,
    transactions,
    currentMonthTransactions,
    filteredTransactions,
    categories,
    members,
    accounts,
    budgets,
    currentMonthBudget,
    filters,
    setFilters,
    toastMessage,
    lastDeletedTx,
    categoryMap,
    memberMap,
    accountMap,
    // Metrics
    monthlyExpense,
    monthlyIncome,
    monthlyBalance,
    dailyAverageExpense,
    totalAssets,
    totalLiabilities,
    netWorth,
    // Actions
    addTransaction,
    updateTransaction,
    deleteTransaction,
    batchDeleteTransactions,
    undoDelete,
    addCategory,
    updateCategory,
    deleteCategory,
    addMember,
    updateMember,
    deleteMember,
    addAccount,
    updateAccount,
    deleteAccount,
    updateCurrentBudget,
    resetToSampleData,
    importAllData,
    showToast,
  };
}
