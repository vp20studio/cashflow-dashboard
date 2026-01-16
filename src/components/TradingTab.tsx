'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useCashFlow } from '@/lib/cashflow-context';
import { formatCurrency, formatPercent, formatDate } from '@/lib/formatters';
import { Trade } from '@/lib/types';
import { Plus, Pencil, Trash2, RefreshCw, TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle2 } from 'lucide-react';

const TOTAL_DEPOSITED = 10000; // Static $10k CAD deposited

// Common crypto options for quick selection
const CRYPTO_PRESETS = [
  { name: 'Bitcoin', symbol: 'BTC', coingeckoId: 'bitcoin' },
  { name: 'Ethereum', symbol: 'ETH', coingeckoId: 'ethereum' },
  { name: 'Litecoin', symbol: 'LTC', coingeckoId: 'litecoin' },
  { name: 'Solana', symbol: 'SOL', coingeckoId: 'solana' },
];

// Map symbols to CoinGecko IDs for auto-detection
const SYMBOL_TO_COINGECKO: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'LTC': 'litecoin',
  'SOL': 'solana',
  'XRP': 'ripple',
  'ADA': 'cardano',
  'DOGE': 'dogecoin',
  'DOT': 'polkadot',
  'AVAX': 'avalanche-2',
  'LINK': 'chainlink',
  'MATIC': 'matic-network',
  'UNI': 'uniswap',
  'ATOM': 'cosmos',
  'XLM': 'stellar',
};

function calculateTradePL(trade: Trade): { pl: number; plPercent: number } {
  const priceToUse = trade.status === 'closed' && trade.exitPrice ? trade.exitPrice : trade.currentPrice;
  const pl = (priceToUse - trade.entryPrice) * trade.quantity;
  const plPercent = trade.riskAmount > 0 ? (pl / trade.riskAmount) * 100 : 0;
  return { pl, plPercent };
}

