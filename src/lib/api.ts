
import {toast} from '@/hooks/use-toast';

// This will hold the in-memory access token.
let accessToken: string | null = null;
// This will prevent multiple simultaneous refresh requests.
let refreshTokenPromise: Promise<any> | null = null;

const getApiUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiUrl) {
    console.error('API base URL is not configured.');
    toast({
      variant: 'destructive',
      title: 'Error de Configuración',
      description:
        'La URL de la API no está configurada. Por favor, contacta al administrador.',
    });
    throw new Error('API_BASE_URL is not defined.');
  }
  return apiUrl;
};

// Function to be called from the UI to trigger a logout.
let onAuthFailure: () => void = () => {};
export const setOnAuthFailure = (callback: () => void) => {
    onAuthFailure = callback;
};

export const setToken = (token: string | null) => {
  accessToken = token;
};

// Helper to parse response and handle non-OK statuses.
const handleResponse = async (response: Response) => {
    const text = await response.text();
    // Use a try-catch block for robust JSON parsing.
    let json;
    try {
        json = text ? JSON.parse(text) : {};
    } catch(e) {
        console.error("Failed to parse JSON response:", text);
        // Create a generic error if JSON parsing fails
        const error = new Error("Invalid JSON response from server.");
        (error as any).status = response.status;
        throw error;
    }
    
    if (!response.ok) {
        // Attempt to get a meaningful error message from the parsed JSON.
        const errorMessage = json?.data?.message || json?.message || `Error: ${response.status} ${response.statusText}`;
        const error = new Error(errorMessage);
        (error as any).status = response.status;
        throw error;
    }
    
    return json;
}

// This function is the core of the refresh logic.
const refreshToken = async () => {
    if (refreshTokenPromise) {
        return refreshTokenPromise;
    }
    
    const storedRefreshToken = localStorage.getItem('refresh_token');
    if (!storedRefreshToken) {
        const error = new Error('No refresh token available');
        (error as any).status = 401;
        return Promise.reject(error);
    }

    console.log("Attempting to refresh token...");

    refreshTokenPromise = fetch(`${getApiUrl()}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: storedRefreshToken }),
    })
    .then(async response => {
        const responseData = await handleResponse(response);
        const nestedData = responseData.data;

        if (!nestedData || !nestedData.access_token || !nestedData.user) {
          const error = new Error('Invalid refresh response from API.');
          (error as any).status = 500; // Treat as a server-side issue, not an auth failure
          throw error;
        }
        
        setToken(nestedData.access_token);
        console.log("Token refreshed successfully.");
        return responseData;
    })
    .catch(error => {
        // Re-throw the error to be handled by the original caller.
        throw error;
    })
    .finally(() => {
        // Clear the promise once it's settled to allow future refreshes.
        refreshTokenPromise = null;
    });

    return refreshTokenPromise;
}

// Expose the refresh function for initial app load validation.
export const refreshSession = refreshToken;

// Generic request handler with automatic token refresh.
const request = async (endpoint: string, options: RequestInit = {}) => {
  // Helper function to create and execute a fetch request with the correct headers.
  const makeRequest = async (token: string | null) => {
    const headers = new Headers(options.headers);
    if (!headers.has('Content-Type') && options.body) {
      headers.set('Content-Type', 'application/json');
    }
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return fetch(`${getApiUrl()}${endpoint}`, { ...options, headers });
  };

  // Make the initial request with the current token.
  let response = await makeRequest(accessToken);

  // If unauthorized (401), and it's not a refresh call itself, try to refresh the token.
  if (response.status === 401 && endpoint !== '/auth/refresh') {
    try {
      console.log(`Request to ${endpoint} failed with 401. Refreshing token...`);
      await refreshToken();
      
      // Retry the request with the new access token.
      console.log(`Retrying request to ${endpoint} with new token.`);
      response = await makeRequest(accessToken);
    } catch (refreshError: any) {
      // If the refresh itself fails with 401, it's a definitive auth failure.
      if (refreshError?.status === 401) {
        console.error('Refresh token is invalid. Logging out.', refreshError);
        onAuthFailure();
      } else {
        // For any other error during refresh (e.g., network), don't log out.
        console.error('An error occurred during token refresh. Session will be kept.', refreshError);
      }
      // Re-throw the error to stop the original request flow.
      throw refreshError;
    }
  }

  // Parse and return the final response.
  return handleResponse(response);
};

export const api = {
    get: (endpoint: string) => request(endpoint, { method: 'GET' }),
    post: (endpoint: string, body: unknown) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
};
