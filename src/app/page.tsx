'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CashFlowProvider } from '@/lib/cashflow-context';
import { SummaryCards } from '@/components/SummaryCards';
import { CashFlowCharts } from '@/components/CashFlowCharts';
import { CalendarView } from '@/components/CalendarView';
import { IncomeExpenseBreakdown } from '@/components/IncomeExpenseBreakdown';
import { MonthlyTab } from '@/components/MonthlyTab';
import { InvestmentsTab } from '@/components/InvestmentsTab';
import { LayoutDashboard, Calendar, TrendingUp } from 'lucide-react';

function DashboardContent() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Cashflow Dashboard</h1>
        </header>

        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="bg-secondary border border-border">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-background">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="monthly" className="data-[state=active]:bg-background">
              <Calendar className="h-4 w-4 mr-2" />
              Monthly Cashflow
            </TabsTrigger>
            <TabsTrigger value="investments" className="data-[state=active]:bg-background">
              <TrendingUp className="h-4 w-4 mr-2" />
              Investments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <SummaryCards />
            <CashFlowCharts />
            <CalendarView />
            <IncomeExpenseBreakdown />
          </TabsContent>

          <TabsContent value="monthly">
            <MonthlyTab />
          </TabsContent>

          <TabsContent value="investments">
            <InvestmentsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <CashFlowProvider>
      <DashboardContent />
    </CashFlowProvider>
  );
}
