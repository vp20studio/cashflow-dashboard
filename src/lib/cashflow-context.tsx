'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { CashFlowState, CashFlowAction, LineItem, Investment } from './types';
import { initialState, generateId } from './initialData';
import { fetchPrices } from './coingecko';

const STORAGE_KEY = 'cashflow-dashboard-state';
const PRICE_UPDATE_INTERVAL = 30 * 60 * 1000; // 30 minutes

function cashFlowReducer(state: CashFlowState, action: CashFlowAction): CashFlowState {
  switch (action.type) {
    case 'ADD_LINE_ITEM': {
      return {
        ...state,
        months: state.months.map(month =>
          month.id === action.monthId
            ? {
                ...month,
                lineItems: [...month.lineItems, action.item],
                lineItemOrder: [...month.lineItemOrder, action.item.id],
              }
            : month
        ),
      };
    }

    case 'UPDATE_LINE_ITEM': {
      return {
        ...state,
        months: state.months.map(month =>
          month.id === action.monthId
            ? {
                ...month,
                lineItems: month.lineItems.map(item =>
                  item.id === action.item.id ? action.item : item
                ),
              }
            : month
        ),
      };
    }

    case 'DELETE_LINE_ITEM': {
      return {
        ...state,
        months: state.months.map(month =>
          month.id === action.monthId
            ? {
                ...month,
                lineItems: month.lineItems.filter(item => item.id !== action.itemId),
                lineItemOrder: month.lineItemOrder.filter(id => id !== action.itemId),
              }
            : month
        ),
      };
    }

    case 'REORDER_LINE_ITEMS': {
      return {
        ...state,
        months: state.months.map(month =>
          month.id === action.monthId
            ? { ...month, lineItemOrder: action.newOrder }
            : month
        ),
      };
    }

    case 'ADD_INVESTMENT': {
      return {
        ...state,
        investments: [...state.investments, action.investment],
      };
    }

    case 'UPDATE_INVESTMENT': {
      return {
        ...state,
        investments: state.investments.map(inv =>
          inv.id === action.investment.id ? action.investment : inv
        ),
      };
    }

    case 'DELETE_INVESTMENT': {
      return {
        ...state,
        investments: state.investments.filter(inv => inv.id !== action.investmentId),
      };
    }

    case 'UPDATE_PRICES': {
      return {
        ...state,
        lastPriceUpdate: action.timestamp,
        investments: state.investments.map(inv => ({
          ...inv,
          currentPrice: action.prices[inv.coingeckoId] ?? inv.currentPrice,
        })),
      };
    }

    case 'SET_STATE': {
      return action.state;
    }

    default:
      return state;
  }
}

interface CashFlowContextType {
  state: CashFlowState;
  addLineItem: (monthId: string, item: Omit<LineItem, 'id'>) => void;
  updateLineItem: (monthId: string, item: LineItem) => void;
  deleteLineItem: (monthId: string, itemId: string) => void;
  reorderLineItems: (monthId: string, newOrder: string[]) => void;
  addInvestment: (investment: Omit<Investment, 'id'>) => void;
  updateInvestment: (investment: Investment) => void;
  deleteInvestment: (investmentId: string) => void;
  refreshPrices: () => Promise<void>;
}

const CashFlowContext = createContext<CashFlowContextType | null>(null);

export function CashFlowProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cashFlowReducer, initialState);

  // Load state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        dispatch({ type: 'SET_STATE', state: parsed });
      } catch (e) {
        console.error('Failed to load saved state:', e);
      }
    }
  }, []);

  // Save state to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const refreshPrices = useCallback(async () => {
    const coinIds = [...new Set(state.investments.map(inv => inv.coingeckoId))];
    const prices = await fetchPrices(coinIds);

    if (Object.keys(prices).length > 0) {
      dispatch({
        type: 'UPDATE_PRICES',
        prices,
        timestamp: new Date().toISOString(),
      });
    }
  }, [state.investments]);

  // Fetch prices on mount and every 30 minutes
  useEffect(() => {
    refreshPrices();
    const interval = setInterval(refreshPrices, PRICE_UPDATE_INTERVAL);
    return () => clearInterval(interval);
  }, [refreshPrices]);

  const addLineItem = (monthId: string, item: Omit<LineItem, 'id'>) => {
    dispatch({
      type: 'ADD_LINE_ITEM',
      monthId,
      item: { ...item, id: generateId() },
    });
  };

  const updateLineItem = (monthId: string, item: LineItem) => {
    dispatch({ type: 'UPDATE_LINE_ITEM', monthId, item });
  };

  const deleteLineItem = (monthId: string, itemId: string) => {
    dispatch({ type: 'DELETE_LINE_ITEM', monthId, itemId });
  };

  const reorderLineItems = (monthId: string, newOrder: string[]) => {
    dispatch({ type: 'REORDER_LINE_ITEMS', monthId, newOrder });
  };

  const addInvestment = (investment: Omit<Investment, 'id'>) => {
    dispatch({
      type: 'ADD_INVESTMENT',
      investment: { ...investment, id: generateId() },
    });
  };

  const updateInvestment = (investment: Investment) => {
    dispatch({ type: 'UPDATE_INVESTMENT', investment });
  };

  const deleteInvestment = (investmentId: string) => {
    dispatch({ type: 'DELETE_INVESTMENT', investmentId });
  };

  return (
    <CashFlowContext.Provider
      value={{
        state,
        addLineItem,
        updateLineItem,
        deleteLineItem,
        reorderLineItems,
        addInvestment,
        updateInvestment,
        deleteInvestment,
        refreshPrices,
      }}
    >
      {children}
    </CashFlowContext.Provider>
  );
}

export function useCashFlow() {
  const context = useContext(CashFlowContext);
  if (!context) {
    throw new Error('useCashFlow must be used within a CashFlowProvider');
  }
  return context;
}
