
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { Category, ScanResult, User } from '@/lib/types';
import { api, setToken, setOnAuthFailure, refreshSession } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

// Mock Data
const initialScanResults: ScanResult[] = [
  {
    id: 'res-1',
    category: 'Descripciones de Productos',
    catalogName: 'Coleccion_Otono_2023.pdf',
    dateScanned: '2023-10-27',
    analysis: 'El análisis de Coleccion_Otono_2023.pdf encontró 15 productos nuevos. Los temas clave incluyen "comodidad acogedora" y "colores de otoño". El sentimiento es abrumadoramente positivo. Productos destacados: "El Suéter Aspen" y "Botas Luna de Cosecha".',
  },
    {
    id: 'res-2',
    category: 'Descripciones de Productos',
    catalogName: 'Especiales_Invierno.txt',
    dateScanned: '2023-12-01',
    analysis: 'Análisis de Especiales_Invierno.txt completado. Se identificaron 5 artículos promocionales. El análisis de sentimiento indica un gran entusiasmo por la "Parka Glaciar". La estrategia de precios parece agresiva con un descuento promedio del 25%.',
  },
  {
    id: 'res-3',
    category: 'Procesamiento de Facturas',
    catalogName: 'FAC-2023-001.pdf',
    dateScanned: '2023-11-16',
    analysis: 'Datos extraídos con éxito de FAC-2023-001.pdf. Número de factura: 2023-001, Fecha: 2023-11-15, Importe total: $1,250.50. Partidas: 5.',
  },
];


/**
 * Maps a user object from the API to the application's User type.
 * @param apiUser - The user object from the API response.
 * @returns The mapped User object for the application state.
 */
export const mapApiUserToAppUser = (apiUser: any): User => {
  // Provide default values for potentially missing fields to prevent crashes.
  const name = apiUser.name || "Usuario no definido";
  const email = apiUser.email || "email.no.definido@example.com";
  
  let role: string;
  if (apiUser.role === 'admin') {
    role = 'Administrador';
  } else if (apiUser.role === 'user') { // The API returns 'user' for members
    role = 'Miembro';
  } else {
    // This handles undefined, null, or other unexpected values for role.
    role = 'Rol no definido';
  }

  let status: 'activo' | 'inactivo' | 'pendiente' | 'suspendido';
    switch (apiUser.status) {
        case 'active':
            status = 'activo';
            break;
        case 'inactive':
            status = 'inactivo';
            break;
        case 'pending':
            status = 'pendiente';
            break;
        case 'suspended':
            status = 'suspendido';
            break;
        default:
            status = 'inactivo';
            break;
    }

  return {
    id: apiUser.id,
    name: name,
    email: email,
    role: role,
    status: status,
    avatar: apiUser.avatar || `https://placehold.co/100x100.png`,
  };
};

export const mapApiCategoryToAppCategory = (apiCategory: any): Category => {
  let modelName = `Modelo ${apiCategory.model}`;
  switch (apiCategory.model) {
    case 1:
      modelName = "Gemini 2.0 Flash";
      break;
    case 2:
      modelName = "Gemini Pro";
      break;
  }

  return {
    id: apiCategory.id,
    name: apiCategory.name,
    description: apiCategory.description,
    prompt: apiCategory.prompt,
    instructions: apiCategory.instructions,
    aiModel: modelName,
    // The API response for categories does not include a `createdAt` field.
    // We'll use the current date as a placeholder.
    createdAt: format(new Date(), 'yyyy-MM-dd'),
  };
};

// Helper to get user from localStorage on initial load
const getInitialUser = (): User | null => {
    if (typeof window === 'undefined') {
        return null;
    }
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        try {
            return JSON.parse(storedUser);
        } catch (e) {
            console.error("Failed to parse user from localStorage", e);
            localStorage.removeItem('user');
            return null;
        }
    }
    return null;
};

interface AppContextType {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => void;
  editUser: (data: Partial<Omit<User, 'id'>>) => void;

