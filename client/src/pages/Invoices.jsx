import React, { useState } from 'react';
import { useInvoices, useCreateInvoice } from '../hooks/useInvoices';
import { useProjects } from '../hooks/useProjects';
import InvoiceBuilder from '../components/InvoiceBuilder';

export default function Invoices() {
  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Queries & Mutations
  const { data: invoices = [], isLoading: loadingInvoices } = useInvoices();
  const { data: projects = [], isLoading: loadingProjects } = useProjects();
  const createInvoiceMutation = useCreateInvoice();

  // Extract client details from project list for Invoice Selection
  const clientsList = projects.map((p) => ({
    id: p.id || p._id,
    name: p.clientName || 'Acme Client',
  }));

  const handleCreateInvoiceSubmit = (invoiceData) => {
    const selectedProject = projects.find((p) => p.id === invoiceData.clientId || p._id === invoiceData.clientId);
    
    const payload = {
      ...invoiceData,
      projectId: invoiceData.clientId, // Map select box project id
      clientName: selectedProject ? selectedProject.clientName : 'Unknown Client',
      projectName: selectedProject ? selectedProject.name : 'Unknown Project',
    };

    createInvoiceMutation.mutate(payload, {
      onSuccess: () => {
        setCreateModalOpen(false);
      },
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(dateStr));
  };

  // Filter invoices
  const filteredInvoices = invoices.filter((inv) => {
    return (
      inv.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.clientName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div>
      <div>
        <h1>Invoices</h1>
        <p>Track client payments, billings, and due dates</p>
        <button onClick={() => setCreateModalOpen(true)}>[New Invoice]</button>
      </div>

      <div>
        <strong>Invoice Billings Ledger</strong>
        <div>
          <label htmlFor="search">Search: </label>
          <input
            id="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoice number or client..."
          />
        </div>
      </div>

      <div>
        {loadingInvoices || loadingProjects ? (
          <p>Loading invoices...</p>
        ) : filteredInvoices.length === 0 ? (
          <p>No invoices found. <button onClick={() => setCreateModalOpen(true)}>[New Invoice]</button></p>
        ) : (
          <table border="1" cellPadding="5">
            <thead>
              <tr>
                <th>Invoice Number</th>
                <th>Client / Project</th>
                <th>Due Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv) => (
                <tr key={inv.id || inv._id}>
                  <td>{inv.invoiceNumber}</td>
                  <td>
                    <strong>{inv.clientName}</strong>
                    <br />
                    <small>{inv.projectName}</small>
                  </td>
                  <td>{formatDate(inv.dueDate)}</td>
                  <td>${inv.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td>{inv.status}</td>
                  <td>
                    <button onClick={() => window.print()}>[Print]</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {createModalOpen && (
        <div style={{ border: '1px solid black', padding: '20px', margin: '20px 0' }}>
          <h2>Compose Client Invoice</h2>
          <p>Build invoice billable items. Client will see paid updates dynamically.</p>
          <InvoiceBuilder
            clients={clientsList}
            onSave={handleCreateInvoiceSubmit}
            isSubmitting={createInvoiceMutation.isPending}
          />
          <br />
          <button type="button" onClick={() => setCreateModalOpen(false)}>Cancel</button>
        </div>
      )}
    </div>
  );
}
