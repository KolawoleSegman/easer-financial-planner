/**
 * Easer Financial Planner — calculation engine
 *
 * Monetary values are integers representing the smallest currency unit
 * (e.g. kobo for NGN). Callers must round to integers before persisting.
 *
 * Formulas (planning guidance only — not regulated financial advice):
 * - totalExpenses = Σ max(0, expense.amount)
 * - essentials = Σ max(0, amount) where essential === true
 * - remaining = income - totalExpenses
 * - expenseRate = totalExpenses / income (0 if income === 0)
 * - savingsRate = savings / income (0 if income === 0)
 * - emergencyTarget = essentials * 3
 * - score: heuristic 0–100
 * - recommended (of income): 50% essentials, 15% savings, 5% emergency,
 *   10% investment, 10% lifestyle, 10% buffer
 */

export type Expense = {
  id?: string;
  name: string;
  amount: number;
  essential: boolean;
  month?: string;
};

export type Goal = {
  id?: string;
  name: string;
  target: number;
  saved: number;
  months: number;
};

export const defaultExpenses: Expense[] = [
  { name: "Housing / Rent", amount: 0, essential: true },
  { name: "Food", amount: 0, essential: true },
  { name: "Transport", amount: 0, essential: true },
  { name: "Utilities", amount: 0, essential: true },
  { name: "Data & Airtime", amount: 0, essential: true },
  { name: "Debt Repayment", amount: 0, essential: true },
  { name: "Family Support", amount: 0, essential: false },
  { name: "Education", amount: 0, essential: true },
  { name: "Healthcare", amount: 0, essential: true },
  { name: "Lifestyle", amount: 0, essential: false },
  { name: "Other", amount: 0, essential: false },
];

function safeNum(n: unknown): number {
  if (typeof n !== "number" || !Number.isFinite(n)) return 0;
  return n;
}

function clampNonNeg(n: number): number {
  return Math.max(0, safeNum(n));
}

export function money(value: number, currency = "₦") {
  const v = Math.round(clampNonNeg(value));
  return `${currency}${v.toLocaleString("en-NG")}`;
}

export function analyse(income: number, expenses: Expense[], savings = 0) {
  const safeIncome = clampNonNeg(income);
  const safeSavings = clampNonNeg(savings);

  const totalExpenses = expenses.reduce((s, e) => s + clampNonNeg(e.amount), 0);
  const essentials = expenses
    .filter((e) => e.essential)
    .reduce((s, e) => s + clampNonNeg(e.amount), 0);
  const debt = clampNonNeg(
    expenses.find((e) => e.name === "Debt Repayment")?.amount ?? 0
  );

  const remaining = safeIncome - totalExpenses;
  const expenseRate = safeIncome > 0 ? totalExpenses / safeIncome : 0;
  const savingsRate = safeIncome > 0 ? safeSavings / safeIncome : 0;

  let score = 50;
  if (safeIncome > 0) {
    if (expenseRate <= 0.7) score += 15;
    else if (expenseRate <= 0.85) score += 5;
    else if (expenseRate > 1) score -= 25;
    else score -= 10;

    if (savingsRate >= 0.2) score += 15;
    else if (savingsRate >= 0.1) score += 10;
    else if (savingsRate < 0.05) score -= 10;

    if (debt / safeIncome <= 0.2) score += 10;
    else if (debt / safeIncome > 0.35) score -= 15;

    if (essentials / safeIncome <= 0.5) score += 5;
    else if (essentials / safeIncome > 0.7) score -= 5;
  } else {
    score = 0;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  const recommended = {
    essentials: Math.round(safeIncome * 0.5),
    savings: Math.round(safeIncome * 0.15),
    emergency: Math.round(safeIncome * 0.05),
    investment: Math.round(safeIncome * 0.1),
    lifestyle: Math.round(safeIncome * 0.1),
    buffer: Math.round(safeIncome * 0.1),
  };

  const emergencyTarget = Math.round(essentials * 3);
  const monthlySaveCapacity = Math.max(0, remaining);
  const monthsToEmergency =
    emergencyTarget <= safeSavings
      ? 0
      : monthlySaveCapacity > 0
        ? Math.ceil((emergencyTarget - safeSavings) / monthlySaveCapacity)
        : null;

  const alerts: string[] = [];
  if (safeIncome <= 0) {
    alerts.push("Add your monthly income to generate your plan.");
  }
  if (safeIncome > 0 && expenseRate > 0.9) {
    alerts.push(
      "Your expenses are above 90% of your income. Reduce flexible costs before increasing lifestyle spending."
    );
  }
  if (safeIncome > 0 && debt / safeIncome > 0.3) {
    alerts.push(
      "Debt repayments are above 30% of income. Consider prioritising high-interest debt."
    );
  }
  if (safeIncome > 0 && savingsRate < 0.1 && remaining > 0) {
    alerts.push("Try to build toward saving at least 10% of your income.");
  }
  if (safeIncome > 0 && essentials / safeIncome > 0.6) {
    alerts.push(
      "Essential costs are high. Housing and transport are good places to review."
    );
  }
  if (remaining < 0) {
    alerts.push(
      "Your expenses exceed your income. Focus on cutting discretionary spending or increasing income."
    );
  }
  if (!alerts.length) {
    alerts.push(
      "Your current plan looks balanced. Keep tracking your actual spending each month."
    );
  }

  return {
    totalExpenses,
    essentials,
    debt,
    remaining,
    expenseRate,
    savingsRate,
    score,
    recommended,
    emergencyTarget,
    monthsToEmergency,
    alerts,
  };
}

export function affordability(
  income: number,
  expenses: Expense[],
  price: number,
  savings = 0
) {
  const a = analyse(income, expenses, savings);
  const safeCash = Math.max(0, a.remaining);
  const safePrice = clampNonNeg(price);
  const safeIncome = clampNonNeg(income);
  const ratio = safeIncome > 0 ? safePrice / safeIncome : 1;

  if (safePrice <= 0) return { status: "Enter a valid price.", detail: "" };
  if (safePrice <= safeCash * 0.5) {
    return {
      status: "Looks affordable",
      detail:
        "This purchase is unlikely to disrupt your monthly plan if your other expenses stay on track.",
    };
  }
  if (safePrice <= safeCash) {
    return {
      status: "Affordable with caution",
      detail:
        "You can potentially afford it, but it will use a significant part of your available monthly cash.",
    };
  }
  if (ratio <= 0.1) {
    return {
      status: "Consider waiting",
      detail:
        "The purchase is larger than your current monthly free cash. Saving toward it first would be safer.",
    };
  }
  return {
    status: "Not recommended right now",
    detail:
      "This purchase could put pressure on essentials or savings. Consider reducing the price or creating a savings goal.",
  };
}

export function monthlyGoalContribution(target: number, saved: number, months: number) {
  const need = Math.max(0, clampNonNeg(target) - clampNonNeg(saved));
  const m = Math.max(1, Math.floor(clampNonNeg(months)) || 1);
  return Math.ceil(need / m);
}
