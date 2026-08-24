/**
 * Household Financial Calculation Utilities
 */

export interface MortgageResult {
  monthlyPayment: number;
  firstMonthPayment?: number;
  lastMonthPayment?: number;
  monthlyDecrease?: number;
  totalInterest: number;
  totalPayment: number;
  monthlyDetails: {
    month: number;
    payment: number;
    principal: number;
    interest: number;
    remainingPrincipal: number;
  }[];
}

/**
 * 房贷计算器 (Mortgage Calculator)
 * @param principal Loan amount in Yuan (e.g. 1,000,000)
 * @param annualRate Annual interest rate as percentage (e.g. 3.5 for 3.5%)
 * @param years Loan duration in years (e.g. 30)
 * @param method 'equal_installment' (等额本息) | 'equal_principal' (等额本金)
 */
export function calculateMortgage(
  principal: number,
  annualRate: number,
  years: number,
  method: 'equal_installment' | 'equal_principal'
): MortgageResult {
  const totalMonths = years * 12;
  const monthlyRate = annualRate / 100 / 12;

  if (principal <= 0 || annualRate <= 0 || years <= 0) {
    return {
      monthlyPayment: 0,
      totalInterest: 0,
      totalPayment: 0,
      monthlyDetails: [],
    };
  }

  if (method === 'equal_installment') {
    // 等额本息: 每月还款额 = [贷款本金 × 月利率 × (1+月利率)^还款月数] ÷ [(1+月利率)^还款月数 - 1]
    const factor = Math.pow(1 + monthlyRate, totalMonths);
    const monthlyPayment = (principal * monthlyRate * factor) / (factor - 1);
    const totalPayment = monthlyPayment * totalMonths;
    const totalInterest = totalPayment - principal;

    let remaining = principal;
    const monthlyDetails = [];

    for (let m = 1; m <= totalMonths; m++) {
      const interestPart = remaining * monthlyRate;
      const principalPart = monthlyPayment - interestPart;
      remaining = Math.max(0, remaining - principalPart);

      monthlyDetails.push({
        month: m,
        payment: monthlyPayment,
        principal: principalPart,
        interest: interestPart,
        remainingPrincipal: remaining,
      });
    }

    return {
      monthlyPayment,
      totalInterest,
      totalPayment,
      monthlyDetails,
    };
  } else {
    // 等额本金: 每月本金 = 贷款本金 ÷ 还款月数; 每月月供 = 每月本金 + 剩余本金 × 月利率
    const monthlyPrincipal = principal / totalMonths;
    let totalInterest = 0;
    let remaining = principal;
    const monthlyDetails = [];

    let firstMonthPayment = 0;
    let lastMonthPayment = 0;

    for (let m = 1; m <= totalMonths; m++) {
      const interestPart = remaining * monthlyRate;
      const payment = monthlyPrincipal + interestPart;
      totalInterest += interestPart;
      remaining = Math.max(0, remaining - monthlyPrincipal);

      if (m === 1) firstMonthPayment = payment;
      if (m === totalMonths) lastMonthPayment = payment;

      monthlyDetails.push({
        month: m,
        payment,
        principal: monthlyPrincipal,
        interest: interestPart,
        remainingPrincipal: remaining,
      });
    }

    const totalPayment = principal + totalInterest;
    const monthlyDecrease = monthlyPrincipal * monthlyRate;

    return {
      monthlyPayment: firstMonthPayment,
      firstMonthPayment,
      lastMonthPayment,
      monthlyDecrease,
      totalInterest,
      totalPayment,
      monthlyDetails,
    };
  }
}

/**
 * 定投与复利储蓄规划 (Compound Interest / Savings Accumulator)
 * @param initialDeposit Initial principal in Yuan
 * @param monthlyDeposit Monthly regular deposit in Yuan
 * @param annualRate Expected annual yield percentage (e.g. 3.0%)
 * @param years Target years (e.g. 10)
 */
export function calculateCompoundSavings(
  initialDeposit: number,
  monthlyDeposit: number,
  annualRate: number,
  years: number
) {
  const months = years * 12;
  const monthlyRate = annualRate / 100 / 12;
  let balance = initialDeposit;
  let totalPrincipal = initialDeposit;

  const yearlyRecords: { year: number; balance: number; principal: number; interest: number }[] = [];

  for (let m = 1; m <= months; m++) {
    balance = balance * (1 + monthlyRate) + monthlyDeposit;
    totalPrincipal += monthlyDeposit;

    if (m % 12 === 0 || m === months) {
      const year = Math.ceil(m / 12);
      yearlyRecords.push({
        year,
        balance,
        principal: totalPrincipal,
        interest: balance - totalPrincipal,
      });
    }
  }

  return {
    finalBalance: balance,
    totalPrincipal,
    totalInterest: balance - totalPrincipal,
    yearlyRecords,
  };
}

/**
 * 家庭开销平摊与结算结算器 (Family / Group Expense Settlement)
 */
export interface MemberContribution {
  id: string;
  name: string;
  paidAmount: number;
  targetShareRatio: number; // e.g., 1 for equal, or custom weight
}

export function calculateExpenseSettlement(members: MemberContribution[]) {
  const totalPaid = members.reduce((sum, m) => sum + m.paidAmount, 0);
  const totalWeight = members.reduce((sum, m) => sum + (m.targetShareRatio || 1), 0);

  if (totalWeight === 0) return { totalPaid, settlements: [], memberDetails: [] };

  const memberDetails = members.map((m) => {
    const shouldPay = (totalPaid * (m.targetShareRatio || 1)) / totalWeight;
    const net = m.paidAmount - shouldPay; // positive = should receive, negative = should pay
    return {
      ...m,
      shouldPay,
      net,
    };
  });

  // Calculate peer-to-peer transfers
  const debtors = memberDetails.filter((m) => m.net < -0.01).map((m) => ({ ...m, owes: -m.net }));
  const creditors = memberDetails.filter((m) => m.net > 0.01).map((m) => ({ ...m, receives: m.net }));

  const settlements: { from: string; to: string; amount: number }[] = [];

  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];
    const amount = Math.min(debtor.owes, creditor.receives);

    if (amount > 0.01) {
      settlements.push({
        from: debtor.name,
        to: creditor.name,
        amount,
      });
    }

    debtor.owes -= amount;
    creditor.receives -= amount;

    if (debtor.owes <= 0.01) dIdx++;
    if (creditor.receives <= 0.01) cIdx++;
  }

  return {
    totalPaid,
    memberDetails,
    settlements,
  };
}
