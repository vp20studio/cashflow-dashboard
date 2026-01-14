'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCashFlow } from '@/lib/cashflow-context';
import { formatCurrency } from '@/lib/formatters';

export function IncomeExpenseBreakdown() {
  const { state } = useCashFlow();

  const { incomeBySource, expenseByCategory, totalIncome, totalExpenses } = useMemo(() => {
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

    const totalIncome = Object.values(incomeBySource).reduce((sum, val) => sum + val, 0);
    const totalExpenses = Object.values(expenseByCategory).reduce((sum, val) => sum + val, 0);

    return {
      incomeBySource: Object.entries(incomeBySource).sort((a, b) => b[1] - a[1]),
      expenseByCategory: Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1]),
      totalIncome,
      totalExpenses,
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
            <>
              <div className="space-y-2">
                {incomeBySource.map(([name, amount]) => {
                  const percent = totalIncome > 0 ? (amount / totalIncome) * 100 : 0;
                  return (
                    <div key={name} className="flex items-center gap-3">
                      <span className="text-foreground flex-1">{name}</span>
                      <span className="text-muted-foreground text-sm w-14 text-right">
                        {percent.toFixed(0)}%
                      </span>
                      <span className="text-green-500 font-medium w-28 text-right">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-border mt-4 pt-4 flex items-center gap-3">
                <span className="text-foreground font-semibold flex-1">Total</span>
                <span className="text-muted-foreground text-sm w-14 text-right">100%</span>
                <span className="text-green-500 font-bold w-28 text-right">
                  {formatCurrency(totalIncome)}
                </span>
              </div>
            </>
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
            <>
              <div className="space-y-2">
                {expenseByCategory.map(([name, amount]) => {
                  const percent = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
                  return (
                    <div key={name} className="flex items-center gap-3">
                      <span className="text-foreground flex-1">{name}</span>
                      <span className="text-muted-foreground text-sm w-14 text-right">
                        {percent.toFixed(0)}%
                      </span>
                      <span className="text-red-500 font-medium w-28 text-right">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-border mt-4 pt-4 flex items-center gap-3">
                <span className="text-foreground font-semibold flex-1">Total</span>
                <span className="text-muted-foreground text-sm w-14 text-right">100%</span>
                <span className="text-red-500 font-bold w-28 text-right">
                  {formatCurrency(totalExpenses)}
                </span>
              </div>
            </>
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
