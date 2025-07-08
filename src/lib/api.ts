
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
// This decouples the API client from the UI state management.
let onAuthFailure: () => void = () => {};
export const setOnAuthFailure = (callback: () => void) => {
    onAuthFailure = callback;
};

export const setToken = (token: string | null) => {
  accessToken = token;
};

// This function is the core of the refresh logic.
const refreshToken = async () => {
    if (refreshTokenPromise) {
        return refreshTokenPromise;
    }

    const storedRefreshToken = localStorage.getItem('refresh_token');
    if (!storedRefreshToken) {
        return Promise.reject(new Error('No refresh token available.'));
    }

    console.log("Attempting to refresh token...");

    refreshTokenPromise = fetch(`${getApiUrl()}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: storedRefreshToken }),
    })
    .then(async response => {
        if (!response.ok) {
            const error = new Error('Failed to refresh token.');
            (error as any).status = response.status;
            throw error;
        }
        const data = await handleResponse(response);
        if (!data.access_token) {
          throw new Error('Invalid refresh response from API.');
        }
        setToken(data.access_token);
        console.log("Token refreshed successfully.");
        return data;
    })
    .finally(() => {
        refreshTokenPromise = null;
    });

    return refreshTokenPromise;
}

// Expose the refresh function for initial app load validation
export const refreshSession = refreshToken;

// Generic request handler with automatic token refresh.
const request = async (endpoint: string, options: RequestInit = {}) => {
    let headers = new Headers(options.headers);
    if (!headers.has('Content-Type') && options.body) {
        headers.set('Content-Type', 'application/json');
    }

    if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`);
    }

    let response = await fetch(`${getApiUrl()}${endpoint}`, { 
        ...options, 
        headers,
    });

    // If the access token has expired, try to refresh it and retry the request once.
    if (response.status === 401) {
        console.log(`Request to ${endpoint} failed with 401. Attempting token refresh.`);
        try {
            await refreshToken();
            
            // Update headers with the new token and retry the original request.
            headers.set('Authorization', `Bearer ${accessToken}`);
            console.log(`Retrying request to ${endpoint} with new token.`);
            response = await fetch(`${getApiUrl()}${endpoint}`, { 
                ...options, 
                headers,
            });

        } catch (error: any) {
            // This catch block runs if refreshToken() fails.
            // This is the correct moment to declare the session invalid and log out.
            if (error.status === 401) {
                console.error('Session is invalid and could not be refreshed. Logging out.', error);
                onAuthFailure();
            }
            // Re-throw the error to stop the original request flow.
            throw error;
        }
    }

    return handleResponse(response);
};

// Helper to parse response and handle non-OK statuses.
const handleResponse = async (response: Response) => {
    const text = await response.text();
    const json = text ? JSON.parse(text) : {};

    if (!response.ok) {
        const errorMessage = (json as any).message || `Error: ${response.status} ${response.statusText}`;
        const error = new Error(errorMessage);
        (error as any).status = response.status;
        throw error;
    }
    
    // API responses can wrap data in a `data` property or return it directly.
    return (json as any).data ?? json;
}

export const api = {
    get: (endpoint: string) => request(endpoint, { method: 'GET' }),
    post: (endpoint: string, body: unknown) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
};
