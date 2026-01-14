'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCashFlow } from '@/lib/cashflow-context';
import { formatCurrency } from '@/lib/formatters';
import { LineItem } from '@/lib/types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Pencil, Trash2, TrendingUp, TrendingDown, Wallet } from 'lucide-react';

interface SortableItemProps {
  item: LineItem;
  onEdit: (item: LineItem) => void;
  onDelete: (id: string) => void;
}

function SortableItem({ item, onEdit, onDelete }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg group hover:bg-secondary/50 transition-colors"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{item.name}</span>
          <Badge variant="outline" className="text-xs shrink-0">
            {item.category}
          </Badge>
        </div>
      </div>
      <span className={`font-semibold tabular-nums text-right w-28 ${item.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
        {formatCurrency(item.amount)}
      </span>
      <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(item)}>
          <Pencil className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-400" onClick={() => onDelete(item.id)}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

const monthShortNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function MonthlyTab() {
  const { state, reorderLineItems, addLineItem, updateLineItem, deleteLineItem } = useCashFlow();
  const [selectedMonthId, setSelectedMonthId] = useState(state.months[0]?.id || '');
  const [editingItem, setEditingItem] = useState<LineItem | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [addType, setAddType] = useState<'income' | 'expense'>('income');

  // Form state
  const [formName, setFormName] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formType, setFormType] = useState<'income' | 'expense'>('income');
  const [formCategory, setFormCategory] = useState('');

  const selectedMonth = state.months.find(m => m.id === selectedMonthId) || state.months[0];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { incomeItems, expenseItems, totalIncome, totalExpenses, profit } = useMemo(() => {
    if (!selectedMonth) return { incomeItems: [], expenseItems: [], totalIncome: 0, totalExpenses: 0, profit: 0 };

    const incomeItems = selectedMonth.lineItemOrder
      .map(id => selectedMonth.lineItems.find(item => item.id === id))
      .filter((item): item is LineItem => item !== undefined && item.type === 'income');

    const expenseItems = selectedMonth.lineItemOrder
      .map(id => selectedMonth.lineItems.find(item => item.id === id))
      .filter((item): item is LineItem => item !== undefined && item.type === 'expense');

    const totalIncome = incomeItems.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = expenseItems.reduce((sum, item) => sum + item.amount, 0);

    return {
      incomeItems,
      expenseItems,
      totalIncome,
      totalExpenses,
      profit: totalIncome - totalExpenses,
    };
  }, [selectedMonth]);

  const handleDragEnd = (event: DragEndEvent, type: 'income' | 'expense') => {
    const { active, over } = event;
    if (!over || !selectedMonth || active.id === over.id) return;

    const items = type === 'income' ? incomeItems : expenseItems;
    const itemIds = items.map(i => i.id);

    const oldIndex = itemIds.indexOf(active.id as string);
    const newIndex = itemIds.indexOf(over.id as string);

    if (oldIndex === -1 || newIndex === -1) return;

    const newItemOrder = arrayMove(itemIds, oldIndex, newIndex);

    // Rebuild full order: keep other type items in place, update this type
    const otherItems = type === 'income'
      ? expenseItems.map(i => i.id)
      : incomeItems.map(i => i.id);

    const fullOrder = type === 'income'
      ? [...newItemOrder, ...otherItems]
      : [...otherItems, ...newItemOrder];

    reorderLineItems(selectedMonth.id, fullOrder);
  };

  const resetForm = () => {
    setFormName('');
    setFormAmount('');
    setFormCategory('');
  };

  const handleAdd = () => {
    if (!formName || !formAmount || !formCategory || !selectedMonth) return;
    addLineItem(selectedMonth.id, {
      name: formName,
      amount: parseFloat(formAmount),
      type: formType,
      category: formCategory,
    });
    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEdit = () => {
    if (!editingItem || !formName || !formAmount || !formCategory || !selectedMonth) return;
    updateLineItem(selectedMonth.id, {
      ...editingItem,
      name: formName,
      amount: parseFloat(formAmount),
      type: formType,
      category: formCategory,
    });
    setEditingItem(null);
    resetForm();
    setIsEditDialogOpen(false);
  };

  const openAddDialog = (type: 'income' | 'expense') => {
    setAddType(type);
    setFormType(type);
    resetForm();
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (item: LineItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormAmount(item.amount.toString());
    setFormType(item.type);
    setFormCategory(item.category);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (itemId: string) => {
    if (!selectedMonth) return;
    deleteLineItem(selectedMonth.id, itemId);
  };

  if (!selectedMonth) return null;

  return (
    <div className="space-y-6">
      {/* Month Selector */}
      <div className="flex flex-wrap gap-2">
        {state.months.map((month) => {
          const hasData = month.lineItems.length > 0;
          const isSelected = month.id === selectedMonthId;
          return (
            <Button
              key={month.id}
              variant={isSelected ? 'default' : 'outline'}
              size="sm"
              className={`
                ${isSelected ? 'bg-primary' : hasData ? 'border-primary/50' : 'opacity-50'}
                ${hasData && !isSelected ? 'hover:border-primary' : ''}
              `}
              onClick={() => setSelectedMonthId(month.id)}
            >
              {monthShortNames[month.monthIndex]}
              {hasData && !isSelected && (
                <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-green-500" />
              )}
            </Button>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Income</p>
                <p className="text-xl font-bold text-green-500">{formatCurrency(totalIncome)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <TrendingDown className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expenses</p>
                <p className="text-xl font-bold text-red-500">{formatCurrency(totalExpenses)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${profit >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                <Wallet className={`h-5 w-5 ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Net</p>
                <p className={`text-xl font-bold ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(profit)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout: Income & Expenses */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Income Column */}
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-green-500 rounded-full" />
                <h3 className="text-lg font-semibold">Income</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-green-500/50 text-green-500 hover:bg-green-500/10"
                onClick={() => openAddDialog('income')}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>

            {incomeItems.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(e) => handleDragEnd(e, 'income')}
              >
                <SortableContext items={incomeItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {incomeItems.map((item) => (
                      <SortableItem
                        key={item.id}
                        item={item}
                        onEdit={openEditDialog}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="py-8 text-center text-muted-foreground border-2 border-dashed border-border rounded-lg">
                No income items
              </div>
            )}

            {incomeItems.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                <span className="font-medium text-muted-foreground">Total</span>
                <span className="font-bold text-green-500 text-lg tabular-nums">{formatCurrency(totalIncome)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expenses Column */}
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-red-500 rounded-full" />
                <h3 className="text-lg font-semibold">Expenses</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                onClick={() => openAddDialog('expense')}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>

            {expenseItems.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(e) => handleDragEnd(e, 'expense')}
              >
                <SortableContext items={expenseItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {expenseItems.map((item) => (
                      <SortableItem
                        key={item.id}
                        item={item}
                        onEdit={openEditDialog}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="py-8 text-center text-muted-foreground border-2 border-dashed border-border rounded-lg">
                No expense items
              </div>
            )}

            {expenseItems.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                <span className="font-medium text-muted-foreground">Total</span>
                <span className="font-bold text-red-500 text-lg tabular-nums">{formatCurrency(totalExpenses)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Add {addType === 'income' ? 'Income' : 'Expense'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Name</label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., Salary, Rent"
                className="bg-secondary border-border mt-1"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Amount</label>
              <Input
                type="number"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                placeholder="0.00"
                className="bg-secondary border-border mt-1"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Type</label>
              <div className="flex gap-2 mt-1">
                <Button
                  type="button"
                  variant={formType === 'income' ? 'default' : 'outline'}
                  className={formType === 'income' ? 'bg-green-600 hover:bg-green-700 flex-1' : 'flex-1'}
                  onClick={() => setFormType('income')}
                >
                  Income
                </Button>
                <Button
                  type="button"
                  variant={formType === 'expense' ? 'default' : 'outline'}
                  className={formType === 'expense' ? 'bg-red-600 hover:bg-red-700 flex-1' : 'flex-1'}
                  onClick={() => setFormType('expense')}
                >
                  Expense
                </Button>
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Category</label>
              <Input
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                placeholder="e.g., Housing, Food"
                className="bg-secondary border-border mt-1"
              />
            </div>
            <Button onClick={handleAdd} className="w-full">
              Add Item
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Edit Line Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Name</label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., Salary, Rent"
                className="bg-secondary border-border mt-1"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Amount</label>
              <Input
                type="number"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                placeholder="0.00"
                className="bg-secondary border-border mt-1"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Type</label>
              <div className="flex gap-2 mt-1">
                <Button
                  type="button"
                  variant={formType === 'income' ? 'default' : 'outline'}
                  className={formType === 'income' ? 'bg-green-600 hover:bg-green-700 flex-1' : 'flex-1'}
                  onClick={() => setFormType('income')}
                >
                  Income
                </Button>
                <Button
                  type="button"
                  variant={formType === 'expense' ? 'default' : 'outline'}
                  className={formType === 'expense' ? 'bg-red-600 hover:bg-red-700 flex-1' : 'flex-1'}
                  onClick={() => setFormType('expense')}
                >
                  Expense
                </Button>
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Category</label>
              <Input
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                placeholder="e.g., Housing, Food"
                className="bg-secondary border-border mt-1"
              />
            </div>
            <Button onClick={handleEdit} className="w-full">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
