
import {toast} from '@/hooks/use-toast';

let accessToken: string | null = null;
let isRefreshing = false;
let failedQueue: { resolve: (value?: unknown) => void; reject: (reason?: any) => void; }[] = [];

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

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const setToken = (token: string | null) => {
  accessToken = token;
};

const handleResponse = async (response: Response) => {
    // If we get a 401, reject immediately so the caller can handle the refresh logic.
    if (response.status === 401) {
        return Promise.reject(response);
    }

    const text = await response.text();
    // Handle empty response body
    const json = text ? JSON.parse(text) : {};

    if (!response.ok) {
        throw new Error(json.message || `Error: ${response.statusText}`);
    }
    
    // Check for the success property from our specific API structure
    if (json.success === false) {
      throw new Error(json.message || 'La API indicó un fallo en la operación.');
    }

    // Return the "data" property as per the API structure
    return json.data;
}

const refreshToken = async () => {
    if (isRefreshing) {
        return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
        });
    }

    isRefreshing = true;

    try {
        const url = `${getApiUrl()}/auth/refresh`;
        const response = await fetch(url, {
            method: 'POST',
            credentials: 'include', // This sends the HttpOnly refresh_token cookie
        });

        if (!response.ok) {
            const error = new Error('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
            processQueue(error, null);
            setToken(null);
            if (typeof window !== 'undefined') localStorage.removeItem('user');
            throw error;
        }

        const json = await response.json();

        if (json.success === false) {
            throw new Error(json.message || 'No se pudo refrescar la sesión.');
        }

        const newAccessToken = json.data.access_token;
        setToken(newAccessToken);
        processQueue(null, newAccessToken);
        return json.data;
    } catch (error) {
        processQueue(error as Error, null);
        setToken(null);
        if (typeof window !== 'undefined') localStorage.removeItem('user');
        throw error;
    } finally {
        isRefreshing = false;
    }
}

const request = async (endpoint: string, options: RequestInit) => {
  const url = `${getApiUrl()}${endpoint}`;
  const headers = new Headers(options.headers);

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  try {
    const response = await fetch(url, { ...options, headers });
    return await handleResponse(response);
  } catch (error: any) {
    if (error instanceof Response && error.status === 401) {
      try {
        const refreshData = await refreshToken();
        
        const retryHeaders = new Headers(options.headers);
        retryHeaders.set('Authorization', `Bearer ${refreshData.access_token}`);
        const retryResponse = await fetch(url, { ...options, headers: retryHeaders });

        return handleResponse(retryResponse);
      } catch (refreshError) {
        throw refreshError;
      }
    }
    throw error;
  }
};


export const api = {
  async get(endpoint: string) {
    return request(endpoint, {
      method: 'GET',
    });
  },

  async post(endpoint: string, body: unknown) {
    return request(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  },

  async refreshSession() {
    const data = await refreshToken();
    // After a successful refresh, the user data is in data.user
    // And the new access token is already set by refreshToken()
    return data.user;
  }
};