  // Categories
  categories: Category[];
  areCategoriesLoading: boolean;
  categoriesError: string | null;
  categoryPagination: {
    currentPage: number;
    totalPages: number;
    totalCategories: number;
  };
  fetchCategories: (params: { page: number; limit: number; search?: string }) => Promise<void>;
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  addCategory: (category: Omit<Category, 'id' | 'createdAt'>) => Promise<void>;
  editCategory: (id: string, data: Omit<Category, 'id' | 'createdAt'>) => void;
  deleteCategory: (id: string) => void;

  // Results
  results: ScanResult[];
  setResults: React.Dispatch<React.SetStateAction<ScanResult[]>>;
  addScanResult: (result: Omit<ScanResult, 'id' | 'dateScanned'>) => void;
  deleteScanResult: (id: string) => void;
  editScanResult: (id: string, data: Partial<Omit<ScanResult, 'id' | 'dateScanned'>>) => void;
  
  // Managed Users
  managedUsers: User[];
  areUsersLoading: boolean;
  usersError: string | null;
  userPagination: {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
  };
  fetchManagedUsers: (params: { page: number; limit: number; search?: string; role?: string; status?: string; }) => Promise<void>;
  addManagedUser: (user: User) => string;
  editManagedUser: (id: string, data: Partial<Omit<User, 'id' | 'avatar'>>) => Promise<void>;
  deleteManagedUser: (id: string) => Promise<void>;
  toggleUserStatus: (id: string, currentStatus: User['status']) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [results, setResults] = useState<ScanResult[]>(initialScanResults);
  const [managedUsers, setManagedUsers] = useState<User[]>([]);
  const { toast } = useToast();

  // Auth state
  const [user, setUser] = useState<User | null>(getInitialUser);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  // Users state
  const [areUsersLoading, setAreUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [userPagination, setUserPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
  });

  // Categories state
  const [areCategoriesLoading, setAreCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [categoryPagination, setCategoryPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCategories: 0,
  });


  // Derived state for isAuthenticated
  const isAuthenticated = !!user;

  // Centralized logout logic. This is the single source of truth for clearing session state.
  const logout = useCallback((isSessionExpired = false) => {
    if (isSessionExpired) {
       toast({
        variant: "destructive",
        title: "Sesión Expirada",
        description: "Tu sesión ha caducado. Por favor, vuelve a iniciar sesión.",
        icon: <AlertTriangle className="h-5 w-5 text-destructive-foreground" />,
      });
    }
    console.log("Executing logout: clearing user state and tokens.");
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('refresh_token');
    // sessionStorage is already cleared by setToken(null), but we do it here too for clarity.
    sessionStorage.removeItem('access_token');
  }, [toast]);

  const handleSessionExpiration = useCallback(() => {
    logout(true);
  }, [logout]);

  // On mount, connect the api module's failure handler to our new function
  useEffect(() => {
    setOnAuthFailure(handleSessionExpiration);
  }, [handleSessionExpiration]);


