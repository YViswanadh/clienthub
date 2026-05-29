import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../lib/axios';

export default function Settings() {
  const queryClient = useQueryClient();

  // Modal State
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // Form states
  const [brandColor, setBrandColor] = useState('#534AB7');
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);

  // Queries
  const { data: agency = {} } = useQuery({
    queryKey: ['agency'],
    queryFn: async () => {
      const response = await axios.get('/agency');
      return response.data;
    },
  });

  const { data: clients = [], refetch: refetchClients } = useQuery({
    queryKey: ['agency-clients'],
    queryFn: async () => {
      const response = await axios.get('/agency/clients');
      return response.data;
    },
  });

  // Sync agency data to state
  useEffect(() => {
    if (agency.brandColor) {
      setBrandColor(agency.brandColor);
    }
    if (agency.logo) {
      setLogoPreview(agency.logo);
    }
  }, [agency]);

  // Mutations
  const updateAgencyBranding = useMutation({
    mutationFn: async (payload) => {
      const response = await axios.put('/agency', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency'] });
      alert('Branding saved successfully!');
    },
  });

  const uploadLogoMutation = useMutation({
    mutationFn: async (formData) => {
      const response = await axios.post('/agency/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['agency'] });
      if (data.logo) {
        setLogoPreview(data.logo);
      }
      alert('Logo uploaded successfully!');
    },
  });

  const inviteClientMutation = useMutation({
    mutationFn: async (inviteData) => {
      const response = await axios.post('/auth/invite', inviteData);
      return response.data;
    },
    onSuccess: () => {
      setInviteSuccess(true);
      setInviteName('');
      setInviteEmail('');
      refetchClients();
      setTimeout(() => {
        setInviteSuccess(false);
        setInviteModalOpen(false);
      }, 1500);
    },
  });

  const handleLogoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));

      const formData = new FormData();
      formData.append('logo', file);
      uploadLogoMutation.mutate(formData);
    }
  };

  const handleSaveBranding = (e) => {
    e.preventDefault();
    updateAgencyBranding.mutate({ brandColor });
  };

  const handleInviteSubmit = (e) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;
    inviteClientMutation.mutate({ name: inviteName, email: inviteEmail });
  };

  return (
    <div>
      <div>
        <h1>Settings</h1>
        <p>Configure agency branding colors, corporate logos, and team invitations</p>
      </div>

      <hr />

      <div>
        <div>
          <h3>Agency Visual Identity</h3>
          <p>Customize your corporate logo and theme color picker.</p>

          <form onSubmit={handleSaveBranding}>
            <div>
              <label>Corporate Brand Logo: </label>
              {logoPreview ? (
                <img src={logoPreview} alt="Agency logo" style={{ maxWidth: 80, display: 'block', margin: '10px 0' }} />
              ) : (
                <p>[No Logo Uploaded]</p>
              )}
              <input
                id="logo_upload"
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
              />
            </div>

            <br />

            <div>
              <label htmlFor="brand_color_picker">Brand Color Accent: </label>
              <input
                id="brand_color_picker"
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
              />
              <input
                type="text"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
              />
            </div>

            <br />
            <button type="submit" disabled={updateAgencyBranding.isPending}>
              {updateAgencyBranding.isPending ? 'Saving...' : 'Save Branding'}
            </button>
          </form>
        </div>

        <hr />

        <div>
          <div>
            <h3>Clients Workspace</h3>
            <button onClick={() => setInviteModalOpen(true)}>[Invite Client]</button>
          </div>

          <div>
            {clients.length === 0 ? (
              <p>No client accounts invited yet.</p>
            ) : (
              <ul>
                {clients.map((client, idx) => (
                  <li key={client.id || client._id || idx}>
                    <strong>{client.name}</strong> ({client.email})
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {inviteModalOpen && (
        <div style={{ border: '1px solid black', padding: '20px', margin: '20px 0' }}>
          <h3>Invite Portal Client</h3>
          {inviteSuccess ? (
            <p style={{ color: 'green' }}><strong>Success!</strong> Invitation sent successfully.</p>
          ) : (
            <form onSubmit={handleInviteSubmit}>
              <div>
                <label htmlFor="client_invite_name">Client Full Name: </label>
                <input
                  id="client_invite_name"
                  placeholder="e.g. John Doe"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="client_invite_email">Client Email Address: </label>
                <input
                  id="client_invite_email"
                  type="email"
                  placeholder="name@company.com"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>

              <div style={{ marginTop: '10px' }}>
                <button type="button" onClick={() => setInviteModalOpen(false)}>Cancel</button>
                <button type="submit" disabled={inviteClientMutation.isPending}>
                  {inviteClientMutation.isPending ? 'Inviting...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
