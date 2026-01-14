export interface LineItem {
  id: string;
  name: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
}

export interface MonthData {
  id: string;
  month: string; // e.g., "January 2024"
  year: number;
  monthIndex: number; // 0-11
  lineItems: LineItem[];
  lineItemOrder: string[]; // IDs in display order
}

export interface Investment {
  id: string;
  asset: string;
  symbol: string;
  coingeckoId: string;
  entryPrice: number;
  currentPrice: number;
  quantity: number; // Actual position size in the asset (e.g., 250 LTC)
  investedAmount: number; // Actual cash invested (e.g., $7,700 CAD)
  leverage: number;
  stopLoss: number;
  target: number;
  currency: string;
}

export interface CashFlowState {
  months: MonthData[];
  investments: Investment[];
  lastPriceUpdate: string | null;
}

export type CashFlowAction =
  | { type: 'ADD_LINE_ITEM'; monthId: string; item: LineItem }
  | { type: 'UPDATE_LINE_ITEM'; monthId: string; item: LineItem }
  | { type: 'DELETE_LINE_ITEM'; monthId: string; itemId: string }
  | { type: 'REORDER_LINE_ITEMS'; monthId: string; newOrder: string[] }
  | { type: 'ADD_INVESTMENT'; investment: Investment }
  | { type: 'UPDATE_INVESTMENT'; investment: Investment }
  | { type: 'DELETE_INVESTMENT'; investmentId: string }
  | { type: 'UPDATE_PRICES'; prices: Record<string, number>; timestamp: string }
  | { type: 'SET_STATE'; state: CashFlowState };
