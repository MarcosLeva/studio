
"use client";

import {toast} from '@/hooks/use-toast';

// This will hold the in-memory access token, initialized from sessionStorage.
let accessToken: string | null =
  typeof window !== 'undefined' ? sessionStorage.getItem('access_token') : null;

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
  console.log("Setting new access token:", token ? "Token received" : "Token cleared");
  accessToken = token;
  if (token) {
    sessionStorage.setItem('access_token', token);
  } else {
    sessionStorage.removeItem('access_token');
  }
};

// Helper to parse response and handle non-OK statuses.
const handleResponse = async (response: Response) => {
    const text = await response.text();
    let json;
    try {
        json = text ? JSON.parse(text) : {};
    } catch(e) {
        console.error("Failed to parse JSON response:", text);
        const error = new Error("Invalid JSON response from server.");
        (error as any).status = response.status;
        throw error;
    }
    
    if (!response.ok) {
        const errorMessage = json?.data?.message || json?.message || `Error: ${response.status} ${response.statusText}`;
        const error = new Error(errorMessage);
        (error as any).status = response.status;
        throw error;
    }
    
    return json;
}

// This function is the core of the refresh logic.
const refreshToken = async () => {
    // This promise-based gatekeeper prevents multiple refresh requests from firing at once.
    if (refreshTokenPromise) {
        return refreshTokenPromise;
    }

    const performRefresh = async () => {
        const storedRefreshToken = localStorage.getItem('refresh_token');
        if (!storedRefreshToken) {
            const error = new Error('No refresh token available');
            (error as any).status = 401; // Treat as auth failure
            throw error;
        }

        console.log("Attempting to refresh token...");
        try {
            const response = await fetch(`${getApiUrl()}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: storedRefreshToken }),
            });
            
            const responseData = await handleResponse(response);
            const nestedData = responseData.data ?? responseData;

            if (!nestedData.access_token || !nestedData.user) {
              const error = new Error('Invalid refresh response from API: missing access_token or user.');
              (error as any).status = 500;
              throw error;
            }
            
            console.log("Token refreshed successfully. Setting new access token.");
            setToken(nestedData.access_token);
            
            return responseData;
        } catch (error: any) {
            // If the refresh call itself fails with 401, it's a definitive auth failure.
            if (error.status === 401) {
                console.error('Refresh token is invalid. Logging out.', error);
                onAuthFailure();
            } else {
                // For other errors (network, 500), just log it. The session is not necessarily dead.
                console.error('An error occurred during token refresh:', error);
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
  // This inner function prepares and sends the request, always using the current accessToken.
  const makeTheRequest = async () => {
    const headers = new Headers(options.headers);
    if (!headers.has('Content-Type') && options.body) {
      headers.set('Content-Type', 'application/json');
    }
    // Always use the current accessToken from the module scope.
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
    return fetch(`${getApiUrl()}${endpoint}`, { ...options, headers });
  };

  // First attempt to make the request.
  let response = await makeTheRequest();

  // If the first attempt fails with 401, try to refresh the token and then retry.
  if (response.status === 401 && endpoint !== '/auth/refresh') {
    console.log(`Request to ${endpoint} received 401. Attempting token refresh.`);
    try {
      // This will update the module-level 'accessToken' variable upon success.
      await refreshToken();
      
      console.log(`Token refreshed. Retrying request to ${endpoint}.`);
      // Second attempt with the (hopefully) new token.
      response = await makeTheRequest();
    } catch (refreshError: any) {
      console.error("Token refresh failed. The original request will not be retried.", refreshError);
      // If refreshToken() fails, it throws an error which we propagate to the UI.
      // The onAuthFailure() logic is handled within refreshToken().
      throw refreshError;
    }
  }
  
  // This will process the final response, whether it's from the first or second attempt.
  // It will throw an error for any non-OK status, which is then caught by the calling function in the UI.
  return handleResponse(response);
};


export const api = {
    get: (endpoint: string) => request(endpoint, { method: 'GET' }),
    post: (endpoint: string, body: unknown) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
};
