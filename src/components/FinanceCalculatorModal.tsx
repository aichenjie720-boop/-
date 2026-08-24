import React, { useState, useMemo } from 'react';
import {
  X,
  Calculator,
  Home,
  TrendingUp,
  Users,
  Check,
  Percent,
  Coins,
  ArrowRight,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  calculateMortgage,
  calculateCompoundSavings,
  calculateExpenseSettlement,
  MemberContribution,
} from '../utils/financeCalc';
import { formatCurrency } from '../utils/formatters';

interface FinanceCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type CalcType = 'mortgage' | 'savings' | 'settlement';

export const FinanceCalculatorModal: React.FC<FinanceCalculatorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeCalc, setActiveCalc] = useState<CalcType>('mortgage');

  // Mortgage state
  const [loanPrincipalWan, setLoanPrincipalWan] = useState<number>(100); // 100万
  const [loanRate, setLoanRate] = useState<number>(3.3); // 3.3%
  const [loanYears, setLoanYears] = useState<number>(30); // 30年
  const [repayMethod, setRepayMethod] = useState<'equal_installment' | 'equal_principal'>(
    'equal_installment'
  );

  // Compound Savings state
  const [initialDeposit, setInitialDeposit] = useState<number>(50000);
  const [monthlyDeposit, setMonthlyDeposit] = useState<number>(3000);
  const [savingsRate, setSavingsRate] = useState<number>(3.2);
  const [savingsYears, setSavingsYears] = useState<number>(10);

  // AA Settlement state
  const [settlementMembers, setSettlementMembers] = useState<MemberContribution[]>([
    { id: '1', name: '爸爸', paidAmount: 850, targetShareRatio: 1 },
    { id: '2', name: '妈妈', paidAmount: 420, targetShareRatio: 1 },
    { id: '3', name: '姑姑', paidAmount: 120, targetShareRatio: 1 },
    { id: '4', name: '叔叔', paidAmount: 0, targetShareRatio: 1 },
  ]);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPaid, setNewMemberPaid] = useState<number>(0);

  // Calculations
  const mortgageResult = useMemo(() => {
    return calculateMortgage(loanPrincipalWan * 10000, loanRate, loanYears, repayMethod);
  }, [loanPrincipalWan, loanRate, loanYears, repayMethod]);

  const savingsResult = useMemo(() => {
    return calculateCompoundSavings(initialDeposit, monthlyDeposit, savingsRate, savingsYears);
  }, [initialDeposit, monthlyDeposit, savingsRate, savingsYears]);

  const settlementResult = useMemo(() => {
    return calculateExpenseSettlement(settlementMembers);
  }, [settlementMembers]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calculator size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">家庭财务实用计算工具</h3>
              <p className="text-xs text-slate-400">房贷还款预算 · 储蓄复利积累 · 聚会分摊对账</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Calc Tool Tabs */}
        <div className="px-5 pt-3 pb-2 border-b border-slate-200 bg-slate-50/50 flex gap-2">
          {[
            { id: 'mortgage', label: '房贷月供测算', icon: Home },
            { id: 'savings', label: '定投复利储蓄', icon: TrendingUp },
            { id: 'settlement', label: '家庭分摊AA结算', icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeCalc === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCalc(tab.id as CalcType)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tool Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Tool 1: Mortgage Calculator */}
          {activeCalc === 'mortgage' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">
                    贷款本金 (万元)
                  </label>
                  <input
                    type="number"
                    value={loanPrincipalWan}
                    onChange={(e) => setLoanPrincipalWan(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">
                    年利率 (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={loanRate}
                    onChange={(e) => setLoanRate(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">
                    按揭年限 (年)
                  </label>
                  <select
                    value={loanYears}
                    onChange={(e) => setLoanYears(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  >
                    {[5, 10, 15, 20, 25, 30].map((y) => (
                      <option key={y} value={y}>
                        {y} 年 ({y * 12} 期)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">
                    还款方式
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setRepayMethod('equal_installment')}
                      className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${
                        repayMethod === 'equal_installment'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      等额本息 (每月固定)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRepayMethod('equal_principal')}
                      className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${
                        repayMethod === 'equal_principal'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      等额本金 (逐月递减)
                    </button>
                  </div>
                </div>
              </div>

              {/* Mortgage Result Card */}
              <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-white rounded-xl shadow-2xs border border-slate-200/80">
                    <div className="text-[11px] text-slate-500 font-semibold">
                      {repayMethod === 'equal_installment' ? '每月固定月供' : '首月还款金额'}
                    </div>
                    <div className="text-lg font-bold font-mono text-indigo-600 mt-0.5">
                      {formatCurrency(mortgageResult.monthlyPayment)}
                    </div>
                    {repayMethod === 'equal_principal' && (
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        每月递减约 ¥{mortgageResult.monthlyDecrease?.toFixed(2)}
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-white rounded-xl shadow-2xs border border-slate-200/80">
                    <div className="text-[11px] text-slate-500 font-semibold">还款总额 (本息)</div>
                    <div className="text-lg font-bold font-mono text-slate-800 mt-0.5">
                      {formatCurrency(mortgageResult.totalPayment)}
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-xl shadow-2xs border border-slate-200/80">
                    <div className="text-[11px] text-slate-500 font-semibold">支付利息总额</div>
                    <div className="text-lg font-bold font-mono text-rose-600 mt-0.5">
                      {formatCurrency(mortgageResult.totalInterest)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tool 2: Compound Interest Savings Plan */}
          {activeCalc === 'savings' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">
                    初始启动储蓄金 (元)
                  </label>
                  <input
                    type="number"
                    value={initialDeposit}
                    onChange={(e) => setInitialDeposit(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">
                    每月计划定存追加 (元)
                  </label>
                  <input
                    type="number"
                    value={monthlyDeposit}
                    onChange={(e) => setMonthlyDeposit(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">
                    预期年化收益率 (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={savingsRate}
                    onChange={(e) => setSavingsRate(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">
                    积累规划周期 (年)
                  </label>
                  <select
                    value={savingsYears}
                    onChange={(e) => setSavingsYears(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  >
                    {[1, 3, 5, 10, 15, 20].map((y) => (
                      <option key={y} value={y}>
                        {y} 年
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Savings Results */}
              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-white rounded-xl shadow-2xs border border-emerald-100/80">
                    <div className="text-[11px] text-slate-500 font-semibold">届时预计总资产</div>
                    <div className="text-lg font-bold font-mono text-emerald-600 mt-0.5">
                      {formatCurrency(savingsResult.finalBalance)}
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-xl shadow-2xs border border-emerald-100/80">
                    <div className="text-[11px] text-slate-500 font-semibold">本金累计投入</div>
                    <div className="text-lg font-bold font-mono text-slate-800 mt-0.5">
                      {formatCurrency(savingsResult.totalPrincipal)}
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-xl shadow-2xs border border-emerald-100/80">
                    <div className="text-[11px] text-slate-500 font-semibold">复利增值利息</div>
                    <div className="text-lg font-bold font-mono text-indigo-600 mt-0.5">
                      {formatCurrency(savingsResult.totalInterest)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tool 3: AA Expense Settlement */}
          {activeCalc === 'settlement' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">各成员垫付与转账结算</h4>
                  <p className="text-[11px] text-slate-400">输入每人已付款金额，算法自动生成最简转账路径</p>
                </div>
                <div className="text-xs font-mono text-slate-700 font-bold">
                  总支出: {formatCurrency(settlementResult.totalPaid)} · 人均:{' '}
                  {settlementMembers.length > 0
                    ? formatCurrency(settlementResult.totalPaid / settlementMembers.length)
                    : '¥0'}
                </div>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {settlementMembers.map((m) => (
                  <div key={m.id} className="flex items-center gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <input
                      type="text"
                      value={m.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSettlementMembers((prev) =>
                          prev.map((item) => (item.id === m.id ? { ...item, name: val } : item))
                        );
                      }}
                      className="w-24 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 font-semibold"
                    />
                    <span className="text-slate-500 font-semibold">已垫付: ¥</span>
                    <input
                      type="number"
                      value={m.paidAmount}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setSettlementMembers((prev) =>
                          prev.map((item) => (item.id === m.id ? { ...item, paidAmount: val } : item))
                        );
                      }}
                      className="w-28 bg-white border border-slate-200 rounded-lg px-2.5 py-1 font-mono text-right font-semibold"
                    />
                    <button
                      onClick={() =>
                        setSettlementMembers((prev) => prev.filter((item) => item.id !== m.id))
                      }
                      className="text-slate-400 hover:text-rose-600 p-1 ml-auto"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add member row */}
              <div className="flex gap-2 text-xs">
                <input
                  type="text"
                  placeholder="新成员名称"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800"
                />
                <input
                  type="number"
                  placeholder="垫付金额"
                  value={newMemberPaid || ''}
                  onChange={(e) => setNewMemberPaid(Number(e.target.value))}
                  className="w-28 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 font-mono text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newMemberName.trim()) {
                      setSettlementMembers((prev) => [
                        ...prev,
                        {
                          id: String(Date.now()),
                          name: newMemberName.trim(),
                          paidAmount: newMemberPaid,
                          targetShareRatio: 1,
                        },
                      ]);
                      setNewMemberName('');
                      setNewMemberPaid(0);
                    }
                  }}
                  className="px-3 py-1 bg-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-300"
                >
                  添加参与人
                </button>
              </div>

              {/* Settlement Transfer Recommendations */}
              <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2">
                <h5 className="text-xs font-bold text-indigo-900">推荐转账结算方案：</h5>
                {settlementResult.settlements.length === 0 ? (
                  <p className="text-xs text-slate-500 font-medium">账目平衡，各成员无需转账</p>
                ) : (
                  <div className="space-y-1.5">
                    {settlementResult.settlements.map((s, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-xs bg-white p-2.5 rounded-xl shadow-2xs border border-indigo-50"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{s.from}</span>
                          <span className="text-slate-400">➔ 应转账给</span>
                          <span className="font-bold text-indigo-600">{s.to}</span>
                        </div>
                        <span className="font-bold font-mono text-emerald-600 text-sm">
                          {formatCurrency(s.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
