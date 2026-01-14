'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCashFlow } from '@/lib/cashflow-context';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { TrendingUp, TrendingDown, DollarSign, PiggyBank } from 'lucide-react';

export function SummaryCards() {
  const { state } = useCashFlow();

  // Calculate totals across all months
  const totals = state.months.reduce(
    (acc, month) => {
      const monthIncome = month.lineItems
        .filter(item => item.type === 'income')
        .reduce((sum, item) => sum + item.amount, 0);
      const monthExpenses = month.lineItems
        .filter(item => item.type === 'expense')
        .reduce((sum, item) => sum + item.amount, 0);

      return {
        income: acc.income + monthIncome,
        expenses: acc.expenses + monthExpenses,
      };
    },
    { income: 0, expenses: 0 }
  );

  const profit = totals.income - totals.expenses;
  const savingsRate = totals.income > 0 ? ((profit / totals.income) * 100) : 0;

  const cards = [
    {
      title: 'Total Income',
      value: formatCurrency(totals.income),
      icon: TrendingUp,
      color: 'text-green-500',
    },
    {
      title: 'Total Expenses',
      value: formatCurrency(totals.expenses),
      icon: TrendingDown,
      color: 'text-red-500',
    },
    {
      title: 'Profit',
      value: formatCurrency(profit),
      icon: DollarSign,
      color: profit >= 0 ? 'text-green-500' : 'text-red-500',
    },
    {
      title: 'Savings Rate',
      value: formatPercent(savingsRate),
      icon: PiggyBank,
      color: savingsRate >= 20 ? 'text-green-500' : savingsRate >= 10 ? 'text-yellow-500' : 'text-red-500',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
