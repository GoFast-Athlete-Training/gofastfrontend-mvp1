// Garmin OAuth 1.0a Configuration - matches Render environment variables
export const GARMIN_CONFIG = {
  CONSUMER_KEY: process.env.REACT_APP_GARMIN_CONSUMER_KEY || 'your_garmin_consumer_key_here',
  CONSUMER_SECRET: process.env.REACT_APP_GARMIN_CONSUMER_SECRET || 'your_garmin_consumer_secret_here',
  CALLBACK_URL: 'https://app.gofastcrushgoals.com/api/garmin/callback',
  REQUEST_TOKEN_URL: 'https://connectapi.garmin.com/oauth-service/oauth/request_token',
  ACCESS_TOKEN_URL: 'https://connectapi.garmin.com/oauth-service/oauth/access_token',
  AUTHORIZE_URL: 'https://connect.garmin.com/oauthConfirm',
  API_BASE_URL: process.env.REACT_APP_API_URL || 'https://gofastbackendv2-fall2025.onrender.com/api'
};

export default GARMIN_CONFIG;
