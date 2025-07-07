
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
// We can't import the store here, so we'll pass the logout function from the store.
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
            // If the refresh endpoint itself fails (e.g., token is invalid),
            // it's a definitive authentication failure.
            throw new Error('Failed to refresh token.');
        }
        const data = await handleResponse(response);
        setToken(data.access_token);
        console.log("Token refreshed successfully.");
        return data;
    })
    .catch(error => {
        console.error('Session refresh failed:', error);
        onAuthFailure(); // Trigger logout
        throw error; // Propagate the error
    })
    .finally(() => {
        refreshTokenPromise = null; // Clear the promise for the next time
    });

    return refreshTokenPromise;
}

// Generic request handler
const request = async (endpoint: string, options: RequestInit = {}) => {
    let headers = new Headers(options.headers);
    if (!headers.has('Content-Type') && options.body) {
        headers.set('Content-Type', 'application/json');
    }

    if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`);
    }

    let response = await fetch(`${getApiUrl()}${endpoint}`, { ...options, headers });

    // If token expired, try to refresh it and retry the request once.
    if (response.status === 401) {
        console.log(`Request to ${endpoint} failed with 401. Attempting token refresh.`);
        try {
            const refreshData = await refreshToken();
            
            // Update headers with the new token and retry
            headers.set('Authorization', `Bearer ${refreshData.access_token}`);
            console.log(`Retrying request to ${endpoint} with new token.`);
            response = await fetch(`${getApiUrl()}${endpoint}`, { ...options, headers });

        } catch (error) {
            console.error('Could not refresh token after 401. Aborting request.', error);
            // The `refreshToken` function already calls onAuthFailure.
            // Re-throw the error to stop the current operation.
            throw new Error("Su sesión ha expirado. Por favor, inicie sesión de nuevo.");
        }
    }

    return handleResponse(response);
};

// Helper to parse response and handle non-OK statuses.
const handleResponse = async (response: Response) => {
    const text = await response.text();
    const json = text ? JSON.parse(text) : {};

    if (!response.ok) {
        const errorMessage = json.message || `Error: ${response.status} ${response.statusText}`;
        const error = new Error(errorMessage);
        (error as any).status = response.status;
        throw error;
    }
    
    // Some APIs wrap their data in a `data` property. Others return it directly.
    return json.data ?? json;
}

export const api = {
    get: (endpoint: string) => request(endpoint, { method: 'GET' }),
    post: (endpoint: string, body: unknown) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
    refreshSession: refreshToken,
};
