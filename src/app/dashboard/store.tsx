
"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Category, ScanResult, User } from '@/lib/types';

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

const initialUser: User = {
    id: 'user-1',
    name: 'Usuario de Demostración',
    email: 'user@cococo.com',
    avatar: 'https://placehold.co/100x100.png',
    role: 'Administrador',
};

const initialManagedUsers: User[] = [
    {
        id: 'user-2',
        name: 'Ana García',
        email: 'ana.garcia@cococo.com',
        avatar: 'https://placehold.co/100x100.png',
        role: 'Miembro',
    },
    {
        id: 'user-3',
        name: 'Carlos Rodriguez',
        email: 'carlos.rodriguez@cococo.com',
        avatar: 'https://placehold.co/100x100.png',
        role: 'Miembro',
    }
];


interface AppContextType {
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  results: ScanResult[];
  setResults: React.Dispatch<React.SetStateAction<ScanResult[]>>;
  addCategory: (category: Omit<Category, 'id' | 'dateCreated'>) => void;
  editCategory: (id: string, data: Omit<Category, 'id' | 'dateCreated'>) => void;
  addScanResult: (result: Omit<ScanResult, 'id' | 'dateScanned'>) => void;
  deleteScanResult: (id: string) => void;
  editScanResult: (id: string, data: Partial<Omit<ScanResult, 'id' | 'dateScanned'>>) => void;
  user: User;
  editUser: (data: Partial<Omit<User, 'id'>>) => void;
  managedUsers: User[];
  addManagedUser: (user: Omit<User, 'id' | 'avatar'>) => void;
  editManagedUser: (id: string, data: Partial<Omit<User, 'id' | 'avatar'>>) => void;
  deleteManagedUser: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [results, setResults] = useState<ScanResult[]>(initialScanResults);
  const [user, setUser] = useState<User>(initialUser);
  const [managedUsers, setManagedUsers] = useState<User[]>(initialManagedUsers);
  
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
    setUser(prev => ({ ...prev, ...data }));
  };

  const addManagedUser = (userData: Omit<User, 'id' | 'avatar'>) => {
    const newUser: User = {
      ...userData,
      id: `user-${new Date().getTime()}`,
      avatar: `https://placehold.co/100x100.png`,
    };
    setManagedUsers(prev => [...prev, newUser]);
  };

  const editManagedUser = (id: string, data: Partial<Omit<User, 'id' | 'avatar'>>) => {
    setManagedUsers(prev => 
      prev.map(u => (u.id === id ? { ...u, ...data } : u))
    );
  };
  
  const deleteManagedUser = (id: string) => {
    setManagedUsers(prev => prev.filter(u => u.id !== id));
  };


  return (
    <AppContext.Provider value={{ categories, setCategories, results, setResults, addCategory, editCategory, addScanResult, deleteScanResult, editScanResult, user, editUser, managedUsers, addManagedUser, editManagedUser, deleteManagedUser }}>
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
