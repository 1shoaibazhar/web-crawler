import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { CrawlTask } from '../types';

interface CrawlContextType {
  tasks: CrawlTask[];
  activeTasks: CrawlTask[];
  startCrawl: (url: string, options?: any) => Promise<void>;
  stopCrawl: (taskId: number) => Promise<void>;
  deleteCrawl: (taskId: number) => Promise<void>;
  refreshTasks: () => Promise<void>;
}

const CrawlContext = createContext<CrawlContextType | undefined>(undefined);

export const useCrawl = () => {
  const context = useContext(CrawlContext);
  if (context === undefined) {
    throw new Error('useCrawl must be used within a CrawlProvider');
  }
  return context;
};

interface CrawlProviderProps {
  children: ReactNode;
}

export const CrawlProvider: React.FC<CrawlProviderProps> = ({ children }) => {
  const [tasks, _setTasks] = useState<CrawlTask[]>([]);
  const [activeTasks, _setActiveTasks] = useState<CrawlTask[]>([]);

  const startCrawl = async (url: string, options?: any) => {
    // TODO: Implement start crawl logic
    console.log('Starting crawl:', url, options);
  };

  const stopCrawl = async (taskId: number) => {
    // TODO: Implement stop crawl logic
    console.log('Stopping crawl:', taskId);
  };

  const deleteCrawl = async (taskId: number) => {
    // TODO: Implement delete crawl logic
    console.log('Deleting crawl:', taskId);
  };

  const refreshTasks = async () => {
    // TODO: Implement refresh tasks logic
    console.log('Refreshing tasks');
  };

  const value = {
    tasks,
    activeTasks,
    startCrawl,
    stopCrawl,
    deleteCrawl,
    refreshTasks,
  };

  return <CrawlContext.Provider value={value}>{children}</CrawlContext.Provider>;
};

export default CrawlContext; 