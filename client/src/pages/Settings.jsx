import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../lib/axios';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import {
  Palette,
  Upload,
  Users,
  Building,
  Mail,
  Send,
  Plus,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';

export default function Settings() {
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
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

  // Live CSS variable updates when color changes!
  useEffect(() => {
    document.documentElement.style.setProperty('--brand-color', brandColor);
    
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };
    
    const rgb = hexToRgb(brandColor);
    if (rgb) {
      document.documentElement.style.setProperty(
        '--brand-color-light',
        `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`
      );
    }
  }, [brandColor]);

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
      // POST /api/auth/invite -> { name, email }
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

      // Auto-upload Logo using FormData
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
    <div className="min-h-screen bg-[#F8F8F8] pb-12">
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
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Title Header */}
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#111111] font-sans m-0">Settings</h1>
              <p className="text-xs text-[#6B7280]">
                Configure agency branding colors, corporate logos, and team invitations
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Branding Section */}
              <div className="md:col-span-2 space-y-6">
                
                {/* Branding Setup */}
                <Card className="border border-gray-100 bg-white rounded-xl shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold text-[#111111] flex items-center gap-1.5">
                      <Palette className="h-4.5 w-4.5 text-primary" />
                      Agency Visual Identity
                    </CardTitle>
                    <CardDescription className="text-xs text-[#6B7280]">
                      Customize your corporate logo and theme color picker. Updates live across the app.
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    {/* Logo Section */}
                    <div className="space-y-3">
                      <Label className="text-xs font-semibold text-[#6B7280]">Corporate Brand Logo</Label>
                      <div className="flex items-center gap-6">
                        {/* Logo Preview Container */}
                        <div className="h-20 w-20 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center relative group">
                          {logoPreview ? (
                            <img src={logoPreview} alt="Agency logo" className="h-full w-full object-contain p-2" />
                          ) : (
                            <Building className="h-8 w-8 text-[#6B7280]" />
                          )}
                        </div>

                        {/* File Action */}
                        <div className="space-y-1">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('logo_upload').click()}
                            className="flex items-center gap-1.5 text-xs border-gray-200 hover:bg-gray-50 text-[#6B7280] rounded-lg"
                          >
                            <Upload className="h-4 w-4" />
                            Upload Logo
                          </Button>
                          <input
                            id="logo_upload"
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleLogoChange}
                          />
                          <p className="text-[10px] text-[#6B7280]">Square PNG, JPG, or SVG up to 2MB</p>
                        </div>
                      </div>
                    </div>

                    {/* Color Section */}
                    <form onSubmit={handleSaveBranding} className="space-y-4 pt-4 border-t border-gray-50">
                      <div className="space-y-2">
                        <Label htmlFor="brand_color_picker" className="text-xs font-semibold text-[#6B7280]">
                          Brand Color Accent
                        </Label>
                        <div className="flex items-center gap-3">
                          <Input
                            id="brand_color_picker"
                            type="color"
                            value={brandColor}
                            onChange={(e) => setBrandColor(e.target.value)}
                            className="h-10 w-16 p-1 rounded-lg cursor-pointer border-gray-200"
                          />
                          <Input
                            type="text"
                            value={brandColor}
                            onChange={(e) => setBrandColor(e.target.value)}
                            className="w-28 rounded-lg text-sm uppercase text-center focus-visible:ring-primary border-gray-200 font-semibold"
                          />
                        </div>
                        <p className="text-[10px] text-[#6B7280]">Select accent base hue. Lighter highlights generate automatically.</p>
                      </div>

                      <div className="pt-2">
                        <Button
                          type="submit"
                          disabled={updateAgencyBranding.isPending}
                          className="bg-primary hover:bg-primary/95 text-white rounded-lg text-xs font-semibold px-6 shadow-sm"
                        >
                          {updateAgencyBranding.isPending ? 'Saving...' : 'Save Branding'}
                        </Button>
                      </div>
                    </form>

                  </CardContent>
                </Card>
              </div>

              {/* Client Invitations / Team Members List */}
              <div className="space-y-6">
                
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-[#111111] flex items-center gap-1.5">
                    <Users className="h-4.5 w-4.5 text-primary" />
                    Clients Workspace
                  </h3>

                  <Button
                    onClick={() => setInviteModalOpen(true)}
                    size="sm"
                    className="bg-primary hover:bg-primary/95 text-white rounded-lg text-[10px] uppercase font-bold py-1.5 px-3"
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Invite
                  </Button>
                </div>

                <Card className="border border-gray-100 bg-white rounded-xl shadow-sm p-4 space-y-4 max-h-[415px] overflow-y-auto">
                  {clients.length === 0 ? (
                    <div className="text-center py-8 text-xs text-[#6B7280]">
                      No client accounts invited yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {clients.map((client, idx) => (
                        <div
                          key={client.id || client._id || idx}
                          className="flex items-center gap-3 border border-gray-50 rounded-xl p-3 bg-gray-50/40"
                        >
                          <div className="h-8 w-8 rounded-full bg-primary-light text-primary flex items-center justify-center font-bold text-xs">
                            {client.name ? client.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'CL'}
                          </div>
                          
                          <div className="space-y-0.5 min-w-0">
                            <p className="text-xs font-bold text-[#111111] truncate">{client.name}</p>
                            <p className="text-[10px] text-[#6B7280] truncate">{client.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

              </div>

            </div>

          </div>
        </main>
      </div>

      {/* Invite Client Dialog Modal */}
      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent className="sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#111111] flex items-center gap-1.5">
              <Mail className="h-5 w-5 text-primary" />
              Invite Portal Client
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B7280]">
              Send an email invite link to join ClientHub project timelines
            </DialogDescription>
          </DialogHeader>

          {inviteSuccess ? (
            <div className="flex flex-col items-center justify-center py-6 space-y-2 animate-fadeIn">
              <CheckCircle2 className="h-10 w-10 text-[#10B981]" />
              <p className="text-sm font-bold text-[#111111]">Invitation Sent!</p>
              <p className="text-xs text-[#6B7280]">Sending portal invitation email...</p>
            </div>
          ) : (
            <form onSubmit={handleInviteSubmit} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label htmlFor="client_invite_name" className="text-xs font-semibold text-[#6B7280]">Client Full Name</Label>
                <Input
                  id="client_invite_name"
                  placeholder="e.g. John Doe"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="rounded-lg text-sm focus-visible:ring-primary border-gray-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="client_invite_email" className="text-xs font-semibold text-[#6B7280]">Client Email Address</Label>
                <Input
                  id="client_invite_email"
                  type="email"
                  placeholder="name@company.com"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="rounded-lg text-sm focus-visible:ring-primary border-gray-200"
                />
              </div>

              <DialogFooter className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setInviteModalOpen(false)}
                  className="rounded-lg text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={inviteClientMutation.isPending}
                  className="bg-primary hover:bg-primary/95 text-white rounded-lg text-xs px-6 flex items-center gap-1"
                >
                  <Send className="h-3.5 w-3.5" />
                  {inviteClientMutation.isPending ? 'Inviting...' : 'Send Invitation'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
