"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Category, ScanResult } from '@/lib/types';

// Mock Data
const initialCategories: Category[] = [
  {
    id: 'cat-1',
    name: 'Product Descriptions',
    aiModel: 'Gemini 2.0 Flash',
    dateCreated: '2023-10-26',
    description: 'Analyzes product descriptions for keywords and sentiment.',
    prompt: 'Extract product names, features, and overall sentiment from the catalog.',
    instructions: 'Focus on identifying marketing language and key selling points mentioned in the text.',
  },
  {
    id: 'cat-2',
    name: 'Invoice Processing',
    aiModel: 'Gemini Pro',
    dateCreated: '2023-11-15',
    description: 'Extracts data from invoices.',
    prompt: 'Extract the invoice number, date, total amount, and line items from the provided document.',
    instructions: 'The model should handle various invoice formats and return a structured JSON object.',
  },
];

const initialScanResults: ScanResult[] = [
  {
    id: 'res-1',
    category: 'Product Descriptions',
    catalogName: 'Fall_2023_Collection.pdf',
    dateScanned: '2023-10-27',
    analysis: 'The analysis of Fall_2023_Collection.pdf found 15 new products. Key themes include "cozy comfort" and "autumn colors". Sentiment is overwhelmingly positive. Highlighted products: "The Aspen Sweater" and "Harvest Moon Boots".',
  },
    {
    id: 'res-2',
    category: 'Product Descriptions',
    catalogName: 'Winter_Specials.txt',
    dateScanned: '2023-12-01',
    analysis: 'Winter_Specials.txt analysis complete. Identified 5 promotional items. Sentiment analysis indicates high excitement for the "Glacier Parka". Pricing strategy seems aggressive with an average discount of 25%.',
  },
  {
    id: 'res-3',
    category: 'Invoice Processing',
    catalogName: 'INV-2023-001.pdf',
    dateScanned: '2023-11-16',
    analysis: 'Successfully extracted data from INV-2023-001.pdf. Invoice Number: 2023-001, Date: 2023-11-15, Total Amount: $1,250.50. Line items: 5.',
  },
];


interface AppContextType {
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  results: ScanResult[];
  setResults: React.Dispatch<React.SetStateAction<ScanResult[]>>;
  addCategory: (category: Omit<Category, 'id' | 'dateCreated'>) => void;
  addScanResult: (result: Omit<ScanResult, 'id' | 'dateScanned'>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [results, setResults] = useState<ScanResult[]>(initialScanResults);
  
  const addCategory = (category: Omit<Category, 'id' | 'dateCreated'>) => {
    const newCategory: Category = {
      ...category,
      id: `cat-${new Date().getTime()}`,
      dateCreated: new Date().toISOString().split('T')[0],
    };
    setCategories(prev => [...prev, newCategory]);
  };

  const addScanResult = (result: Omit<ScanResult, 'id' | 'dateScanned'>) => {
    const newResult: ScanResult = {
        ...result,
        id: `res-${new Date().getTime()}`,
        dateScanned: new Date().toISOString().split('T')[0],
    };
    setResults(prev => [newResult, ...prev]);
  };

  return (
    <AppContext.Provider value={{ categories, setCategories, results, setResults, addCategory, addScanResult }}>
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