  // Effect to validate session on initial app load. Runs only once.
  useEffect(() => {
    const validateSessionOnLoad = async () => {
      // If there's no user in local storage, we are not logged in.
      if (!getInitialUser()) {
          setIsAuthLoading(false);
          return;
      }
      
      console.log("Attempting to validate session on app load...");
      try {
        await refreshSession();
        console.log("Session validated and refreshed successfully on app load.");
      } catch (error: any) {
        console.error('An error occurred during session validation:', error.message);
      } finally {
        setIsAuthLoading(false);
      }
    };

    validateSessionOnLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchManagedUsers = useCallback(async (params: { page: number; limit: number; search?: string; role?: string; status?: string; }) => {
    if (!isAuthenticated) return;
    setUsersError(null);
    setAreUsersLoading(true);

    const { page, limit, search, role, status } = params;
    const queryParams = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    if (search) queryParams.append('search', search);
    
    if (role) {
        let apiRole = '';
        if (role === 'Administrador') apiRole = 'admin';
        else if (role === 'Miembro') apiRole = 'user';
        if (apiRole) queryParams.append('role', apiRole);
    }
    if (status) {
        let apiStatus = '';
        switch (status) {
            case 'activo': apiStatus = 'active'; break;
            case 'inactivo': apiStatus = 'inactive'; break;
            case 'pendiente': apiStatus = 'pending'; break;
            case 'suspendido': apiStatus = 'suspended'; break;
        }
        if (apiStatus) queryParams.append('status', apiStatus);
    }

    try {
      const response = await api.get(`/users?${queryParams.toString()}`);
      
      const apiUsers = response?.data?.data || [];
      const paginationData = response?.data?.pagination || {};

      const appUsers = apiUsers.map(mapApiUserToAppUser);
      setManagedUsers(appUsers);

      setUserPagination({
        currentPage: paginationData.page ? parseInt(paginationData.page, 10) : page,
        totalPages: paginationData.totalPages || 1,
        totalUsers: paginationData.total || 0,
      });
    } catch (error: any) {
      const errorMessage = error.message || "No se pudieron obtener los datos de los usuarios desde el servidor.";
      console.error("Error fetching users:", errorMessage);
      setUsersError(errorMessage);
      setManagedUsers([]);
      setUserPagination({ currentPage: 1, totalPages: 1, totalUsers: 0 });
    } finally {
      setAreUsersLoading(false);
    }
  }, [isAuthenticated]);
  
  const fetchCategories = useCallback(async (params: { page: number, limit: number, search?: string }) => {
    if (!isAuthenticated) return;
    setCategoriesError(null);
    setAreCategoriesLoading(true);
    
    const { page, limit, search } = params;
    const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(limit),
    });
    if (search) queryParams.append('search', search);

    try {
        const response = await api.get(`/categories?${queryParams.toString()}`);
        const apiCategories = response?.data?.data || [];
        const paginationData = response?.data?.pagination || {};

        const appCategories = apiCategories.map(mapApiCategoryToAppCategory);
        setCategories(appCategories);

        setCategoryPagination({
            currentPage: paginationData.page ? parseInt(paginationData.page, 10) : page,
            totalPages: paginationData.totalPages || 1,
            totalCategories: paginationData.total || 0,
        });

    } catch (error: any) {
        const errorMessage = error.message || "No se pudieron obtener las categorías desde el servidor.";
        console.error("Error fetching categories:", errorMessage);
        setCategoriesError(errorMessage);
        setCategories([]);
        setCategoryPagination({ currentPage: 1, totalPages: 1, totalCategories: 0 });
    } finally {
        setAreCategoriesLoading(false);
    }
  }, [isAuthenticated]);


  const login = async (credentials: { email: string; password:string }) => {
      const loginData = await api.post('/auth/login', credentials);

      if (loginData && loginData.data.access_token && loginData.data.user && loginData.data.refresh_token) {
        setToken(loginData.data.access_token);
        localStorage.setItem('refresh_token', loginData.data.refresh_token);
        const appUser = mapApiUserToAppUser(loginData.data.user);
        setUser(appUser);
        localStorage.setItem('user', JSON.stringify(appUser));
      } else {
        console.error("Invalid login response structure:", loginData);
        throw new Error("Respuesta de login inválida desde la API.");
      }
  };
  
  const addCategory = async (category: Omit<Category, 'id' | 'createdAt'>) => {
    let modelId;
    switch (category.aiModel) {
        case 'Gemini 2.0 Flash':
            modelId = 1;
            break;
        case 'Gemini Pro':
            modelId = 2;
            break;
        default:
            throw new Error('Modelo de IA no válido seleccionado');
    }

    const payload = {
        name: category.name,
        model: modelId,
        description: category.description,
        prompt: category.prompt,
        instructions: category.instructions,
    };
    
    await api.post('/categories', payload);
    
    // After successful creation, refetch the categories list to show the new one
    await fetchCategories({ page: 1, limit: 10 });
  };

