// API Configuration for different environments
export const API_BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:3000';

// In production, use relative URLs since client and server are on same domain
// In development, use localhost:3000 for the server
