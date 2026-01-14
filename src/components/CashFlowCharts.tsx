'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCashFlow } from '@/lib/cashflow-context';
import { formatCurrency } from '@/lib/formatters';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function CashFlowCharts() {
  const { state } = useCashFlow();

  const chartData = useMemo(() => {
    let cumulative = 0;
    return state.months
      .map(month => {
        const income = month.lineItems
          .filter(item => item.type === 'income')
          .reduce((sum, item) => sum + item.amount, 0);
        const expenses = month.lineItems
          .filter(item => item.type === 'expense')
          .reduce((sum, item) => sum + item.amount, 0);
        const net = income - expenses;
        cumulative += net;

        return {
          name: monthNames[month.monthIndex],
          net,
          cumulative,
          hasData: month.lineItems.length > 0,
        };
      })
      .filter(month => month.hasData);
  }, [state.months]);

  if (chartData.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          No data to display
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Cash Flow Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#a1a1aa"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#a1a1aa"
              fontSize={12}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              tickLine={false}
              axisLine={false}
              width={45}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0a0a0a',
                border: '1px solid #262626',
                borderRadius: '8px',
              }}
              formatter={(value) => formatCurrency(Number(value))}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="net"
              name="Monthly Net"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#netGradient)"
            />
            <Area
              type="monotone"
              dataKey="cumulative"
              name="Cumulative Savings"
              stroke="#22c55e"
              strokeWidth={2}
              fill="url(#cumulativeGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
