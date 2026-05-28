import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Send, Download, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

export default function InvoiceBuilder({ clients = [], onSave, isSubmitting = false }) {
  const [clientId, setClientId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState(() => {
    return 'INV-' + Math.floor(1000 + Math.random() * 9000);
  });
  const [dueDate, setDueDate] = useState(() => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 14);
    return nextWeek.toISOString().split('T')[0];
  });
  const [items, setItems] = useState([
    { description: 'Design Services', quantity: 1, rate: 1200, amount: 1200 },
  ]);
  const [total, setTotal] = useState(1200);

  // Recalculate totals whenever items change
  useEffect(() => {
    const calculatedTotal = items.reduce((sum, item) => sum + (item.quantity * item.rate || 0), 0);
    setTotal(calculatedTotal);
  }, [items]);

  const handleAddItem = () => {
    setItems((prev) => [...prev, { description: '', quantity: 1, rate: 0, amount: 0 }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        
        const updated = { ...item, [field]: value };
        
        // Convert input formats properly
        if (field === 'quantity') {
          updated.quantity = parseInt(value, 10) || 0;
        } else if (field === 'rate') {
          updated.rate = parseFloat(value) || 0;
        }
        
        updated.amount = updated.quantity * updated.rate;
        return updated;
      })
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!clientId) {
      alert('Please select a client.');
      return;
    }

    const payload = {
      clientId,
      invoiceNumber,
      dueDate,
      items,
      amount: total,
      status: 'unpaid',
    };

    if (onSave) {
      onSave(payload);
    }
  };

  const handleDownloadPDF = () => {
    // Generate simple PDF download or open browser print context
    window.print();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl border border-gray-100 shadow-sm print:shadow-none print:border-none">
      
      {/* Header Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="client" className="text-xs font-semibold text-[#6B7280]">Select Client</Label>
          <select
            id="client"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:border-primary text-sm font-sans focus:outline-none bg-white"
            required
          >
            <option value="">Choose a client...</option>
            {clients.map((c) => (
              <option key={c.id || c._id} value={c.id || c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="invoice_num" className="text-xs font-semibold text-[#6B7280]">Invoice Number</Label>
          <Input
            id="invoice_num"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            required
            className="rounded-lg text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="due_date" className="text-xs font-semibold text-[#6B7280]">Due Date</Label>
          <Input
            id="due_date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
            className="rounded-lg text-sm"
          />
        </div>
      </div>

      {/* Items Section */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-[#111111] flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-primary" />
            Line Items
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddItem}
            className="text-primary hover:text-white border-primary hover:bg-primary rounded-lg text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Item
          </Button>
        </div>

        {/* Dynamic Rows */}
        <div className="border border-gray-100 rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-[10px] uppercase font-bold tracking-wider text-[#6B7280] border-b border-gray-100">
                <th className="p-3 w-3/5">Description</th>
                <th className="p-3 w-1/8 text-center">Qty</th>
                <th className="p-3 w-1/6 text-right">Rate ($)</th>
                <th className="p-3 w-1/6 text-right">Amount ($)</th>
                <th className="p-3 w-1/12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50/50">
                  <td className="p-2">
                    <Input
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      placeholder="Item name or description..."
                      required
                      className="border-none hover:bg-white focus:bg-white rounded text-sm h-8"
                    />
                  </td>
                  <td className="p-2 text-center">
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      required
                      className="border-none hover:bg-white focus:bg-white text-center rounded text-sm h-8"
                    />
                  </td>
                  <td className="p-2 text-right">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.rate}
                      onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                      required
                      className="border-none hover:bg-white focus:bg-white text-right rounded text-sm h-8"
                    />
                  </td>
                  <td className="p-3 text-right font-medium text-sm text-[#111111]">
                    ${(item.quantity * item.rate).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-2 text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(index)}
                      disabled={items.length === 1}
                      className="h-8 w-8 text-[#6B7280] hover:text-[#EF4444] hover:bg-[#FEF2F2] rounded-full disabled:opacity-30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Footer */}
      <div className="flex flex-col items-end pt-4 border-t border-gray-100 space-y-4">
        <div className="w-full max-w-xs space-y-1.5 text-right">
          <div className="flex justify-between text-sm text-[#6B7280]">
            <span>Subtotal</span>
            <span>${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-[#111111] pt-1.5 border-t border-dashed border-gray-200">
            <span>Total Due</span>
            <span className="text-primary">${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 border-gray-200 hover:bg-gray-50 text-[#6B7280] rounded-lg text-sm"
          >
            <Download className="h-4 w-4" />
            Print / PDF
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-1.5 bg-primary hover:bg-primary/95 text-white rounded-lg text-sm px-6"
          >
            <Send className="h-4 w-4" />
            {isSubmitting ? 'Sending...' : 'Create & Send'}
          </Button>
        </div>
      </div>

    </form>
  );
}