  const editCategory = (id: string, data: Omit<Category, 'id' | 'createdAt'>) => {
    setCategories(prev => 
      prev.map(cat => (cat.id === id ? { ...cat, ...data } : cat))
    );
  };
  
  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(cat => cat.id !== id));
  };

  const addScanResult = (result: Omit<ScanResult, 'id' | 'dateScanned'>) => {
    const newResult: ScanResult = {
        ...result,
        id: `res-${new Date().getTime()}`,
        dateScanned: new Date().toISOString().split('T')[0],
    };
    setResults(prev => [newResult, ...prev]);
  };

  const deleteScanResult = (id: string) => {
    setResults(prev => prev.filter(res => res.id !== id));
  };

  const editScanResult = (id: string, data: Partial<Omit<ScanResult, 'id' | 'dateScanned'>>) => {
    setResults(prev => 
      prev.map(res => (res.id === id ? { ...res, ...data } : res))
    );
  };

  const editUser = (data: Partial<Omit<User, 'id'>>) => {
    setUser(prevUser => {
      if (!prevUser) return null;
      const updatedUser = { ...prevUser, ...data };
      localStorage.setItem('user', JSON.stringify(updatedUser)); // Keep localStorage in sync
      return updatedUser;
    });
  };

  const addManagedUser = (user: User): string => {
    setManagedUsers(prev => [user, ...prev]);
    return user.id;
  };

  const editManagedUser = async (id: string, data: Partial<Omit<User, 'id' | 'avatar'>>) => {
    const payload: {[key: string]: any} = {};
    if (data.name) payload.name = data.name;
    if (data.email) payload.email = data.email;
    if (data.role) {
        payload.role = data.role === 'Administrador' ? 'admin' : 'user';
    }
    if (data.status) {
        let apiStatus: string | undefined;
        switch (data.status) {
            case 'activo': apiStatus = 'active'; break;
            case 'inactivo': apiStatus = 'inactive'; break;
            case 'pendiente': apiStatus = 'pending'; break;
            case 'suspendido': apiStatus = 'suspended'; break;
        }
        if (apiStatus) payload.status = apiStatus;
    }
    
    await api.put(`/users/${id}`, payload);
    
    setManagedUsers(prev => 
      prev.map(u => (u.id === id ? { ...u, ...data } : u))
    );
  };
  
  const deleteManagedUser = async (id: string) => {
    await api.delete(`/users/${id}`);
    setManagedUsers(prev => prev.filter(u => u.id !== id));
  };

  const toggleUserStatus = async (id: string, currentStatus: User['status']) => {
    let newApiStatus: 'active' | 'inactive';

    switch (currentStatus) {
        case 'activo':
            newApiStatus = 'inactive';
            break;
        case 'inactivo':
        case 'pendiente':
        case 'suspendido':
            newApiStatus = 'active';
            break;
        default:
            console.error("Unexpected user status:", currentStatus);
            throw new Error("Estado de usuario no esperado.");
    }
    
    await api.put(`/users/${id}`, { status: newApiStatus });
    
    const newAppStatus = newApiStatus === 'active' ? 'activo' : 'inactivo';
    setManagedUsers(prev => 
      prev.map(u => (u.id === id ? { ...u, status: newAppStatus } : u))
    );
  };

  const contextValue = {
    user,
    isAuthenticated,
    isAuthLoading,
    login,
    logout: () => logout(false),
    editUser,
    categories,
    areCategoriesLoading,
    categoriesError,
    categoryPagination,
    fetchCategories,
    setCategories,
    addCategory,
    editCategory,
    deleteCategory,
    results,
    setResults,
    addScanResult,
    deleteScanResult,
    editScanResult,
    managedUsers,
    areUsersLoading,
    usersError,
    userPagination,
    fetchManagedUsers,
    addManagedUser,
    editManagedUser,
    deleteManagedUser,
    toggleUserStatus,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
