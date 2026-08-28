import type { Member, Payment } from "@prisma/client";

export type ExpenseWithShares = {
  id: number;
  amount: number;
  paidById: number;
  date: Date;
  shares: { memberId: number; cents: number }[];
};

export type Balance = { member: Member; paid: number; net: number };
export type Settlement = { from: Member; to: Member; amount: number };

export function computeBalances(
  members: Member[],
  expenses: ExpenseWithShares[],
  payments: Payment[] = []
) {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const balances: Balance[] = members.map((member) => {
    const paid = expenses
      .filter((e) => e.paidById === member.id)
      .reduce((sum, e) => sum + e.amount, 0);
    const owedCents = expenses
      .flatMap((e) => e.shares)
      .filter((s) => s.memberId === member.id)
      .reduce((sum, s) => sum + s.cents, 0);
    const owed = owedCents / 100;
    const sent = payments
      .filter((p) => p.fromId === member.id)
      .reduce((sum, p) => sum + p.amount, 0);
    const received = payments
      .filter((p) => p.toId === member.id)
      .reduce((sum, p) => sum + p.amount, 0);
    return { member, paid, net: paid - owed + sent - received };
  });
  return { total, balances };
}

export function computeSettlements(balances: Balance[]): Settlement[] {
  const debtors = balances
    .filter((b) => b.net < -0.005)
    .map((b) => ({ member: b.member, amount: -b.net }))
    .sort((a, b) => b.amount - a.amount);
  const creditors = balances
    .filter((b) => b.net > 0.005)
    .map((b) => ({ member: b.member, amount: b.net }))
    .sort((a, b) => b.amount - a.amount);

  const settlements: Settlement[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amount, creditors[j].amount);
    settlements.push({
      from: debtors[i].member,
      to: creditors[j].member,
      amount: pay,
    });
    debtors[i].amount -= pay;
    creditors[j].amount -= pay;
    if (debtors[i].amount < 0.005) i++;
    if (creditors[j].amount < 0.005) j++;
  }
  return settlements;
}

export function euro(amount: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export type MonthGroup = {
  monthStart: Date;
  label: string;
  expenses: ExpenseWithShares[];
  payments: Payment[];
};

export function groupByMonth(
  expenses: ExpenseWithShares[],
  payments: Payment[],
  monthsBack = 6
): MonthGroup[] {
  const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;

  const keys = new Set<string>();
  for (const e of expenses) keys.add(key(e.date));
  for (const p of payments) keys.add(key(p.createdAt));

  const groups = [...keys]
    .map((k) => {
      const [y, m] = k.split("-").map(Number);
      const start = new Date(y, m, 1);
      return {
        monthStart: start,
        label: start.toLocaleDateString("en-GB", {
          month: "long",
          year: "numeric",
        }),
        expenses: expenses.filter((e) => key(e.date) === k),
        payments: payments.filter((p) => key(p.createdAt) === k),
      };
    })
    .sort((a, b) => +b.monthStart - +a.monthStart)
    .slice(0, monthsBack);

  return groups;
}
