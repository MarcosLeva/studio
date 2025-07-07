
import {toast} from '@/hooks/use-toast';

let accessToken: string | null = null;
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

export const setToken = (token: string | null) => {
  accessToken = token;
};

const handleResponse = async (response: Response) => {
    const text = await response.text();
    const json = text ? JSON.parse(text) : {};

    if (!response.ok) {
        const error = new Error(json.message || `Error: ${response.statusText}`);
        (error as any).status = response.status;
        throw error;
    }
    
    if (json.success === false) {
      throw new Error(json.message || 'La API indicó un fallo en la operación.');
    }

    return json.data;
}

const refreshToken = async () => {
    if (refreshTokenPromise) {
        return refreshTokenPromise;
    }

    const token = localStorage.getItem('refresh_token');
    if (!token) {
        return Promise.reject(new Error('No refresh token available.'));
    }

    refreshTokenPromise = fetch(`${getApiUrl()}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: token }),
    }).then(async response => {
        const data = await handleResponse(response);
        setToken(data.access_token);
        return data;
    }).finally(() => {
        refreshTokenPromise = null;
    });

    return refreshTokenPromise;
}

const request = async (endpoint: string, options: RequestInit) => {
  const url = `${getApiUrl()}${endpoint}`;
  const headers = new Headers(options.headers);

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  try {
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
        const error = new Error('Token might have expired');
        (error as any).status = 401;
        throw error;
    }
    return await handleResponse(response);
  } catch (error: any) {
    if (error.status === 401) {
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
    return refreshToken();
  }
};
