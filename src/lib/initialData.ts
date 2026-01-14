import { CashFlowState, LineItem, MonthData, Investment } from './types';

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// Sample data for demonstration
const sampleLineItems: Omit<LineItem, 'id'>[] = [
  { name: 'Salary', amount: 5500, type: 'income', category: 'Employment' },
  { name: 'Freelance', amount: 1200, type: 'income', category: 'Side Income' },
  { name: 'Dividends', amount: 350, type: 'income', category: 'Investments' },
  { name: 'Rent', amount: 1800, type: 'expense', category: 'Housing' },
  { name: 'Utilities', amount: 250, type: 'expense', category: 'Housing' },
  { name: 'Groceries', amount: 600, type: 'expense', category: 'Food' },
  { name: 'Transportation', amount: 400, type: 'expense', category: 'Transport' },
  { name: 'Insurance', amount: 300, type: 'expense', category: 'Insurance' },
  { name: 'Entertainment', amount: 200, type: 'expense', category: 'Lifestyle' },
  { name: 'Subscriptions', amount: 100, type: 'expense', category: 'Lifestyle' },
];

function createMonth(monthIndex: number, year: number): MonthData {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const lineItems: LineItem[] = sampleLineItems.map(item => ({
    ...item,
    id: generateId(),
    // Add some variation to amounts
    amount: item.amount + Math.floor(Math.random() * 200 - 100),
  }));

  return {
    id: `${year}-${monthIndex}`,
    month: `${monthNames[monthIndex]} ${year}`,
    year,
    monthIndex,
    lineItems,
    lineItemOrder: lineItems.map(item => item.id),
  };
}

// Create sample months for the last 6 months
function generateSampleMonths(): MonthData[] {
  const months: MonthData[] = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(createMonth(date.getMonth(), date.getFullYear()));
  }

  return months;
}

// Initial LTC investment position
const initialInvestments: Investment[] = [
  {
    id: generateId(),
    asset: 'Litecoin',
    symbol: 'LTC',
    coingeckoId: 'litecoin',
    entryPrice: 109,
    currentPrice: 109, // Will be updated on first fetch
    quantity: 7700 / 109, // $7,700 CAD / entry price = quantity
    leverage: 3,
    stopLoss: 73,
    target: 330,
    currency: 'CAD',
  },
];

export const initialState: CashFlowState = {
  months: generateSampleMonths(),
  investments: initialInvestments,
  lastPriceUpdate: null,
};

export { generateId };
