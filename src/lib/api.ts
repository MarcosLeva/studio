
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
    // This promise-based gatekeeper is essential to prevent multiple refresh requests firing at once.
    if (refreshTokenPromise) {
        return refreshTokenPromise;
    }

    const performRefresh = async () => {
        const storedRefreshToken = localStorage.getItem('refresh_token');
        if (!storedRefreshToken) {
            const error = new Error('No refresh token available');
            (error as any).status = 401;
            throw error; // This will be caught below
        }

        console.log("Attempting to refresh token...");
        try {
            const response = await fetch(`${getApiUrl()}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: storedRefreshToken }),
            });
            
            // handleResponse will throw an error for non-2xx responses, which will be caught below.
            const responseData = await handleResponse(response);
            const nestedData = responseData.data;

            if (!nestedData || !nestedData.access_token) {
              const error = new Error('Invalid refresh response from API: missing access_token.');
              (error as any).status = 500;
              throw error;
            }
            
            console.log("Token refreshed successfully. Setting new access token.");
            setToken(nestedData.access_token);
            
            return responseData; // Return the full data so the caller can use it (e.g., store.tsx on load)
        } catch (error: any) {
            // If the error is 401, it's a definitive auth failure.
            if (error.status === 401) {
                console.error('Refresh token is invalid. Logging out.', error);
                onAuthFailure(); // Trigger the logout flow in the store
            } else {
                // For other errors (network, 500), just log it. The session is not necessarily dead.
                console.error('An error occurred during token refresh, but not logging out.', error);
            }
            throw error; // Propagate the error to the original caller of `request`
        }
    };
    
    refreshTokenPromise = performRefresh().finally(() => {
        // Once the promise is settled (resolved or rejected), clear it to allow future refreshes.
        refreshTokenPromise = null;
    });

    return refreshTokenPromise;
};

export const refreshSession = refreshToken;

// Generic request handler with automatic token refresh.
const request = async (endpoint: string, options: RequestInit = {}) => {
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

  let response = await makeRequest(accessToken);

  if (response.status === 401 && endpoint !== '/auth/refresh') {
    try {
      console.log(`Request to ${endpoint} failed with 401. Refreshing token...`);
      await refreshToken();
      
      console.log(`Retrying request to ${endpoint} with new token.`);
      response = await makeRequest(accessToken);
    } catch (refreshError: any) {
        console.error("Failed to refresh token, the original request will fail.", refreshError);
        // The error from refreshToken will propagate, so the caller of request() will see it.
        // The onAuthFailure() is handled inside refreshToken itself.
        throw refreshError;
    }
  }

  return handleResponse(response);
};


export const api = {
    get: (endpoint: string) => request(endpoint, { method: 'GET' }),
    post: (endpoint: string, body: unknown) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
};
