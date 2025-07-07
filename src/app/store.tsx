
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { Category, ScanResult, User } from '@/lib/types';
import { api, setToken } from '@/lib/api';

// Mock Data
const initialCategories: Category[] = [
  {
    id: 'cat-1',
    name: 'Descripciones de Productos',
    aiModel: 'Gemini 2.0 Flash',
    dateCreated: '2023-10-26',
    description: 'Analiza las descripciones de los productos en busca de palabras clave y sentimiento.',
    prompt: 'Extraer nombres de productos, características y sentimiento general del catálogo.',
    instructions: 'Centrarse en identificar el lenguaje de marketing y los puntos de venta clave mencionados en el texto.',
  },
  {
    id: 'cat-2',
    name: 'Procesamiento de Facturas',
    aiModel: 'Gemini Pro',
    dateCreated: '2023-11-15',
    description: 'Extrae datos de las facturas.',
    prompt: 'Extraer el número de factura, la fecha, el importe total y las partidas del documento proporcionado.',
    instructions: 'El modelo debe manejar varios formatos de factura y devolver un objeto JSON estructurado.',
  },
];

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

const initialManagedUsers: User[] = [
    {
        id: 'user-2',
        name: 'Ana García',
        email: 'ana.garcia@cococo.com',
        avatar: 'https://placehold.co/100x100.png',
        role: 'Miembro',
        status: 'activo',
    },
    {
        id: 'user-3',
        name: 'Carlos Rodriguez',
        email: 'carlos.rodriguez@cococo.com',
        avatar: 'https://placehold.co/100x100.png',
        role: 'Miembro',
        status: 'inactivo',
    },
    { id: 'user-4', name: 'Luisa Martinez', email: 'luisa.martinez@cococo.com', avatar: 'https://placehold.co/100x100.png', role: 'Miembro', status: 'activo' },
    { id: 'user-5', name: 'Javier Fernandez', email: 'javier.fernandez@cococo.com', avatar: 'https://placehold.co/100x100.png', role: 'Miembro', status: 'activo' },
    { id: 'user-6', name: 'Sofia Lopez', email: 'sofia.lopez@cococo.com', avatar: 'https://placehold.co/100x100.png', role: 'Miembro', status: 'inactivo' },
    { id: 'user-7', name: 'David Gomez', email: 'david.gomez@cococo.com', avatar: 'https://placehold.co/100x100.png', role: 'Miembro', status: 'activo' },
    { id: 'user-8', name: 'Elena Perez', email: 'elena.perez@cococo.com', avatar: 'https://placehold.co/100x100.png', role: 'Miembro', status: 'activo' },
    { id: 'user-9', name: 'Daniel Sanchez', email: 'daniel.sanchez@cococo.com', avatar: 'https://placehold.co/100x100.png', role: 'Miembro', status: 'activo' },
    { id: 'user-10', name: 'Paula Romero', email: 'paula.romero@cococo.com', avatar: 'https://placehold.co/100x100.png', role: 'Miembro', status: 'inactivo' },
    { id: 'user-11', name: 'Adrian Vazquez', email: 'adrian.vazquez@cococo.com', avatar: 'https://placehold.co/100x100.png', role: 'Miembro', status: 'activo' },
    { id: 'user-12', name: 'Claudia Diaz', email: 'claudia.diaz@cococo.com', avatar: 'https://placehold.co/100x100.png', role: 'Miembro', status: 'activo' },
    { id: 'user-13', name: 'Hugo Moreno', email: 'hugo.moreno@cococo.com', avatar: 'https://placehold.co/100x100.png', role: 'Miembro', status: 'inactivo' },
    { id: 'user-14', name: 'Alba Alvarez', email: 'alba.alvarez@cococo.com', avatar: 'https://placehold.co/100x100.png', role: 'Miembro', status: 'activo' },
    { id: 'user-15', name: 'Mario Jimenez', email: 'mario.jimenez@cococo.com', avatar: 'https://placehold.co/100x100.png', role: 'Miembro', status: 'activo' },
    { id: 'user-16', name: 'Laura Ruiz', email: 'laura.ruiz@cococo.com', avatar: 'https://placehold.co/100x100.png', role: 'Miembro', status: 'activo' },
    { id: 'user-17', name: 'Sergio Hernandez', email: 'sergio.hernandez@cococo.com', avatar: 'https://placehold.co/100x100.png', role: 'Miembro', status: 'inactivo' },
    { id: 'user-18', name: 'Marta Gil', email: 'marta.gil@cococo.com', avatar: 'https://placehold.co/100x100.png', role: 'Miembro', status: 'activo' },
    { id: 'user-19', name: 'Pablo Cano', email: 'pablo.cano@cococo.com', avatar: 'https://placehold.co/100x100.png', role: 'Miembro', status: 'activo' },
    { id: 'user-20', name: 'Lucia Serrano', email: 'lucia.serrano@cococo.com', avatar: 'https://placehold.co/100x100.png', role: 'Miembro', status: 'activo' },
    { id: 'user-21', name: 'Marcos Molina', email: 'marcos.molina@cococo.com', avatar: 'https://placehold.co/100x100.png', role: 'Miembro', status: 'inactivo' },
];


