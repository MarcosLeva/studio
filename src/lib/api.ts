
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
    // If a refresh is already in progress, wait for it to complete.
    if (refreshTokenPromise) {
        return refreshTokenPromise;
    }
    
    const storedRefreshToken = localStorage.getItem('refresh_token');
    if (!storedRefreshToken) {
        return Promise.reject({ status: 401, message: 'No refresh token available' });
    }

    console.log("Attempting to refresh token...");

    // Start the refresh request and store the promise.
    refreshTokenPromise = fetch(`${getApiUrl()}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: storedRefreshToken }),
    })
    .then(async response => {
        // handleResponse throws on non-ok status, which will be caught below.
        const responseData = await handleResponse(response);
        const nestedData = responseData.data;

        if (!nestedData || !nestedData.access_token || !nestedData.user) {
          throw new Error('Invalid refresh response from API.');
        }
        
        setToken(nestedData.access_token);
        console.log("Token refreshed successfully.");
        return responseData;
    })
    .catch(error => {
        // The catch block runs if fetch fails or handleResponse throws.
        // We re-throw the error to be handled by the original caller.
        throw error;
    })
    .finally(() => {
        // Clear the promise once it's settled.
        refreshTokenPromise = null;
    });

    return refreshTokenPromise;
}

// Expose the refresh function for initial app load validation.
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

    // If the access token has expired (401), try to refresh it and retry the request once.
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
            // This catch block runs if refreshToken() itself fails (e.g., with a 401).
            // This is the correct moment to declare the session invalid and log out.
            console.error('Session is invalid and could not be refreshed. Logging out.', error);
            onAuthFailure();
            // Re-throw the error to stop the original request flow and notify the caller.
            throw error;
        }
    }

    return handleResponse(response);
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

export const api = {
    get: (endpoint: string) => request(endpoint, { method: 'GET' }),
    post: (endpoint: string, body: unknown) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
};
