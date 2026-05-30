import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../lib/axios';
import Button from '../components/ui/button';
import Input from '../components/ui/input';
import Modal from '../components/ui/modal';
import Badge from '../components/ui/badge';

export default function Clients() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  // Invite states
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  // Fetch clients query
  const { data: clientsData, isLoading: loadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      // Endpoint is /api/agency/clients, mapped by proxy to /clients
      const response = await axios.get('/agency/clients');
      return response.data;
    },
  });

  const clientsList = clientsData?.clients || [];

  // Invite client mutation
  const inviteMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await axios.post('/auth/invite', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setInviteSuccess('Invitation email successfully sent to client!');
      setClientName('');
      setClientEmail('');
      setInviteError('');
      // Keep open momentarily or auto-close
      setTimeout(() => {
        setInviteModalOpen(false);
        setInviteSuccess('');
      }, 1500);
    },
    onError: (err) => {
      setInviteError(err.response?.data?.message || 'Failed to send invite. Please check user email.');
    },
  });

  const handleInviteSubmit = (e) => {
    e.preventDefault();
    if (!clientName || !clientEmail) {
      setInviteError('Please fill in all fields.');
      return;
    }
    setInviteError('');
    setInviteSuccess('');
    inviteMutation.mutate({ name: clientName, email: clientEmail });
  };

  const filteredClients = clientsList.filter((c) => {
    return (
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Mock clients if database is fresh
  const displayClients = clientsList.length > 0 ? filteredClients : [
    { _id: 'c-1', name: 'Sarah Johnson', email: 'client@demo.com', role: 'client', lastSeen: new Date(Date.now() - 3600000) },
    { _id: 'c-2', name: 'Marcus Aurelius', email: 'marcus@lumina.com', role: 'client', lastSeen: new Date(Date.now() - 86400000) },
    { _id: 'c-3', name: 'John Doe', email: 'john@doe.com', role: 'client', lastSeen: null },
  ].filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.email.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-12 w-full font-body-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-2">
            Client Directory
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Manage your agency's active clients, review invitations, and invite new project partners.
          </p>
        </div>
        <Button variant="primary" iconLeft="person_add" onClick={() => setInviteModalOpen(true)}>
          Invite Client
        </Button>
      </div>

      {/* Search Filter bar */}
      <div className="border border-outline-variant bg-surface-container-lowest p-6 rounded-DEFAULT select-none max-w-md">
        <Input
          id="search-clients"
          label="Filter Directory"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by client name or email..."
          iconLeft="search"
        />
      </div>

      {/* Clients Table Ledger */}
      <div className="space-y-6">
        <div className="border-b border-outline-variant pb-4">
          <h3 className="font-headline-md text-headline-md text-on-surface">Registered Partners</h3>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          {loadingClients ? (
            <p className="py-8 text-on-surface-variant">Loading client directory...</p>
          ) : (
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-outline-variant">
                  <th className="py-4 pr-4 font-label-md text-label-md text-on-surface-variant font-medium uppercase tracking-wider">
                    Name
                  </th>
                  <th className="py-4 px-4 font-label-md text-label-md text-on-surface-variant font-medium uppercase tracking-wider">
                    Email
                  </th>
                  <th className="py-4 px-4 font-label-md text-label-md text-on-surface-variant font-medium uppercase tracking-wider">
                    Role Status
                  </th>
                  <th className="py-4 pl-4 font-label-md text-label-md text-on-surface-variant font-medium text-right uppercase tracking-wider">
                    Last Active
                  </th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md divide-y divide-outline-variant">
                {displayClients.map((client) => {
                  return (
                    <tr key={client._id} className="hover:bg-surface-container-low transition-colors group">
                      <td className="py-4 pr-4 text-on-surface font-semibold">
                        {client.name}
                      </td>
                      <td className="py-4 px-4 text-on-surface-variant font-mono text-sm">
                        {client.email}
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant="in-progress">
                          {client.role || 'client'}
                        </Badge>
                      </td>
                      <td className="py-4 pl-4 text-right text-on-surface-variant">
                        {client.lastSeen ? new Date(client.lastSeen).toLocaleDateString(undefined, { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Never'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Invite Client Modal Dialog */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => { setInviteModalOpen(false); setInviteError(''); setInviteSuccess(''); }}
        title="Invite Client Partner"
      >
        <p className="mb-6 font-body-md text-body-md text-on-surface-variant">
          Send a premium transactional portal invitation. Your partner will receive a secure token to set up their account password dynamically.
        </p>

        <form onSubmit={handleInviteSubmit} className="space-y-6">
          {inviteError && (
            <div className="p-4 bg-error-container text-on-error-container border border-error-container font-body-md text-body-md flex items-start gap-3">
              <span className="material-symbols-outlined text-error text-[20px] mt-0.5">error</span>
              <div>
                <p className="font-semibold mb-1">Invite Failed</p>
                <p className="text-sm">{inviteError}</p>
              </div>
            </div>
          )}

          {inviteSuccess && (
            <div className="p-4 bg-secondary-container text-on-secondary-container border border-secondary-container font-body-md text-body-md flex items-start gap-3">
              <span className="material-symbols-outlined text-secondary text-[20px] mt-0.5">check_circle</span>
              <div>
                <p className="font-semibold mb-1">Sent Successfully</p>
                <p className="text-sm">{inviteSuccess}</p>
              </div>
            </div>
          )}

          <Input
            id="client-name"
            label="Client Full Name"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="e.g. Sarah Johnson"
            iconLeft="person"
            disabled={inviteMutation.isPending || !!inviteSuccess}
            required
          />

          <Input
            id="client-email"
            label="Client Email Address"
            type="email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            placeholder="name@clientcompany.com"
            iconLeft="mail"
            disabled={inviteMutation.isPending || !!inviteSuccess}
            required
          />

          <div className="flex gap-4 justify-end pt-4">
            <Button 
              variant="secondary" 
              onClick={() => { setInviteModalOpen(false); setInviteError(''); setInviteSuccess(''); }}
              disabled={inviteMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              disabled={inviteMutation.isPending || !!inviteSuccess}
            >
              {inviteMutation.isPending ? 'Sending Invite...' : 'Send Invitation'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
