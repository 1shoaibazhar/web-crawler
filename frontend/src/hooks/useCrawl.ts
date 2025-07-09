import { useContext } from 'react';
import CrawlContext from '../context/CrawlContext';

export const useCrawl = () => {
  const context = useContext(CrawlContext);
  if (context === undefined) {
    throw new Error('useCrawl must be used within a CrawlProvider');
  }
  return context;
};

export default useCrawl; 