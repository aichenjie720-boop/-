import React, { useState, useMemo } from 'react';
import {
  Target,
  Edit3,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Percent,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import { MonthlyBudget, Category, Transaction } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { formatCurrency } from '../utils/formatters';

interface BudgetTabProps {
  selectedMonth: string;
  budget: MonthlyBudget;
  categories: Category[];
  transactions: Transaction[];
  onUpdateBudget: (updated: Partial<MonthlyBudget>) => void;
}

export const BudgetTab: React.FC<BudgetTabProps> = ({
  selectedMonth,
  budget,
  categories,
  transactions,
  onUpdateBudget,
}) => {
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempTotalBudget, setTempTotalBudget] = useState<number>(budget.totalBudget || 15000);
  const [tempCatBudgets, setTempCatBudgets] = useState<{ [catId: string]: number }>(() => {
    const map: { [id: string]: number } = {};
    (budget.categoryBudgets || []).forEach((cb) => {
      map[cb.categoryId] = cb.amount;
    });
    return map;
  });

  const expenseCategories = useMemo(() => {
    return categories.filter((c) => c.type === 'expense');
  }, [categories]);

  // Actual spending in current month
  const categorySpentMap = useMemo(() => {
    const map = new Map<string, number>();
    transactions
      .filter((t) => t.date.startsWith(selectedMonth) && t.type === 'expense')
      .forEach((t) => {
        map.set(t.categoryId, (map.get(t.categoryId) || 0) + t.amount);
      });
    return map;
  }, [transactions, selectedMonth]);

  const totalSpent = useMemo(() => {
    return Array.from(categorySpentMap.values()).reduce((sum: number, v: number) => sum + v, 0);
  }, [categorySpentMap]);

  const totalBudget = budget.totalBudget || 15000;
  const totalSpentPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const totalRemaining = totalBudget - totalSpent;
  const isOverTotal = totalSpent > totalBudget;

  const handleSaveBudget = () => {
    const catBudgetsList = Object.entries(tempCatBudgets)
      .filter(([_, amt]) => Number(amt) > 0)
      .map(([categoryId, amount]) => ({ categoryId, amount: Number(amount) }));

    onUpdateBudget({
      totalBudget: tempTotalBudget,
      categoryBudgets: catBudgetsList,
    });
    setIsEditingBudget(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Total Budget Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Target size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {selectedMonth} 月度家庭总预算
              </h3>
              <p className="text-xs text-slate-400">实时监控家庭总开销，避免月末超支</p>
            </div>
          </div>

          <button
            onClick={() => {
              setTempTotalBudget(totalBudget);
              const map: { [id: string]: number } = {};
              (budget.categoryBudgets || []).forEach((cb) => {
                map[cb.categoryId] = cb.amount;
              });
              setTempCatBudgets(map);
              setIsEditingBudget(true);
            }}
            className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold hover:bg-indigo-100 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Edit3 size={14} /> 调整与设置预算
          </button>
        </div>

        {/* Progress Display */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between text-xs sm:text-sm font-mono">
            <span className="text-slate-500">
              已支出: <strong className="text-slate-900 text-base">{formatCurrency(totalSpent)}</strong>
            </span>
            <span className="text-slate-500">
              总预算限额: <strong className="text-indigo-600 text-base">{formatCurrency(totalBudget)}</strong>
            </span>
          </div>

          <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isOverTotal
                  ? 'bg-rose-500'
                  : totalSpentPercent > 80
                  ? 'bg-amber-500'
                  : 'bg-indigo-600'
              }`}
              style={{ width: `${Math.min(100, totalSpentPercent)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <div className="flex items-center gap-1.5">
              {isOverTotal ? (
                <span className="text-rose-600 font-bold flex items-center gap-1">
                  <AlertTriangle size={14} /> 已超额支出 {formatCurrency(Math.abs(totalRemaining))}
                </span>
              ) : (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 size={14} /> 剩余预算额度 {formatCurrency(totalRemaining)}
                </span>
              )}
            </div>
            <span className="font-mono text-slate-400">已使用 {totalSpentPercent.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Category Budgets Grid */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">各分类子预算明细</h3>
            <p className="text-xs text-slate-400">针对餐饮、日用、交通等分别设立专项额度</p>
          </div>
          <span className="text-xs text-slate-400">共 {expenseCategories.length} 个支出分类</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {expenseCategories.map((cat) => {
            const catBudgetObj = (budget.categoryBudgets || []).find((b) => b.categoryId === cat.id);
            const catBudgetAmt = catBudgetObj?.amount || 0;
            const spent = categorySpentMap.get(cat.id) || 0;
            const percent = catBudgetAmt > 0 ? (spent / catBudgetAmt) * 100 : 0;
            const isOver = catBudgetAmt > 0 && spent > catBudgetAmt;

            return (
              <div
                key={cat.id}
                className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/60 space-y-3 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-xs"
                      style={{ backgroundColor: cat.color }}
                    >
                      <CategoryIcon name={cat.icon} size={16} />
                    </div>
                    <span className="font-bold text-slate-800 text-sm">{cat.name}</span>
                  </div>

                  <div className="text-right font-mono text-xs">
                    {catBudgetAmt > 0 ? (
                      <span
                        className={`font-bold px-2 py-0.5 rounded ${
                          isOver
                            ? 'bg-rose-100 text-rose-700'
                            : percent > 85
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {percent.toFixed(0)}%
                      </span>
                    ) : (
                      <span className="text-slate-400">未设独立预算</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-slate-600">
                  <span>已支出: ¥{spent.toFixed(2)}</span>
                  <span>{catBudgetAmt > 0 ? `限额: ¥${catBudgetAmt}` : '随总预算'}</span>
                </div>

                {/* Progress bar */}
                {catBudgetAmt > 0 ? (
                  <div className="space-y-1">
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isOver ? 'bg-rose-500' : percent > 85 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, percent)}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-right">
                      {isOver ? (
                        <span className="text-rose-600 font-medium">
                          超支 ¥{(spent - catBudgetAmt).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono">
                          剩余 ¥{(catBudgetAmt - spent).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="w-full bg-slate-200/50 h-1.5 rounded-full" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Budget Modal */}
      {isEditingBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">设置 {selectedMonth} 预算方案</h3>
              <button
                onClick={() => setIsEditingBudget(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                关闭
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Total Monthly Budget */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  月度家庭总预算 (元)
                </label>
                <input
                  type="number"
                  value={tempTotalBudget}
                  onChange={(e) => setTempTotalBudget(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-base font-bold font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Individual Category Sub-budgets */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-xs font-semibold text-slate-700 block">
                  各分类预算额度（选填，设为 0 表示不单独限制）
                </label>
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {expenseCategories.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center text-white"
                          style={{ backgroundColor: cat.color }}
                        >
                          <CategoryIcon name={cat.icon} size={14} />
                        </div>
                        <span className="font-medium text-slate-700">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400">¥</span>
                        <input
                          type="number"
                          value={tempCatBudgets[cat.id] || ''}
                          onChange={(e) =>
                            setTempCatBudgets((prev) => ({
                              ...prev,
                              [cat.id]: Number(e.target.value),
                            }))
                          }
                          placeholder="0"
                          className="w-28 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono text-right text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsEditingBudget(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-200/60"
              >
                取消
              </button>
              <button
                onClick={handleSaveBudget}
                className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 shadow-xs"
              >
                保存预算设置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
