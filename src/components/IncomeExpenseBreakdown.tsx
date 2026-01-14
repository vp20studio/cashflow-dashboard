'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCashFlow } from '@/lib/cashflow-context';
import { formatCurrency } from '@/lib/formatters';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const INCOME_COLORS = ['#22c55e', '#16a34a', '#15803d', '#166534', '#14532d'];
const EXPENSE_COLORS = ['#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d', '#f97316', '#ea580c', '#c2410c'];

export function IncomeExpenseBreakdown() {
  const { state } = useCashFlow();

  const { incomeData, expenseData } = useMemo(() => {
    const incomeByCategory: Record<string, number> = {};
    const expenseByCategory: Record<string, number> = {};

    state.months.forEach(month => {
      month.lineItems.forEach(item => {
        if (item.type === 'income') {
          incomeByCategory[item.category] = (incomeByCategory[item.category] || 0) + item.amount;
        } else {
          expenseByCategory[item.category] = (expenseByCategory[item.category] || 0) + item.amount;
        }
      });
    });

    return {
      incomeData: Object.entries(incomeByCategory)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
      expenseData: Object.entries(expenseByCategory)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
    };
  }, [state.months]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-green-500">Income Sources</CardTitle>
        </CardHeader>
        <CardContent>
          {incomeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={incomeData}
                  cx="50%"
                  cy="45%"
                  outerRadius={70}
                  innerRadius={35}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {incomeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={INCOME_COLORS[index % INCOME_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #262626',
                    borderRadius: '8px',
                    padding: '8px 12px',
                  }}
                  formatter={(value) => formatCurrency(Number(value))}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '10px' }}
                  formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-muted-foreground">
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
          {expenseData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="45%"
                  outerRadius={70}
                  innerRadius={35}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {expenseData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #262626',
                    borderRadius: '8px',
                    padding: '8px 12px',
                  }}
                  formatter={(value) => formatCurrency(Number(value))}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '10px' }}
                  formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-muted-foreground">
              No expense data
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