/**
 * Maps a user object from the API to the application's User type.
 * @param apiUser - The user object from the API response.
 * @returns The mapped User object for the application state.
 */
const mapApiUserToAppUser = (apiUser: any): User => {
  return {
    id: apiUser.id,
    name: apiUser.name,
    email: apiUser.email,
    // The API returns 'admin' or 'member', the app uses 'Administrador' or 'Miembro'
    role: apiUser.role === 'admin' ? 'Administrador' : 'Miembro',
    status: apiUser.status,
    // The API doesn't send an avatar yet, so we use a placeholder.
    avatar: apiUser.avatar || `https://placehold.co/100x100.png`,
  };
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
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  addCategory: (category: Omit<Category, 'id' | 'dateCreated'>) => void;
  editCategory: (id: string, data: Omit<Category, 'id' | 'dateCreated'>) => void;
  deleteCategory: (id: string) => void;

  // Results
  results: ScanResult[];
  setResults: React.Dispatch<React.SetStateAction<ScanResult[]>>;
  addScanResult: (result: Omit<ScanResult, 'id' | 'dateScanned'>) => void;
  deleteScanResult: (id: string) => void;
  editScanResult: (id: string, data: Partial<Omit<ScanResult, 'id' | 'dateScanned'>>) => void;
  
  // Managed Users
  managedUsers: User[];
  addManagedUser: (user: Omit<User, 'id' | 'avatar' | 'status'>) => string;
  editManagedUser: (id: string, data: Partial<Omit<User, 'id' | 'avatar' | 'status'>>) => void;
  deleteManagedUser: (id: string) => void;
  toggleUserStatus: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [results, setResults] = useState<ScanResult[]>(initialScanResults);
  const [managedUsers, setManagedUsers] = useState<User[]>(initialManagedUsers);

  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    localStorage.removeItem('user');
    // No need to remove cookie from JS if it's HttpOnly
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  useEffect(() => {
    const validateSession = async () => {
      try {
        const freshUserData = await api.refreshSession();
        setUser(mapApiUserToAppUser(freshUserData));
        localStorage.setItem('user', JSON.stringify(freshUserData));
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Session validation failed:', error);
        logout();
      } finally {
        setIsAuthLoading(false);
      }
    };

    validateSession();
  }, [logout]);

  const login = async (credentials: { email: string; password:string }) => {
      const loginData = await api.post('/auth/login', credentials);
      if (loginData && loginData.access_token && loginData.user) {
        setToken(loginData.access_token);
        // The HttpOnly refresh_token is set by the server's Set-Cookie header
        const appUser = mapApiUserToAppUser(loginData.user);
        setUser(appUser);
        localStorage.setItem('user', JSON.stringify(loginData.user));
        setIsAuthenticated(true);
      } else {
        throw new Error("Respuesta de login inválida desde la API.");
      }
  };
  
  const addCategory = (category: Omit<Category, 'id' | 'dateCreated'>) => {
    const newCategory: Category = {
      ...category,
      id: `cat-${new Date().getTime()}`,
      dateCreated: new Date().toISOString().split('T')[0],
    };
    setCategories(prev => [...prev, newCategory]);
  };

  const editCategory = (id: string, data: Omit<Category, 'id' | 'dateCreated'>) => {
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

      // Also update localStorage
      const storedUserRaw = localStorage.getItem('user');
      if (storedUserRaw) {
        const storedUser = JSON.parse(storedUserRaw);
        // This only updates the fields that are part of the app's User model
        const updatedStoredUser = {
          ...storedUser,
          name: updatedUser.name,
          email: updatedUser.email,
          avatar: updatedUser.avatar,
        }
        localStorage.setItem('user', JSON.stringify(updatedStoredUser));
      }
      return updatedUser;
    });
  };

  const addManagedUser = (userData: Omit<User, 'id' | 'avatar' | 'status'>): string => {
    const newUser: User = {
      ...userData,
      id: `user-${new Date().getTime()}`,
      avatar: `https://placehold.co/100x100.png`,
      status: 'activo',
    };
    setManagedUsers(prev => [newUser, ...prev]);
    return newUser.id;
  };

  const editManagedUser = (id: string, data: Partial<Omit<User, 'id' | 'avatar' | 'status'>>) => {
    setManagedUsers(prev => 
      prev.map(u => (u.id === id ? { ...u, ...data } : u))
    );
  };
  
  const deleteManagedUser = (id: string) => {
    setManagedUsers(prev => prev.filter(u => u.id !== id));
  };

  const toggleUserStatus = (id: string) => {
    setManagedUsers(prev => 
      prev.map(u => (u.id === id ? { ...u, status: u.status === 'activo' ? 'inactivo' : 'activo' } : u))
    );
  };

  const contextValue = {
    user,
    isAuthenticated,
    isAuthLoading,
    login,
    logout,
    editUser,
    categories,
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
