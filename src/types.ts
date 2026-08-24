export type TransactionType = 'expense' | 'income' | 'transfer';

export interface Category {
  id: string;
  name: string;
  type: 'expense' | 'income';
  icon: string;
  color: string;
  subcategories: string[];
}

export interface FamilyMember {
  id: string;
  name: string;
  avatarColor: string;
  relation: string; // 'father' | 'mother' | 'grandparent' | 'child' | 'shared' | 'other'
}

export interface Account {
  id: string;
  name: string;
  type: 'cash' | 'wechat' | 'alipay' | 'bank' | 'credit' | 'other';
  balance: number;
  icon: string;
  color: string;
  cardLast4?: string;
  creditLimit?: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  subCategory?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  memberId: string;
  accountId: string;
  toAccountId?: string; // for transfer
  note: string;
  tags?: string[];
  receiptUrl?: string;
  createdAt: number;
}

export interface CategoryBudget {
  categoryId: string;
  amount: number;
}

export interface MonthlyBudget {
  yearMonth: string; // YYYY-MM
  totalBudget: number;
  categoryBudgets: CategoryBudget[];
}

export interface FilterOptions {
  type: 'all' | 'expense' | 'income' | 'transfer';
  categoryId: string;
  memberId: string;
  accountId: string;
  startDate: string;
  endDate: string;
  searchKeyword: string;
  minAmount?: number;
  maxAmount?: number;
  tag?: string;
}

export type ActiveTab = 'overview' | 'transactions' | 'statistics' | 'calendar' | 'budget' | 'accounts';
