// Garmin OAuth 2.0 PKCE Configuration - matches Render environment variables
export const GARMIN_CONFIG = {
  CLIENT_ID: process.env.REACT_APP_GARMIN_CLIENT_ID || 'your_garmin_client_id_here',
  CLIENT_SECRET: process.env.REACT_APP_GARMIN_CLIENT_SECRET || 'your_garmin_client_secret_here',
  CALLBACK_URL: 'https://athlete.gofastcrushgoals.com/garmin/callback',
  AUTHORIZE_URL: 'https://connect.garmin.com/oauth2Confirm',
  TOKEN_URL: 'https://diauth.garmin.com/di-oauth2-service/oauth/token',
  API_BASE_URL: process.env.REACT_APP_API_URL || 'https://gofastbackendv2-fall2025.onrender.com/api',
  
  // Webhook URLs for Garmin Developer Portal
  WEBHOOK_URLS: {
    // Activity Webhooks
    ACTIVITY: 'https://athlete.gofastcrushgoals.com/garmin/activity',
    ACTIVITY_DETAILS: 'https://athlete.gofastcrushgoals.com/garmin/details',
    ACTIVITY_FILES: 'https://athlete.gofastcrushgoals.com/garmin/activity-files',
    ACTIVITY_MANUAL: 'https://athlete.gofastcrushgoals.com/garmin/activity-manual',
    MOVEIQ: 'https://athlete.gofastcrushgoals.com/garmin/moveiq',
    
    // Common Webhooks
    DEREGISTRATION: 'https://athlete.gofastcrushgoals.com/garmin/deregistration',
    PERMISSIONS: 'https://athlete.gofastcrushgoals.com/garmin/permissions',
    
    // General fallback
    GENERAL: 'https://athlete.gofastcrushgoals.com/garmin/webhook'
  }
};

export default GARMIN_CONFIG;
