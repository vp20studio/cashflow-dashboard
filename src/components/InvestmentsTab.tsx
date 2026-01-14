'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { calculatePL } from '@/lib/coingecko';
import { Investment } from '@/lib/types';
import { Plus, Pencil, Trash2, RefreshCw, TrendingUp, TrendingDown, Target, AlertTriangle } from 'lucide-react';

const CRYPTO_OPTIONS = [
  { name: 'Bitcoin', symbol: 'BTC', coingeckoId: 'bitcoin' },
  { name: 'Ethereum', symbol: 'ETH', coingeckoId: 'ethereum' },
  { name: 'Litecoin', symbol: 'LTC', coingeckoId: 'litecoin' },
  { name: 'Solana', symbol: 'SOL', coingeckoId: 'solana' },
  { name: 'Cardano', symbol: 'ADA', coingeckoId: 'cardano' },
  { name: 'Ripple', symbol: 'XRP', coingeckoId: 'ripple' },
  { name: 'Dogecoin', symbol: 'DOGE', coingeckoId: 'dogecoin' },
  { name: 'Polkadot', symbol: 'DOT', coingeckoId: 'polkadot' },
];

export function InvestmentsTab() {
  const { state, addInvestment, updateInvestment, deleteInvestment, refreshPrices } = useCashFlow();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form state
  const [selectedAsset, setSelectedAsset] = useState(CRYPTO_OPTIONS[2]); // Default to LTC
  const [formEntryPrice, setFormEntryPrice] = useState('');
  const [formInvestmentAmount, setFormInvestmentAmount] = useState('');
  const [formLeverage, setFormLeverage] = useState('1');
  const [formStopLoss, setFormStopLoss] = useState('');
  const [formTarget, setFormTarget] = useState('');

  // Calculate overall P/L
  const overallPL = state.investments.reduce((acc, inv) => {
    const { pl } = calculatePL(inv.entryPrice, inv.currentPrice, inv.quantity, inv.leverage);
    return acc + pl;
  }, 0);

  const totalInvested = state.investments.reduce((acc, inv) => {
    return acc + (inv.entryPrice * inv.quantity);
  }, 0);

  const overallPLPercent = totalInvested > 0 ? (overallPL / totalInvested) * 100 : 0;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshPrices();
    setIsRefreshing(false);
  };

  const resetForm = () => {
    setSelectedAsset(CRYPTO_OPTIONS[2]);
    setFormEntryPrice('');
    setFormInvestmentAmount('');
    setFormLeverage('1');
    setFormStopLoss('');
    setFormTarget('');
  };

  const handleAdd = () => {
    if (!formEntryPrice || !formInvestmentAmount) return;

    const entryPrice = parseFloat(formEntryPrice);
    const investmentAmount = parseFloat(formInvestmentAmount);
    const quantity = investmentAmount / entryPrice;

    addInvestment({
      asset: selectedAsset.name,
      symbol: selectedAsset.symbol,
      coingeckoId: selectedAsset.coingeckoId,
      entryPrice,
      currentPrice: entryPrice, // Will be updated on next price fetch
      quantity,
      leverage: parseFloat(formLeverage) || 1,
      stopLoss: parseFloat(formStopLoss) || 0,
      target: parseFloat(formTarget) || 0,
      currency: 'CAD',
    });

    resetForm();
    setIsAddDialogOpen(false);
    refreshPrices();
  };

  const handleEdit = () => {
    if (!editingInvestment || !formEntryPrice || !formInvestmentAmount) return;

    const entryPrice = parseFloat(formEntryPrice);
    const investmentAmount = parseFloat(formInvestmentAmount);
    const quantity = investmentAmount / entryPrice;

    updateInvestment({
      ...editingInvestment,
      asset: selectedAsset.name,
      symbol: selectedAsset.symbol,
      coingeckoId: selectedAsset.coingeckoId,
      entryPrice,
      quantity,
      leverage: parseFloat(formLeverage) || 1,
      stopLoss: parseFloat(formStopLoss) || 0,
      target: parseFloat(formTarget) || 0,
    });

    setEditingInvestment(null);
    resetForm();
    setIsEditDialogOpen(false);
  };

  const openEditDialog = (inv: Investment) => {
    setEditingInvestment(inv);
    const asset = CRYPTO_OPTIONS.find(a => a.coingeckoId === inv.coingeckoId) || CRYPTO_OPTIONS[0];
    setSelectedAsset(asset);
    setFormEntryPrice(inv.entryPrice.toString());
    setFormInvestmentAmount((inv.entryPrice * inv.quantity).toString());
    setFormLeverage(inv.leverage.toString());
    setFormStopLoss(inv.stopLoss.toString());
    setFormTarget(inv.target.toString());
    setIsEditDialogOpen(true);
  };

  const FormContent = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
    <div className="space-y-4">
      <div>
        <label className="text-sm text-muted-foreground">Asset</label>
        <div className="grid grid-cols-4 gap-2 mt-1">
          {CRYPTO_OPTIONS.map((asset) => (
            <Button
              key={asset.coingeckoId}
              type="button"
              variant={selectedAsset.coingeckoId === asset.coingeckoId ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedAsset(asset)}
            >
              {asset.symbol}
            </Button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-muted-foreground">Entry Price (CAD)</label>
          <Input
            type="number"
            value={formEntryPrice}
            onChange={(e) => setFormEntryPrice(e.target.value)}
            placeholder="0.00"
            className="bg-secondary border-border"
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Investment Amount (CAD)</label>
          <Input
            type="number"
            value={formInvestmentAmount}
            onChange={(e) => setFormInvestmentAmount(e.target.value)}
            placeholder="0.00"
            className="bg-secondary border-border"
          />
        </div>
      </div>
      <div>
        <label className="text-sm text-muted-foreground">Leverage</label>
        <div className="flex gap-2 mt-1">
          {[1, 2, 3, 5, 10].map((lev) => (
            <Button
              key={lev}
              type="button"
              variant={formLeverage === lev.toString() ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFormLeverage(lev.toString())}
            >
              {lev}x
            </Button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-muted-foreground">Stop Loss (CAD)</label>
          <Input
            type="number"
            value={formStopLoss}
            onChange={(e) => setFormStopLoss(e.target.value)}
            placeholder="0.00"
            className="bg-secondary border-border"
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Target (CAD)</label>
          <Input
            type="number"
            value={formTarget}
            onChange={(e) => setFormTarget(e.target.value)}
            placeholder="0.00"
            className="bg-secondary border-border"
          />
        </div>
      </div>
      <Button onClick={onSubmit} className="w-full">
        {submitLabel}
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Overall P/L Card */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Portfolio Overview</CardTitle>
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
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Invested</p>
              <p className="text-2xl font-bold">{formatCurrency(totalInvested)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Overall P/L</p>
              <p className={`text-2xl font-bold ${overallPL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatCurrency(overallPL)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Return %</p>
              <p className={`text-2xl font-bold ${overallPLPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatPercent(overallPLPercent)}
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

      {/* Positions Table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Positions</CardTitle>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Position
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Add Position</DialogTitle>
                </DialogHeader>
                <FormContent onSubmit={handleAdd} submitLabel="Add Position" />
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
                <TableHead className="text-right">Current</TableHead>
                <TableHead className="text-right">Size</TableHead>
                <TableHead className="text-center">Lev</TableHead>
                <TableHead className="text-right">SL / TP</TableHead>
                <TableHead className="text-right">P/L</TableHead>
                <TableHead className="text-right">P/L %</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.investments.map((inv) => {
                const { pl, plPercent } = calculatePL(inv.entryPrice, inv.currentPrice, inv.quantity, inv.leverage);
                const isProfit = pl >= 0;
                const investmentValue = inv.entryPrice * inv.quantity;

                // Check proximity to SL or TP
                const distanceToSL = inv.stopLoss > 0 ? ((inv.currentPrice - inv.stopLoss) / inv.stopLoss) * 100 : Infinity;
                const distanceToTP = inv.target > 0 ? ((inv.target - inv.currentPrice) / inv.currentPrice) * 100 : Infinity;
                const nearSL = distanceToSL < 10 && distanceToSL > 0;
                const nearTP = distanceToTP < 10 && distanceToTP > 0;

                return (
                  <TableRow key={inv.id} className="border-border">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{inv.symbol}</span>
                        <Badge variant="outline" className="text-xs">
                          {inv.asset}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(inv.entryPrice)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(inv.currentPrice)}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(investmentValue)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={inv.leverage > 1 ? 'default' : 'outline'}>
                        {inv.leverage}x
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-xs flex items-center gap-1 ${nearSL ? 'text-red-500' : 'text-muted-foreground'}`}>
                          {nearSL && <AlertTriangle className="h-3 w-3" />}
                          SL: {inv.stopLoss > 0 ? formatCurrency(inv.stopLoss) : '-'}
                        </span>
                        <span className={`text-xs flex items-center gap-1 ${nearTP ? 'text-green-500' : 'text-muted-foreground'}`}>
                          {nearTP && <Target className="h-3 w-3" />}
                          TP: {inv.target > 0 ? formatCurrency(inv.target) : '-'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className={`text-right font-medium ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                      <div className="flex items-center justify-end gap-1">
                        {isProfit ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        {formatCurrency(pl)}
                      </div>
                    </TableCell>
                    <TableCell className={`text-right font-medium ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                      {formatPercent(plPercent)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(inv)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500"
                          onClick={() => deleteInvestment(inv.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {state.investments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    No positions yet. Add your first position to start tracking.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Edit Position</DialogTitle>
          </DialogHeader>
          <FormContent onSubmit={handleEdit} submitLabel="Save Changes" />
        </DialogContent>
      </Dialog>
    </div>
  );
}
