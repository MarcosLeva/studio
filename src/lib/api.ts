
"use client";

import {toast} from '@/hooks/use-toast';

// This will hold the in-memory access token, initialized from sessionStorage.
let accessToken: string | null =
  typeof window !== 'undefined' ? sessionStorage.getItem('access_token') : null;

// This will prevent multiple simultaneous refresh requests.
let refreshTokenPromise: Promise<void> | null = null;

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
  if (token) {
    sessionStorage.setItem('access_token', token);
  } else {
    sessionStorage.removeItem('access_token');
  }
};

// Helper to parse response and handle non-OK statuses.
const handleResponse = async (response: Response) => {
    let responseData;
    // Check if the response is JSON, otherwise treat as text/html
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        responseData = await response.json();
    } else {
        // If not json, just get the text. The logic that calls this will need to handle it.
        responseData = { data: await response.text() };
    }

    if (!response.ok) {
        // Use the message from the API error response, or create a generic one.
        const errorMessage = responseData.message || `Error: ${response.status} ${response.statusText}`;
        const error = new Error(errorMessage);
        (error as any).status = response.status;
        throw error;
    }
    
    return responseData;
}


// This function is the core of the refresh logic.
const refreshToken = async (): Promise<void> => {
    // This promise-based gatekeeper prevents multiple refresh requests from firing at once.
    if (refreshTokenPromise) {
        return refreshTokenPromise;
    }

    const performRefresh = async () => {
        const storedRefreshToken = localStorage.getItem('refresh_token');
        if (!storedRefreshToken) {
            const error = new Error('No refresh token available');
            (error as any).status = 401;
            throw error;
        }

        console.log("Attempting to refresh token...");
        try {
            const responseData = await request('/auth/refresh', {
                method: 'POST',
                body: JSON.stringify({ refresh_token: storedRefreshToken }),
            });
            
            const nestedData = responseData.data;

            if (!nestedData || !nestedData.access_token || !nestedData.refresh_token) {
              const error = new Error('Invalid refresh response from API: missing tokens.');
              (error as any).status = 500;
              throw error;
            }
            
            console.log("Token refreshed successfully. Setting new tokens.");
            setToken(nestedData.access_token);
            localStorage.setItem('refresh_token', nestedData.refresh_token);
            
        } catch (error: any) {
            if (error.status === 401) {
                console.error('Refresh token is invalid. Logging out.', error);
                onAuthFailure();
            }
            // rethrow the error so the original request knows it failed.
            throw error;
        }
    };
    
    refreshTokenPromise = performRefresh().finally(() => {
        refreshTokenPromise = null;
    });

    return refreshTokenPromise;
};

export const refreshSession = refreshToken;

// Generic request handler with automatic token refresh.
const request = async (endpoint: string, options: RequestInit = {}) => {
  const makeTheRequest = async () => {
    // Re-read accessToken from sessionStorage before each request
    accessToken = sessionStorage.getItem('access_token'); 
    const headers = new Headers(options.headers);
    // Do not set Content-Type for FormData, browser does it automatically with boundary.
    if (!(options.body instanceof FormData)) {
        if (!headers.has('Content-Type') && options.body) {
            headers.set('Content-Type', 'application/json');
        }
    }
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
    return fetch(`${getApiUrl()}${endpoint}`, { ...options, headers });
  };

  let response = await makeTheRequest();

  if (response.status === 401 && endpoint !== '/auth/refresh' && endpoint !== '/auth/login') {
    console.log(`Request to ${endpoint} received 401. Attempting token refresh.`);
    try {
      await refreshToken();
      console.log(`Token refreshed. Retrying request to ${endpoint}.`);
      response = await makeTheRequest();
    } catch (refreshError: any) {
      console.error("Token refresh failed. The original request will not be retried.", refreshError);
      throw refreshError;
    }
  }
  
  return handleResponse(response);
};


export const api = {
    get: (endpoint: string) => request(endpoint, { method: 'GET' }),
    post: (endpoint: string, body: unknown) => {
        const options: RequestInit = {
            method: 'POST',
            body: body instanceof FormData ? body : JSON.stringify(body),
        };
        return request(endpoint, options);
    },
    put: (endpoint: string, body: unknown) => request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (endpoint: string) => request(endpoint, { method: 'DELETE' }),
};

    