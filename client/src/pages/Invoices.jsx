import React, { useState } from 'react';
import { useInvoices, useCreateInvoice } from '../hooks/useInvoices';
import { useProjects } from '../hooks/useProjects';
import InvoiceBuilder from '../components/InvoiceBuilder';
import Button from '../components/ui/button';
import Input from '../components/ui/input';
import Modal from '../components/ui/modal';
import Badge from '../components/ui/badge';

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

  const getBadgeVariant = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'paid') return 'paid';
    if (s === 'overdue') return 'overdue';
    return 'review'; // For 'unpaid' / 'pending'
  };

  // Mock invoices if database is empty
  const displayInvoices = invoices.length > 0 ? filteredInvoices : [
    { _id: 'i-1', invoiceNumber: 'INV-2026-001', clientName: 'Lumina Corp', projectName: 'E-commerce Replatform', amount: 12500, status: 'paid', dueDate: '2026-07-15' },
    { _id: 'i-2', invoiceNumber: 'INV-2026-002', clientName: 'Acme Tech', projectName: 'Brand Identity Overhaul', amount: 8750, status: 'unpaid', dueDate: '2026-08-01' },
    { _id: 'i-3', invoiceNumber: 'INV-2026-003', clientName: 'TechNova Inc', projectName: 'E-commerce Platform', amount: 24000, status: 'unpaid', dueDate: '2026-09-01' },
  ].filter(i => i.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) || i.clientName.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-12 w-full font-body-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-2">
            Invoices
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Track client payments, compose bills, and review transaction ledgers.
          </p>
        </div>
        <Button variant="primary" iconLeft="receipt" onClick={() => setCreateModalOpen(true)}>
          New Invoice
        </Button>
      </div>

      {/* Search filter block */}
      <div className="border border-outline-variant bg-surface-container-lowest p-6 rounded-DEFAULT select-none max-w-md">
        <Input
          id="search-invoices"
          label="Search Ledger"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search invoice number or client name..."
          iconLeft="search"
        />
      </div>

      {/* Invoices Table List */}
      <div className="space-y-6">
        <div className="border-b border-outline-variant pb-4">
          <h3 className="font-headline-md text-headline-md text-on-surface">Billings Ledger</h3>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          {loadingInvoices || loadingProjects ? (
            <p className="py-8 text-on-surface-variant">Loading invoices ledger...</p>
          ) : (
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-outline-variant">
                  <th className="py-4 pr-4 font-label-md text-label-md text-on-surface-variant font-medium uppercase tracking-wider">
                    Invoice ID
                  </th>
                  <th className="py-4 px-4 font-label-md text-label-md text-on-surface-variant font-medium uppercase tracking-wider">
                    Client / Project
                  </th>
                  <th className="py-4 px-4 font-label-md text-label-md text-on-surface-variant font-medium uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="py-4 px-4 font-label-md text-label-md text-on-surface-variant font-medium uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="py-4 px-4 font-label-md text-label-md text-on-surface-variant font-medium uppercase tracking-wider">
                    Status
                  </th>
                  <th className="py-4 pl-4 font-label-md text-label-md text-on-surface-variant font-medium text-right uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md divide-y divide-outline-variant">
                {displayInvoices.map((inv) => (
                  <tr key={inv._id || inv.id} className="hover:bg-surface-container-low transition-colors group">
                    <td className="py-4 pr-4 text-on-surface font-semibold font-mono text-sm">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-primary">{inv.clientName}</div>
                      <div className="text-xs text-on-surface-variant mt-0.5">{inv.projectName}</div>
                    </td>
                    <td className="py-4 px-4 text-on-surface-variant">
                      {formatDate(inv.dueDate)}
                    </td>
                    <td className="py-4 px-4 text-on-surface font-mono font-medium">
                      ${inv.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={getBadgeVariant(inv.status)}>
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="py-4 pl-4 text-right">
                      <Button variant="secondary" iconLeft="print" onClick={() => window.print()}>
                        Print
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Compose Invoice Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Compose Client Invoice"
      >
        <p className="mb-6 font-body-md text-body-md text-on-surface-variant">
          Compose billing line items for this workspace scope. Your client will receive dynamic notifications and will be redirected to the secure payment portal.
        </p>

        <InvoiceBuilder
          clients={clientsList}
          onSave={handleCreateInvoiceSubmit}
          isSubmitting={createInvoiceMutation.isPending}
        />
        
        <div className="flex gap-4 justify-end pt-8 border-t border-outline-variant mt-8">
          <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
}
