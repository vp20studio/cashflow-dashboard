'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCashFlow } from '@/lib/cashflow-context';
import { formatCurrency } from '@/lib/formatters';

export function IncomeExpenseBreakdown() {
  const { state } = useCashFlow();

  const { incomeBySource, expenseByCategory } = useMemo(() => {
    const incomeBySource: Record<string, number> = {};
    const expenseByCategory: Record<string, number> = {};

    state.months.forEach(month => {
      month.lineItems.forEach(item => {
        if (item.type === 'income') {
          incomeBySource[item.name] = (incomeBySource[item.name] || 0) + item.amount;
        } else {
          expenseByCategory[item.name] = (expenseByCategory[item.name] || 0) + item.amount;
        }
      });
    });

    return {
      incomeBySource: Object.entries(incomeBySource)
        .sort((a, b) => b[1] - a[1]),
      expenseByCategory: Object.entries(expenseByCategory)
        .sort((a, b) => b[1] - a[1]),
    };
  }, [state.months]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-green-500">Income Sources</CardTitle>
        </CardHeader>
        <CardContent>
          {incomeBySource.length > 0 ? (
            <div className="space-y-3">
              {incomeBySource.map(([name, amount]) => (
                <div key={name} className="flex justify-between items-center">
                  <span className="text-foreground">{name}</span>
                  <span className="text-green-500 font-medium">{formatCurrency(amount)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No income data
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-red-500">Expense Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {expenseByCategory.length > 0 ? (
            <div className="space-y-3">
              {expenseByCategory.map(([name, amount]) => (
                <div key={name} className="flex justify-between items-center">
                  <span className="text-foreground">{name}</span>
                  <span className="text-red-500 font-medium">{formatCurrency(amount)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No expense data
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
