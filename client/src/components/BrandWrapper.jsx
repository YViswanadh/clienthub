import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from '../lib/axios';
import useAuth from '../hooks/useAuth';

export default function BrandWrapper({ children }) {
  const { user } = useAuth();

  // Fetch agency profile details (including brand color and logo)
  const { data: agencyData } = useQuery({
    queryKey: ['agency'],
    queryFn: async () => {
      const response = await axios.get('/agency');
      return response.data;
    },
    enabled: !!user, // Only fetch if user is logged in
    retry: false,
  });

  useEffect(() => {
    // Default brand color is #534AB7 if not set
    const brandColor = agencyData?.brandColor || '#534AB7';
    document.documentElement.style.setProperty('--brand-color', brandColor);

    // Generate lighter background variation from primary hex color
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
          }
        : null;
    };

    const rgb = hexToRgb(brandColor);
    if (rgb) {
      document.documentElement.style.setProperty(
        '--brand-color-light',
        `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`
      );
    } else {
      document.documentElement.style.setProperty(
        '--brand-color-light',
        '#EEEDFE'
      );
    }
  }, [agencyData]);

  return <>{children}</>;
}
