import { Transaction, Category, FamilyMember, Account } from '../types';

export function formatCurrency(amount: number, showSign: boolean = false): string {
  const isNegative = amount < 0;
  const absValue = Math.abs(amount);
  const formatted = new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absValue);

  if (showSign) {
    if (amount > 0) return `+¥${formatted}`;
    if (amount < 0) return `-¥${formatted}`;
  }
  return isNegative ? `-¥${formatted}` : `¥${formatted}`;
}

export function formatCompactCurrency(amount: number): string {
  if (Math.abs(amount) >= 10000) {
    return `¥${(amount / 10000).toFixed(1)}万`;
  }
  return `¥${amount.toFixed(0)}`;
}

export function formatDateChinese(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = weekdays[date.getDay()];
  return `${month}月${day}日 ${weekday}`;
}

export function getFullDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${weekdays[date.getDay()]}`;
}

export function getCurrentDateStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentTimeStr(): string {
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function getCurrentYearMonth(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Safely evaluates simple arithmetic expression entered in keypad (e.g. 45 + 18.5 * 2)
 */
export function evaluateKeypadExpression(expr: string): number | null {
  if (!expr || expr.trim() === '') return null;
  // Clean characters - allow only digits, decimal point, and + - * / ( )
  const cleaned = expr.replace(/[^\d.+\-*/()]/g, '');
  if (!cleaned) return null;

  try {
    // Check for syntax issues before evaluating
    if (/[+\-*/]$/.test(cleaned)) {
      // trailing operator, evaluate up to the last operator
      const sub = cleaned.replace(/[+\-*/]+$/, '');
      if (!sub) return null;
      // eslint-disable-next-line no-new-func
      const result = Function(`'use strict'; return (${sub})`)();
      return typeof result === 'number' && !isNaN(result) && isFinite(result) ? result : null;
    }
    // eslint-disable-next-line no-new-func
    const result = Function(`'use strict'; return (${cleaned})`)();
    return typeof result === 'number' && !isNaN(result) && isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

/**
 * Export transactions to CSV file content
 */
export function generateCsvData(
  transactions: Transaction[],
  categories: Category[],
  members: FamilyMember[],
  accounts: Account[]
): string {
  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const memMap = new Map(members.map((m) => [m.id, m.name]));
  const accMap = new Map(accounts.map((a) => [a.id, a.name]));

  const headers = ['记账ID', '交易类型', '日期', '时间', '金额(元)', '主分类', '二级明细', '归属成员', '支付账户', '转入账户', '备注', '标签'];

  const rows = transactions.map((t) => {
    const typeLabel = t.type === 'expense' ? '支出' : t.type === 'income' ? '收入' : '内部转账';
    const catName = catMap.get(t.categoryId) || '其它';
    const memName = memMap.get(t.memberId) || '未分配';
    const accName = accMap.get(t.accountId) || '未指定账户';
    const toAccName = t.toAccountId ? accMap.get(t.toAccountId) || '' : '';
    const tagsStr = (t.tags || []).join(';');
    const noteClean = (t.note || '').replace(/"/g, '""');

    return [
      `"${t.id}"`,
      `"${typeLabel}"`,
      `"${t.date}"`,
      `"${t.time || ''}"`,
      t.amount.toFixed(2),
      `"${catName}"`,
      `"${t.subCategory || ''}"`,
      `"${memName}"`,
      `"${accName}"`,
      `"${toAccName}"`,
      `"${noteClean}"`,
      `"${tagsStr}"`,
    ].join(',');
  });

  // Add UTF-8 BOM for Excel Chinese compatibility
  return '\uFEFF' + [headers.join(','), ...rows].join('\n');
}

/**
 * Download file in browser
 */
export function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type: `${type};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
