// Configuration for Page Content Saver extension
const CONFIG = {
  // API endpoint base URL - change this when your domain changes
  API_BASE_URL: "https://mercury.cosmo.it.com",

  // API endpoints
  ENDPOINTS: {
    NOTE: "/api/note",
  },

  // Version
  VERSION: "1.0.0",
};

// Helper function to get full API URL for an endpoint
function getApiUrl(endpoint) {
  return CONFIG.API_BASE_URL + endpoint;
}
