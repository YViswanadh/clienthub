import React, { useState, useEffect } from 'react';

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

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <div>
          <label htmlFor="client">Select Client: </label>
          <select
            id="client"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
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

        <div>
          <label htmlFor="invoice_num">Invoice Number: </label>
          <input
            id="invoice_num"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="due_date">Due Date: </label>
          <input
            id="due_date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <div>
          <h3>Line Items</h3>
          <button type="button" onClick={handleAddItem}>[Add Item]</button>
        </div>

        <table border="1" cellPadding="5">
          <thead>
            <tr>
              <th>Description</th>
              <th>Qty</th>
              <th>Rate ($)</th>
              <th>Amount ($)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index}>
                <td>
                  <input
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    placeholder="Item description..."
                    required
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    required
                  />
                </td>
                <td>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.rate}
                    onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                    required
                  />
                </td>
                <td>
                  ${(item.quantity * item.rate).toFixed(2)}
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    disabled={items.length === 1}
                  >
                    [Delete]
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <p>Subtotal: ${total.toFixed(2)}</p>
        <p><strong>Total Due: ${total.toFixed(2)}</strong></p>

        <div>
          <button type="button" onClick={() => window.print()}>[Print / PDF]</button>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : '[Create & Send]'}
          </button>
        </div>
      </div>
    </form>
  );
}
