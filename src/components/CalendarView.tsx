'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCashFlow } from '@/lib/cashflow-context';
import { formatCurrency } from '@/lib/formatters';

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function CalendarView() {
  const { state } = useCashFlow();

  const monthlyData = useMemo(() => {
    return state.months.map(month => {
      const income = month.lineItems
        .filter(item => item.type === 'income')
        .reduce((sum, item) => sum + item.amount, 0);
      const expenses = month.lineItems
        .filter(item => item.type === 'expense')
        .reduce((sum, item) => sum + item.amount, 0);
      const net = income - expenses;
      const hasData = month.lineItems.length > 0;

      return {
        month: monthNames[month.monthIndex],
        fullMonth: month.month,
        net,
        income,
        expenses,
        hasData,
      };
    });
  }, [state.months]);

  const maxAbsValue = useMemo(() => {
    const values = monthlyData.filter(m => m.hasData).map(m => Math.abs(m.net));
    return Math.max(...values, 1);
  }, [monthlyData]);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Monthly P/L Calendar</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
          {monthlyData.map((data, index) => {
            const intensity = data.hasData ? Math.min(Math.abs(data.net) / maxAbsValue, 1) : 0;
            const bgOpacity = 0.1 + intensity * 0.4;

            return (
              <div
                key={index}
                className={`
                  relative p-3 rounded-lg border transition-all
                  ${data.hasData
                    ? data.net >= 0
                      ? 'border-green-500/30 hover:border-green-500/60'
                      : 'border-red-500/30 hover:border-red-500/60'
                    : 'border-border opacity-40'
                  }
                `}
                style={{
                  backgroundColor: data.hasData
                    ? data.net >= 0
                      ? `rgba(34, 197, 94, ${bgOpacity})`
                      : `rgba(239, 68, 68, ${bgOpacity})`
                    : 'transparent',
                }}
              >
                <div className="text-center">
                  <p className="text-xs text-muted-foreground font-medium mb-1">
                    {data.month}
                  </p>
                  {data.hasData ? (
                    <p className={`text-sm font-bold ${data.net >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {data.net >= 0 ? '+' : ''}{formatCurrency(data.net).replace('$', '')}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">—</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500/50" />
            <span className="text-xs text-muted-foreground">Profit</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500/50" />
            <span className="text-xs text-muted-foreground">Loss</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded border border-border" />
            <span className="text-xs text-muted-foreground">No data</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
