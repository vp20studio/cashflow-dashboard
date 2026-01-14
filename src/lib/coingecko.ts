const COINGECKO_API = 'https://api.coingecko.com/api/v3';

export interface PriceResponse {
  [coinId: string]: {
    cad: number;
  };
}

export async function fetchPrices(coinIds: string[]): Promise<Record<string, number>> {
  if (coinIds.length === 0) return {};

  try {
    const ids = coinIds.join(',');
    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=${ids}&vs_currencies=cad`,
      {
        next: { revalidate: 1800 }, // Cache for 30 minutes
      }
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data: PriceResponse = await response.json();

    const prices: Record<string, number> = {};
    for (const [coinId, priceData] of Object.entries(data)) {
      prices[coinId] = priceData.cad;
    }

    return prices;
  } catch (error) {
    console.error('Failed to fetch prices:', error);
    return {};
  }
}

export function calculatePL(
  entryPrice: number,
  currentPrice: number,
  quantity: number,
  investedAmount: number
): { pl: number; plPercent: number } {
  // P/L is simply the price change times the position quantity
  const pl = (currentPrice - entryPrice) * quantity;
  // Return % is based on actual cash invested
  const plPercent = investedAmount > 0 ? (pl / investedAmount) * 100 : 0;

  return { pl, plPercent };
}
