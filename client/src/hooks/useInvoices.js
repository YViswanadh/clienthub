import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../lib/axios';

// Fetch all invoices
export function useInvoices() {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const response = await axios.get('/invoices');
      return response.data;
    },
  });
}

// Create new invoice
export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (invoiceData) => {
      const response = await axios.post('/invoices', invoiceData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

// Checkout invoice (Stripe Redirect)
export function useCheckoutInvoice() {
  return useMutation({
    mutationFn: async (invoiceId) => {
      // Calls POST /api/invoices/:id/checkout -> returns { url }
      const response = await axios.post(`/invoices/${invoiceId}/checkout`);
      return response.data; // e.g., { url: 'https://checkout.stripe.com/...' }
    },
    onSuccess: (data) => {
      if (data?.url) {
        window.location.href = data.url; // Redirect directly to Stripe Checkout
      }
    },
  });
}
