import { Agency } from '../models/Agency.js';
import { ApiError } from '../utils/apiError.js';

export const tenancy = async (req, res, next) => {
  try {
    let subdomain = req.hostname.split('.')[0];

    // In local development (localhost), fallback to using the X-Agency-Subdomain header
    const isLocalhost = 
      req.hostname === 'localhost' || 
      req.hostname === '127.0.0.1' || 
      req.hostname.includes('localhost');
      
    if (isLocalhost && req.headers['x-agency-subdomain']) {
      subdomain = req.headers['x-agency-subdomain'];
    }

    if (!subdomain) {
      throw new ApiError(400, 'Subdomain is required');
    }

    const agency = await Agency.findOne({ subdomain: subdomain.toLowerCase() });
    if (!agency) {
      throw new ApiError(404, 'Agency not found');
    }

    req.agency = agency;
    next();
  } catch (error) {
    next(error);
  }
};