export function TradingTab() {
  const { state, addInvestment, updateInvestment, deleteInvestment, refreshPrices } = useCashFlow();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form state
  const [formAsset, setFormAsset] = useState('');
  const [formSymbol, setFormSymbol] = useState('');
  const [formCoingeckoId, setFormCoingeckoId] = useState('');
  const [formEntryPrice, setFormEntryPrice] = useState('');
  const [formExitPrice, setFormExitPrice] = useState('');
  const [formQuantity, setFormQuantity] = useState('');
  const [formRiskAmount, setFormRiskAmount] = useState('');
  const [formLeverage, setFormLeverage] = useState([1]);
  const [formStopLoss, setFormStopLoss] = useState('');
  const [formTarget, setFormTarget] = useState('');
  const [formStatus, setFormStatus] = useState<'open' | 'closed'>('open');

  // Separate open and closed trades
  const { openTrades, closedTrades, totalOpenPL, totalClosedPL } = useMemo(() => {
    const openTrades = state.investments.filter(t => t.status === 'open');
    const closedTrades = state.investments.filter(t => t.status === 'closed');

    const totalOpenPL = openTrades.reduce((acc, t) => {
      const { pl } = calculateTradePL(t);
      return acc + pl;
    }, 0);

    const totalClosedPL = closedTrades.reduce((acc, t) => {
      const { pl } = calculateTradePL(t);
      return acc + pl;
    }, 0);

    return { openTrades, closedTrades, totalOpenPL, totalClosedPL };
  }, [state.investments]);

  const totalPL = totalOpenPL + totalClosedPL;
  const currentBalance = TOTAL_DEPOSITED + totalPL;
  const overallReturn = (totalPL / TOTAL_DEPOSITED) * 100;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshPrices();
    setIsRefreshing(false);
  };

  const resetForm = () => {
    setFormAsset('');
    setFormSymbol('');
    setFormCoingeckoId('');
    setFormEntryPrice('');
    setFormExitPrice('');
    setFormQuantity('');
    setFormRiskAmount('');
    setFormLeverage([1]);
    setFormStopLoss('');
    setFormTarget('');
    setFormStatus('open');
  };

  const selectPreset = (preset: typeof CRYPTO_PRESETS[0]) => {
    setFormAsset(preset.name);
    setFormSymbol(preset.symbol);
    setFormCoingeckoId(preset.coingeckoId);
  };

  const handleAdd = () => {
    if (!formSymbol || !formEntryPrice || !formQuantity) return;

    addInvestment({
      asset: formAsset || formSymbol,
      symbol: formSymbol.toUpperCase(),
      coingeckoId: formCoingeckoId || undefined,
      entryPrice: parseFloat(formEntryPrice),
      currentPrice: parseFloat(formEntryPrice),
      exitPrice: formStatus === 'closed' && formExitPrice ? parseFloat(formExitPrice) : undefined,
      quantity: parseFloat(formQuantity),
      riskAmount: parseFloat(formRiskAmount) || 0,
      leverage: formLeverage[0],
      stopLoss: parseFloat(formStopLoss) || 0,
      target: parseFloat(formTarget) || 0,
      status: formStatus,
      currency: 'CAD',
    });

    resetForm();
    setIsAddDialogOpen(false);
    if (formCoingeckoId) refreshPrices();
  };

  const handleEdit = () => {
    if (!editingTrade || !formSymbol || !formEntryPrice || !formQuantity) return;

    updateInvestment({
      ...editingTrade,
      asset: formAsset || formSymbol,
      symbol: formSymbol.toUpperCase(),
      coingeckoId: formCoingeckoId || undefined,
      entryPrice: parseFloat(formEntryPrice),
      exitPrice: formStatus === 'closed' && formExitPrice ? parseFloat(formExitPrice) : undefined,
      quantity: parseFloat(formQuantity),
      riskAmount: parseFloat(formRiskAmount) || 0,
      leverage: formLeverage[0],
      stopLoss: parseFloat(formStopLoss) || 0,
      target: parseFloat(formTarget) || 0,
      status: formStatus,
    });

    setEditingTrade(null);
    resetForm();
    setIsEditDialogOpen(false);
  };

  const openEditDialog = (trade: Trade) => {
    setEditingTrade(trade);
    setFormAsset(trade.asset);
    setFormSymbol(trade.symbol);
    setFormCoingeckoId(trade.coingeckoId || '');
    setFormEntryPrice(trade.entryPrice.toString());
    setFormExitPrice(trade.exitPrice?.toString() || '');
    setFormQuantity(trade.quantity.toString());
    setFormRiskAmount(trade.riskAmount.toString());
    setFormLeverage([trade.leverage]);
    setFormStopLoss(trade.stopLoss.toString());
    setFormTarget(trade.target.toString());
    setFormStatus(trade.status);
    setIsEditDialogOpen(true);
  };

  const renderTradeRow = (trade: Trade) => {
    const { pl, plPercent } = calculateTradePL(trade);
    const isProfit = pl >= 0;
    const isClosed = trade.status === 'closed';

    const distanceToSL = trade.stopLoss > 0 ? ((trade.currentPrice - trade.stopLoss) / trade.stopLoss) * 100 : Infinity;
    const distanceToTP = trade.target > 0 ? ((trade.target - trade.currentPrice) / trade.currentPrice) * 100 : Infinity;
    const nearSL = !isClosed && distanceToSL < 10 && distanceToSL > 0;
    const nearTP = !isClosed && distanceToTP < 10 && distanceToTP > 0;

    return (
      <TableRow key={trade.id} className={`border-border ${isClosed ? 'opacity-60' : ''}`}>
        <TableCell>
          <div className="flex items-center gap-2">
            <span className="font-medium">{trade.symbol}</span>
            {isClosed && (
              <Badge variant="outline" className="text-xs bg-muted">
                Closed
              </Badge>
            )}
          </div>
        </TableCell>
        <TableCell className="text-right tabular-nums">{formatCurrency(trade.entryPrice)}</TableCell>
        <TableCell className="text-right tabular-nums font-medium">
          {isClosed && trade.exitPrice ? formatCurrency(trade.exitPrice) : formatCurrency(trade.currentPrice)}
        </TableCell>
        <TableCell className="text-right tabular-nums">
          {trade.quantity.toFixed(2)} {trade.symbol}
        </TableCell>
        <TableCell className="text-center">
          <Badge variant={trade.leverage > 1 ? 'default' : 'outline'}>
            {trade.leverage}x
          </Badge>
        </TableCell>
        <TableCell className="text-right">
          {!isClosed && (
            <div className="flex flex-col items-end gap-1">
              <span className={`text-xs flex items-center gap-1 ${nearSL ? 'text-red-500' : 'text-muted-foreground'}`}>
                {nearSL && <AlertTriangle className="h-3 w-3" />}
                SL: {trade.stopLoss > 0 ? formatCurrency(trade.stopLoss) : '-'}
              </span>
              <span className={`text-xs flex items-center gap-1 ${nearTP ? 'text-green-500' : 'text-muted-foreground'}`}>
                {nearTP && <Target className="h-3 w-3" />}
                TP: {trade.target > 0 ? formatCurrency(trade.target) : '-'}
              </span>
            </div>
          )}
          {isClosed && <span className="text-muted-foreground">-</span>}
        </TableCell>
        <TableCell className={`text-right tabular-nums font-medium ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
          <div className="flex items-center justify-end gap-1">
            {isProfit ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {isProfit ? '+' : ''}{formatCurrency(pl)}
          </div>
        </TableCell>
        <TableCell className={`text-right tabular-nums font-medium ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
          {isProfit ? '+' : ''}{formatPercent(plPercent)}
        </TableCell>
        <TableCell>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => openEditDialog(trade)}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-500"
              onClick={() => deleteInvestment(trade.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-4">
      {/* Portfolio Overview Card */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Trading Overview</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh Prices
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Deposited</p>
              <p className="text-2xl font-bold tabular-nums">{formatCurrency(TOTAL_DEPOSITED)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Balance</p>
              <p className={`text-2xl font-bold tabular-nums ${currentBalance >= TOTAL_DEPOSITED ? 'text-green-500' : 'text-red-500'}`}>
                {formatCurrency(currentBalance)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Open P/L</p>
              <p className={`text-2xl font-bold tabular-nums ${totalOpenPL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {totalOpenPL >= 0 ? '+' : ''}{formatCurrency(totalOpenPL)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Realized P/L</p>
              <p className={`text-2xl font-bold tabular-nums ${totalClosedPL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {totalClosedPL >= 0 ? '+' : ''}{formatCurrency(totalClosedPL)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Overall Return</p>
              <p className={`text-2xl font-bold tabular-nums ${overallReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {overallReturn >= 0 ? '+' : ''}{formatPercent(overallReturn)}
              </p>
            </div>
          </div>
          {state.lastPriceUpdate && (
            <p className="text-xs text-muted-foreground mt-4">
              Last updated: {formatDate(state.lastPriceUpdate)}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Trades Table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Trades</CardTitle>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Trade
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Trade</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Quick Select</label>
                    <div className="flex gap-2 mt-1">
                      {CRYPTO_PRESETS.map((preset) => (
                        <Button
                          key={preset.symbol}
                          type="button"
                          variant={formSymbol === preset.symbol ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => selectPreset(preset)}
                        >
                          {preset.symbol}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">Symbol (e.g., BTC)</label>
                      <Input
                        value={formSymbol}
                        onChange={(e) => {
                          const symbol = e.target.value.toUpperCase();
                          setFormSymbol(symbol);
                          // Auto-detect CoinGecko ID
                          if (SYMBOL_TO_COINGECKO[symbol]) {
                            setFormCoingeckoId(SYMBOL_TO_COINGECKO[symbol]);
                          }
                        }}
                        placeholder="BTC"
                        className="bg-secondary border-border mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Asset Name (optional)</label>
                      <Input
                        value={formAsset}
                        onChange={(e) => setFormAsset(e.target.value)}
                        placeholder="Bitcoin"
                        className="bg-secondary border-border mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">CoinGecko ID (for live prices)</label>
                    <Input
                      value={formCoingeckoId}
                      onChange={(e) => setFormCoingeckoId(e.target.value.toLowerCase())}
                      placeholder="litecoin"
                      className="bg-secondary border-border mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {formCoingeckoId ? '✓ Will fetch live CAD prices' : 'Leave empty for manual price entry only'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Status</label>
                    <div className="flex gap-2 mt-1">
                      <Button
                        type="button"
                        variant={formStatus === 'open' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFormStatus('open')}
                        className={formStatus === 'open' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                      >
                        Open
                      </Button>
                      <Button
                        type="button"
                        variant={formStatus === 'closed' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFormStatus('closed')}
                        className={formStatus === 'closed' ? 'bg-gray-600 hover:bg-gray-700' : ''}
                      >
                        Closed
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">Entry Price (CAD)</label>
                      <Input
                        type="number"
                        value={formEntryPrice}
                        onChange={(e) => setFormEntryPrice(e.target.value)}
                        placeholder="109.00"
                        className="bg-secondary border-border mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">
                        {formStatus === 'closed' ? 'Exit Price (CAD)' : `Position Size (${formSymbol || 'units'})`}
                      </label>
                      <Input
                        type="number"
                        value={formStatus === 'closed' ? formExitPrice : formQuantity}
                        onChange={(e) => formStatus === 'closed' ? setFormExitPrice(e.target.value) : setFormQuantity(e.target.value)}
                        placeholder={formStatus === 'closed' ? '150.00' : '250'}
                        className="bg-secondary border-border mt-1"
                      />
                    </div>
                  </div>
                  {formStatus === 'closed' && (
                    <div>
                      <label className="text-sm text-muted-foreground">Position Size ({formSymbol || 'units'})</label>
                      <Input
                        type="number"
                        value={formQuantity}
                        onChange={(e) => setFormQuantity(e.target.value)}
                        placeholder="250"
                        className="bg-secondary border-border mt-1"
                      />
                    </div>
                  )}
                  <div>
                    <label className="text-sm text-muted-foreground">Risk Amount (CAD)</label>
                    <Input
                      type="number"
                      value={formRiskAmount}
                      onChange={(e) => setFormRiskAmount(e.target.value)}
                      placeholder="1000"
                      className="bg-secondary border-border mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Amount risked (for return % calculation)</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Leverage: {formLeverage[0]}x</label>
                    <Slider
                      value={formLeverage}
                      onValueChange={setFormLeverage}
                      min={1}
                      max={100}
                      step={1}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>1x</span>
                      <span>25x</span>
                      <span>50x</span>
                      <span>75x</span>
                      <span>100x</span>
                    </div>
                  </div>
                  {formStatus === 'open' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-muted-foreground">Stop Loss (CAD)</label>
                        <Input
                          type="number"
                          value={formStopLoss}
                          onChange={(e) => setFormStopLoss(e.target.value)}
                          placeholder="73"
                          className="bg-secondary border-border mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">Target (CAD)</label>
                        <Input
                          type="number"
                          value={formTarget}
                          onChange={(e) => setFormTarget(e.target.value)}
                          placeholder="330"
                          className="bg-secondary border-border mt-1"
                        />
                      </div>
                    </div>
                  )}
                  <Button onClick={handleAdd} className="w-full">
                    Add Trade
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>Asset</TableHead>
                <TableHead className="text-right">Entry</TableHead>
                <TableHead className="text-right">Current/Exit</TableHead>
                <TableHead className="text-right">Size</TableHead>
                <TableHead className="text-center">Lev</TableHead>
                <TableHead className="text-right">SL / TP</TableHead>
                <TableHead className="text-right">P/L</TableHead>
                <TableHead className="text-right">Return</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {openTrades.map(renderTradeRow)}
              {closedTrades.length > 0 && openTrades.length > 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm font-medium">Closed Trades</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {closedTrades.map(renderTradeRow)}
              {state.investments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    No trades yet. Add your first trade to start tracking.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Trade</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Quick Select</label>
              <div className="flex gap-2 mt-1">
                {CRYPTO_PRESETS.map((preset) => (
                  <Button
                    key={preset.symbol}
                    type="button"
                    variant={formSymbol === preset.symbol ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => selectPreset(preset)}
                  >
                    {preset.symbol}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Symbol (e.g., BTC)</label>
                <Input
                  value={formSymbol}
                  onChange={(e) => {
                    const symbol = e.target.value.toUpperCase();
                    setFormSymbol(symbol);
                    // Auto-detect CoinGecko ID
                    if (SYMBOL_TO_COINGECKO[symbol]) {
                      setFormCoingeckoId(SYMBOL_TO_COINGECKO[symbol]);
                    }
                  }}
                  placeholder="BTC"
                  className="bg-secondary border-border mt-1"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Asset Name (optional)</label>
                <Input
                  value={formAsset}
                  onChange={(e) => setFormAsset(e.target.value)}
                  placeholder="Bitcoin"
                  className="bg-secondary border-border mt-1"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">CoinGecko ID (for live prices)</label>
              <Input
                value={formCoingeckoId}
                onChange={(e) => setFormCoingeckoId(e.target.value.toLowerCase())}
                placeholder="litecoin"
                className="bg-secondary border-border mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formCoingeckoId ? '✓ Will fetch live CAD prices' : 'Leave empty for manual price entry only'}
              </p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Status</label>
              <div className="flex gap-2 mt-1">
                <Button
                  type="button"
                  variant={formStatus === 'open' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFormStatus('open')}
                  className={formStatus === 'open' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                >
                  Open
                </Button>
                <Button
                  type="button"
                  variant={formStatus === 'closed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFormStatus('closed')}
                  className={formStatus === 'closed' ? 'bg-gray-600 hover:bg-gray-700' : ''}
                >
                  Closed
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Entry Price (CAD)</label>
                <Input
                  type="number"
                  value={formEntryPrice}
                  onChange={(e) => setFormEntryPrice(e.target.value)}
                  placeholder="109.00"
                  className="bg-secondary border-border mt-1"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">
                  {formStatus === 'closed' ? 'Exit Price (CAD)' : `Position Size (${formSymbol || 'units'})`}
                </label>
                <Input
                  type="number"
                  value={formStatus === 'closed' ? formExitPrice : formQuantity}
                  onChange={(e) => formStatus === 'closed' ? setFormExitPrice(e.target.value) : setFormQuantity(e.target.value)}
                  placeholder={formStatus === 'closed' ? '150.00' : '250'}
                  className="bg-secondary border-border mt-1"
                />
              </div>
            </div>
            {formStatus === 'closed' && (
              <div>
                <label className="text-sm text-muted-foreground">Position Size ({formSymbol || 'units'})</label>
                <Input
                  type="number"
                  value={formQuantity}
                  onChange={(e) => setFormQuantity(e.target.value)}
                  placeholder="250"
                  className="bg-secondary border-border mt-1"
                />
              </div>
            )}
            <div>
              <label className="text-sm text-muted-foreground">Risk Amount (CAD)</label>
              <Input
                type="number"
                value={formRiskAmount}
                onChange={(e) => setFormRiskAmount(e.target.value)}
                placeholder="1000"
                className="bg-secondary border-border mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Amount risked (for return % calculation)</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Leverage: {formLeverage[0]}x</label>
              <Slider
                value={formLeverage}
                onValueChange={setFormLeverage}
                min={1}
                max={100}
                step={1}
                className="mt-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1x</span>
                <span>25x</span>
                <span>50x</span>
                <span>75x</span>
                <span>100x</span>
              </div>
            </div>
            {formStatus === 'open' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Stop Loss (CAD)</label>
                  <Input
                    type="number"
                    value={formStopLoss}
                    onChange={(e) => setFormStopLoss(e.target.value)}
                    placeholder="73"
                    className="bg-secondary border-border mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Target (CAD)</label>
                  <Input
                    type="number"
                    value={formTarget}
                    onChange={(e) => setFormTarget(e.target.value)}
                    placeholder="330"
                    className="bg-secondary border-border mt-1"
                  />
                </div>
              </div>
            )}
            <Button onClick={handleEdit} className="w-full">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
