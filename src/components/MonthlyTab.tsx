'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useCashFlow } from '@/lib/cashflow-context';
import { formatCurrency } from '@/lib/formatters';
import { LineItem, MonthData } from '@/lib/types';
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
import { GripVertical, Plus, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

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
      className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg group"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{item.name}</span>
          <Badge variant="outline" className="text-xs">
            {item.category}
          </Badge>
        </div>
      </div>
      <span className={`font-medium ${item.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
        {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
      </span>
      <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(item)}>
          <Pencil className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => onDelete(item.id)}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

interface MonthCardProps {
  month: MonthData;
}

function MonthCard({ month }: MonthCardProps) {
  const { reorderLineItems, addLineItem, updateLineItem, deleteLineItem } = useCashFlow();
  const [isExpanded, setIsExpanded] = useState(true);
  const [editingItem, setEditingItem] = useState<LineItem | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formType, setFormType] = useState<'income' | 'expense'>('expense');
  const [formCategory, setFormCategory] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = month.lineItemOrder.indexOf(active.id as string);
      const newIndex = month.lineItemOrder.indexOf(over.id as string);
      const newOrder = arrayMove(month.lineItemOrder, oldIndex, newIndex);
      reorderLineItems(month.id, newOrder);
    }
  };

  const sortedItems = month.lineItemOrder
    .map(id => month.lineItems.find(item => item.id === id))
    .filter((item): item is LineItem => item !== undefined);

  const income = month.lineItems
    .filter(item => item.type === 'income')
    .reduce((sum, item) => sum + item.amount, 0);
  const expenses = month.lineItems
    .filter(item => item.type === 'expense')
    .reduce((sum, item) => sum + item.amount, 0);
  const profit = income - expenses;

  const resetForm = () => {
    setFormName('');
    setFormAmount('');
    setFormType('expense');
    setFormCategory('');
  };

  const handleAdd = () => {
    if (!formName || !formAmount || !formCategory) return;
    addLineItem(month.id, {
      name: formName,
      amount: parseFloat(formAmount),
      type: formType,
      category: formCategory,
    });
    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEdit = () => {
    if (!editingItem || !formName || !formAmount || !formCategory) return;
    updateLineItem(month.id, {
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

  const openEditDialog = (item: LineItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormAmount(item.amount.toString());
    setFormType(item.type);
    setFormCategory(item.category);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (itemId: string) => {
    deleteLineItem(month.id, itemId);
  };

  const FormContent = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
    <div className="space-y-4">
      <div>
        <label className="text-sm text-muted-foreground">Name</label>
        <Input
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          placeholder="e.g., Salary, Rent"
          className="bg-secondary border-border"
        />
      </div>
      <div>
        <label className="text-sm text-muted-foreground">Amount</label>
        <Input
          type="number"
          value={formAmount}
          onChange={(e) => setFormAmount(e.target.value)}
          placeholder="0.00"
          className="bg-secondary border-border"
        />
      </div>
      <div>
        <label className="text-sm text-muted-foreground">Type</label>
        <div className="flex gap-2 mt-1">
          <Button
            type="button"
            variant={formType === 'income' ? 'default' : 'outline'}
            className={formType === 'income' ? 'bg-green-600 hover:bg-green-700' : ''}
            onClick={() => setFormType('income')}
          >
            Income
          </Button>
          <Button
            type="button"
            variant={formType === 'expense' ? 'default' : 'outline'}
            className={formType === 'expense' ? 'bg-red-600 hover:bg-red-700' : ''}
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
          className="bg-secondary border-border"
        />
      </div>
      <Button onClick={onSubmit} className="w-full">
        {submitLabel}
      </Button>
    </div>
  );

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{month.month}</CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex gap-4 text-sm">
              <span className="text-green-500">+{formatCurrency(income)}</span>
              <span className="text-red-500">-{formatCurrency(expenses)}</span>
              <span className={profit >= 0 ? 'text-green-500' : 'text-red-500'}>
                = {formatCurrency(profit)}
              </span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={month.lineItemOrder} strategy={verticalListSortingStrategy}>
              <div className="space-y-2 mb-4">
                {sortedItems.map((item) => (
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

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full" onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Line Item
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Add Line Item</DialogTitle>
              </DialogHeader>
              <FormContent onSubmit={handleAdd} submitLabel="Add Item" />
            </DialogContent>
          </Dialog>

          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Edit Line Item</DialogTitle>
              </DialogHeader>
              <FormContent onSubmit={handleEdit} submitLabel="Save Changes" />
            </DialogContent>
          </Dialog>
        </CardContent>
      )}
    </Card>
  );
}

export function MonthlyTab() {
  const { state } = useCashFlow();

  return (
    <div className="space-y-4">
      {state.months.map((month) => (
        <MonthCard key={month.id} month={month} />
      ))}
    </div>
  );
}
