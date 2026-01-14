import { CashFlowState, LineItem, MonthData, Investment } from './types';

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// Your actual data
const monthsData: MonthData[] = [
  {
    id: '2026-0',
    month: 'January 2026',
    year: 2026,
    monthIndex: 0,
    lineItems: [
      { id: 'jan-in-1', name: 'Litmus', amount: 7500, type: 'income', category: 'Business' },
      { id: 'jan-in-2', name: 'EFFYDESK', amount: 6000, type: 'income', category: 'Business' },
      { id: 'jan-in-3', name: 'Mom', amount: 5000, type: 'income', category: 'Personal' },
      { id: 'jan-in-4', name: 'Treantly', amount: 2000, type: 'income', category: 'Business' },
      { id: 'jan-in-5', name: 'Peter', amount: 700, type: 'income', category: 'Personal' },
      { id: 'jan-out-1', name: 'Rent', amount: 2000, type: 'expense', category: 'Housing' },
      { id: 'jan-out-2', name: 'Living', amount: 2000, type: 'expense', category: 'Living' },
      { id: 'jan-out-3', name: 'Arvin', amount: 2000, type: 'expense', category: 'Personal' },
      { id: 'jan-out-4', name: 'Cleanlist', amount: 1500, type: 'expense', category: 'Business' },
      { id: 'jan-out-5', name: 'Government', amount: 1000, type: 'expense', category: 'Taxes' },
    ],
    lineItemOrder: ['jan-in-1', 'jan-in-2', 'jan-in-3', 'jan-in-4', 'jan-in-5', 'jan-out-1', 'jan-out-2', 'jan-out-3', 'jan-out-4', 'jan-out-5'],
  },
  {
    id: '2026-1',
    month: 'February 2026',
    year: 2026,
    monthIndex: 1,
    lineItems: [
      { id: 'feb-in-1', name: 'Litmus', amount: 5000, type: 'income', category: 'Business' },
      { id: 'feb-in-2', name: 'Government', amount: 4000, type: 'income', category: 'Government' },
      { id: 'feb-in-3', name: 'Treantly', amount: 2000, type: 'income', category: 'Business' },
      { id: 'feb-in-4', name: 'Peter', amount: 700, type: 'income', category: 'Personal' },
      { id: 'feb-out-1', name: 'Dad', amount: 4000, type: 'expense', category: 'Personal' },
      { id: 'feb-out-2', name: 'Rent', amount: 2000, type: 'expense', category: 'Housing' },
      { id: 'feb-out-3', name: 'Living', amount: 2000, type: 'expense', category: 'Living' },
    ],
    lineItemOrder: ['feb-in-1', 'feb-in-2', 'feb-in-3', 'feb-in-4', 'feb-out-1', 'feb-out-2', 'feb-out-3'],
  },
  {
    id: '2026-2',
    month: 'March 2026',
    year: 2026,
    monthIndex: 2,
    lineItems: [
      { id: 'mar-in-1', name: 'Litmus', amount: 5000, type: 'income', category: 'Business' },
      { id: 'mar-in-2', name: 'Treantly', amount: 2000, type: 'income', category: 'Business' },
      { id: 'mar-in-3', name: 'Peter', amount: 700, type: 'income', category: 'Personal' },
      { id: 'mar-out-1', name: 'Rent', amount: 2000, type: 'expense', category: 'Housing' },
      { id: 'mar-out-2', name: 'Living', amount: 2000, type: 'expense', category: 'Living' },
    ],
    lineItemOrder: ['mar-in-1', 'mar-in-2', 'mar-in-3', 'mar-out-1', 'mar-out-2'],
  },
  {
    id: '2026-3',
    month: 'April 2026',
    year: 2026,
    monthIndex: 3,
    lineItems: [
      { id: 'apr-in-1', name: 'EFFYDESK', amount: 6000, type: 'income', category: 'Business' },
      { id: 'apr-in-2', name: 'Litmus', amount: 5000, type: 'income', category: 'Business' },
      { id: 'apr-in-3', name: 'Treantly', amount: 2000, type: 'income', category: 'Business' },
      { id: 'apr-in-4', name: 'Peter', amount: 700, type: 'income', category: 'Personal' },
      { id: 'apr-out-1', name: 'Mom', amount: 5500, type: 'expense', category: 'Personal' },
      { id: 'apr-out-2', name: 'Rent', amount: 2000, type: 'expense', category: 'Housing' },
      { id: 'apr-out-3', name: 'Living', amount: 2000, type: 'expense', category: 'Living' },
    ],
    lineItemOrder: ['apr-in-1', 'apr-in-2', 'apr-in-3', 'apr-in-4', 'apr-out-1', 'apr-out-2', 'apr-out-3'],
  },
  {
    id: '2026-4',
    month: 'May 2026',
    year: 2026,
    monthIndex: 4,
    lineItems: [
      { id: 'may-in-1', name: 'Litmus', amount: 7500, type: 'income', category: 'Business' },
      { id: 'may-in-2', name: 'Treantly', amount: 2000, type: 'income', category: 'Business' },
      { id: 'may-out-1', name: 'Rent', amount: 2000, type: 'expense', category: 'Housing' },
      { id: 'may-out-2', name: 'Living', amount: 2000, type: 'expense', category: 'Living' },
    ],
    lineItemOrder: ['may-in-1', 'may-in-2', 'may-out-1', 'may-out-2'],
  },
  {
    id: '2026-5',
    month: 'June 2026',
    year: 2026,
    monthIndex: 5,
    lineItems: [
      { id: 'jun-in-1', name: 'Litmus', amount: 5000, type: 'income', category: 'Business' },
      { id: 'jun-in-2', name: 'Treantly', amount: 2000, type: 'income', category: 'Business' },
      { id: 'jun-out-1', name: 'Rent', amount: 2000, type: 'expense', category: 'Housing' },
      { id: 'jun-out-2', name: 'Living', amount: 2000, type: 'expense', category: 'Living' },
    ],
    lineItemOrder: ['jun-in-1', 'jun-in-2', 'jun-out-1', 'jun-out-2'],
  },
  {
    id: '2026-6',
    month: 'July 2026',
    year: 2026,
    monthIndex: 6,
    lineItems: [],
    lineItemOrder: [],
  },
  {
    id: '2026-7',
    month: 'August 2026',
    year: 2026,
    monthIndex: 7,
    lineItems: [],
    lineItemOrder: [],
  },
  {
    id: '2026-8',
    month: 'September 2026',
    year: 2026,
    monthIndex: 8,
    lineItems: [],
    lineItemOrder: [],
  },
  {
    id: '2026-9',
    month: 'October 2026',
    year: 2026,
    monthIndex: 9,
    lineItems: [],
    lineItemOrder: [],
  },
  {
    id: '2026-10',
    month: 'November 2026',
    year: 2026,
    monthIndex: 10,
    lineItems: [],
    lineItemOrder: [],
  },
  {
    id: '2026-11',
    month: 'December 2026',
    year: 2026,
    monthIndex: 11,
    lineItems: [],
    lineItemOrder: [],
  },
];

// LTC investment position: $7,700 CAD at 3x leverage @ $109
const initialInvestments: Investment[] = [
  {
    id: generateId(),
    asset: 'Litecoin',
    symbol: 'LTC',
    coingeckoId: 'litecoin',
    entryPrice: 109,
    currentPrice: 109,
    quantity: 7700 / 109, // ~70.64 LTC
    leverage: 3,
    stopLoss: 73,
    target: 330,
    currency: 'CAD',
  },
];

export const initialState: CashFlowState = {
  months: monthsData,
  investments: initialInvestments,
  lastPriceUpdate: null,
};

export { generateId };
