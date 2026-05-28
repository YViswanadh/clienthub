import React, { useState } from 'react';
import { useInvoices, useCreateInvoice } from '../hooks/useInvoices';
import { useProjects } from '../hooks/useProjects';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import InvoiceBuilder from '../components/InvoiceBuilder';
import {
  Receipt,
  Search,
  Plus,
  Calendar,
  AlertCircle,
  CheckCircle2,
  MoreVertical,
  Download,
  Eye,
  FileCheck2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';

export default function Invoices() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
    // Add additional metadata if needed
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

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return <Badge className="bg-[#DCFCE7] text-[#15803D] border-none hover:bg-[#DCFCE7]">Paid</Badge>;
      case 'unpaid':
        return <Badge className="bg-[#FEF3C7] text-[#D97706] border-none hover:bg-[#FEF3C7]">Unpaid</Badge>;
      case 'overdue':
        return <Badge className="bg-[#FEF2F2] text-[#EF4444] border-none hover:bg-[#FEF2F2]">Overdue</Badge>;
      default:
        return <Badge className="bg-[#F3F4F6] text-[#4B5563] border-none hover:bg-[#F3F4F6]">{status}</Badge>;
    }
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
    <div className="min-h-screen bg-[#F8F8F8]">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex">
        <Sidebar
          isOpen={sidebarOpen}
          onToggleCollapse={(collapsed) => setSidebarCollapsed(collapsed)}
        />

        <main
          className={`flex-1 p-6 transition-all duration-300 ${
            sidebarCollapsed ? 'md:pl-22' : 'md:pl-66'
          }`}
        >
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Page Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#111111] font-sans m-0">Invoices</h1>
                <p className="text-xs text-[#6B7280]">
                  Track client payments, billings, and due dates
                </p>
              </div>

              <Button
                onClick={() => setCreateModalOpen(true)}
                className="bg-primary hover:bg-primary/95 text-white rounded-lg text-xs"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                New Invoice
              </Button>
            </div>

            {/* Filter ledger search bar */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-1.5 text-xs text-[#6B7280] font-semibold">
                <Receipt className="h-4.5 w-4.5 text-primary" />
                <span>Invoice Billings Ledger</span>
              </div>

              <div className="relative w-full md:max-w-xs">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search invoice number or client..."
                  className="pl-10 rounded-lg text-sm focus-visible:ring-primary border-gray-200"
                />
              </div>
            </div>

            {/* Invoices List Card Table */}
            <Card className="border border-gray-100 bg-white rounded-xl shadow-sm overflow-hidden">
              {loadingInvoices || loadingProjects ? (
                <div className="flex h-40 items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                </div>
              ) : filteredInvoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center p-6">
                  <Receipt className="h-12 w-12 text-gray-200 mb-2" />
                  <p className="text-sm font-bold text-[#111111]">No invoices found</p>
                  <p className="text-xs text-[#6B7280] mb-4">Click below to generate your first invoice for client payment.</p>
                  <Button onClick={() => setCreateModalOpen(true)} className="bg-primary text-white text-xs">
                    New Invoice
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-gray-50/70 border-b border-gray-100">
                    <TableRow>
                      <TableHead className="font-bold text-xs text-[#6B7280] p-4">Invoice Number</TableHead>
                      <TableHead className="font-bold text-xs text-[#6B7280] p-4">Client / Project</TableHead>
                      <TableHead className="font-bold text-xs text-[#6B7280] p-4">Due Date</TableHead>
                      <TableHead className="font-bold text-xs text-[#6B7280] p-4 text-right">Amount</TableHead>
                      <TableHead className="font-bold text-xs text-[#6B7280] p-4">Status</TableHead>
                      <TableHead className="p-4"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((inv) => (
                      <TableRow key={inv.id || inv._id} className="hover:bg-gray-50/50 border-b border-gray-100">
                        <TableCell className="p-4 font-bold text-sm text-[#111111]">
                          {inv.invoiceNumber}
                        </TableCell>
                        <TableCell className="p-4">
                          <div className="space-y-0.5">
                            <p className="text-xs font-semibold text-[#111111]">{inv.clientName}</p>
                            <p className="text-[10px] text-[#6B7280] font-medium">{inv.projectName}</p>
                          </div>
                        </TableCell>
                        <TableCell className="p-4 text-xs text-[#6B7280] font-medium">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                            {formatDate(inv.dueDate)}
                          </span>
                        </TableCell>
                        <TableCell className="p-4 text-right font-extrabold text-sm text-[#111111]">
                          ${inv.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="p-4">
                          {getStatusBadge(inv.status)}
                        </TableCell>
                        <TableCell className="p-4 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => window.print()}
                            className="h-8 w-8 text-[#6B7280] hover:text-[#111111] rounded-full"
                          >
                            <Download className="h-4.5 w-4.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>

            {/* Invoice Creator Dialog Modal */}
            <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
              <DialogContent className="max-w-4xl p-0 overflow-hidden border-none rounded-xl">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                  <DialogTitle className="text-base font-bold text-[#111111] flex items-center gap-2">
                    <FileCheck2 className="h-5 w-5 text-primary" />
                    Compose Client Invoice
                  </DialogTitle>
                  <DialogDescription className="text-xs text-[#6B7280] mt-0.5">
                    Build invoice billable items. Client will see paid updates dynamically.
                  </DialogDescription>
                </div>
                
                <div className="max-h-[80vh] overflow-y-auto p-6 bg-[#F8F8F8]">
                  <InvoiceBuilder
                    clients={clientsList}
                    onSave={handleCreateInvoiceSubmit}
                    isSubmitting={createInvoiceMutation.isPending}
                  />
                </div>
              </DialogContent>
            </Dialog>

          </div>
        </main>
      </div>
    </div>
  );
}
