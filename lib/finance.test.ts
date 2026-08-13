import { describe, it, expect } from "vitest";
import { analyse, affordability, monthlyGoalContribution, money } from "./finance";

describe("finance engine", () => {
  it("calculates totals for normal case", () => {
    const a = analyse(
      500000,
      [
        { name: "Food", amount: 100000, essential: true },
        { name: "Debt Repayment", amount: 50000, essential: true },
      ],
      50000
    );
    expect(a.totalExpenses).toBe(150000);
    expect(a.remaining).toBe(350000);
    expect(a.score).toBeGreaterThan(0);
    expect(a.emergencyTarget).toBe(450000);
  });

  it("handles zero income", () => {
    const a = analyse(0, [{ name: "Food", amount: 100, essential: true }], 0);
    expect(a.expenseRate).toBe(0);
    expect(a.savingsRate).toBe(0);
    expect(a.score).toBe(0);
    expect(a.alerts.some((x) => /income/i.test(x))).toBe(true);
  });

  it("handles expenses exceeding income", () => {
    const a = analyse(1000, [{ name: "Rent", amount: 2000, essential: true }], 0);
    expect(a.remaining).toBe(-1000);
    expect(a.alerts.some((x) => /exceed/i.test(x))).toBe(true);
  });

  it("clamps negative expense amounts", () => {
    const a = analyse(1000, [{ name: "X", amount: -50, essential: true }], 0);
    expect(a.totalExpenses).toBe(0);
  });

  it("handles NaN / Infinity safely", () => {
    const a = analyse(Number.NaN, [{ name: "X", amount: Number.POSITIVE_INFINITY, essential: true }], Number.NaN);
    expect(a.totalExpenses).toBe(0);
    expect(a.score).toBe(0);
  });

  it("flags expensive purchase", () => {
    const r = affordability(
      500000,
      [{ name: "Housing / Rent", amount: 300000, essential: true }],
      1000000,
      0
    );
    expect(r.status).toMatch(/Not recommended|Consider waiting/);
  });

  it("monthly goal contribution avoids divide by zero", () => {
    expect(monthlyGoalContribution(1200, 0, 0)).toBe(1200);
    expect(monthlyGoalContribution(1200, 200, 10)).toBe(100);
    expect(monthlyGoalContribution(100, 100, 5)).toBe(0);
  });

  it("money formats non-negative", () => {
    expect(money(-5, "₦")).toMatch(/0/);
  });
});
