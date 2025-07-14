// Crawl service for crawling operations

import { apiService, API_ENDPOINTS } from './api.service';
import type { 
  CrawlTask, 
  CrawlResult, 
  CrawlLink, 
  StartCrawlRequest, 
  CrawlTaskRequest,
  CrawlTasksResponse, 
  TaskStatusResponse,
  TasksQueryParams,
  BulkActionRequest,
  BulkActionResponse,
  StatsResponse
} from '../types';

export class CrawlService {
  private static instance: CrawlService;

  // Singleton pattern
  static getInstance(): CrawlService {
    if (!CrawlService.instance) {
      CrawlService.instance = new CrawlService();
    }
    return CrawlService.instance;
  }

  async startCrawl(data: StartCrawlRequest): Promise<CrawlTask> {
    try {
      const response = await apiService.post<CrawlTask>(API_ENDPOINTS.startCrawl, data);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async createTask(data: CrawlTaskRequest): Promise<CrawlTask> {
    try {
      const response = await apiService.post<CrawlTask>(API_ENDPOINTS.startCrawl, data);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getTasks(params?: TasksQueryParams): Promise<CrawlTasksResponse> {
    try {
      const response = await apiService.get<CrawlTasksResponse>(API_ENDPOINTS.getTasks, { params });
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getTaskStatus(id: number): Promise<TaskStatusResponse> {
    try {
      const response = await apiService.get<TaskStatusResponse>(API_ENDPOINTS.getTaskStatus(id));
      return response;
    } catch (error) {
      throw error;
    }
  }

  async stopCrawl(id: number): Promise<void> {
    try {
      await apiService.put<void>(API_ENDPOINTS.stopCrawl(id));
    } catch (error) {
      throw error;
    }
  }

  async getResults(id: number): Promise<CrawlResult> {
    try {
      const response = await apiService.get<CrawlResult>(API_ENDPOINTS.getResults(id));
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getLinks(taskId: number, params?: { page?: number; limit?: number; type?: string }): Promise<CrawlLink[]> {
    try {
      const response = await apiService.get<CrawlLink[]>(API_ENDPOINTS.getLinks(taskId), { params });
      return response;
    } catch (error) {
      throw error;
    }
  }

  async deleteTask(id: number): Promise<void> {
    try {
      await apiService.delete<void>(API_ENDPOINTS.deleteTask(id));
    } catch (error) {
      throw error;
    }
  }

  async bulkDelete(taskIds: number[]): Promise<BulkActionResponse> {
    try {
      const response = await apiService.post<BulkActionResponse>(
        API_ENDPOINTS.bulkDelete,
        { taskIds } as BulkActionRequest
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  async bulkRerun(taskIds: number[]): Promise<BulkActionResponse> {
    try {
      const response = await apiService.post<BulkActionResponse>(
        API_ENDPOINTS.bulkRerun,
        { taskIds } as BulkActionRequest
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getStats(): Promise<StatsResponse> {
    try {
      const response = await apiService.get<StatsResponse>(API_ENDPOINTS.getStats);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getUserStats(): Promise<StatsResponse> {
    try {
      const response = await apiService.get<StatsResponse>(API_ENDPOINTS.getUserStats);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Utility methods
  async rerunTask(id: number): Promise<CrawlTask> {
    try {
      const task = await this.getTaskStatus(id);
      // Create a new crawl task with the same URL
      const newTask = await this.startCrawl({
        url: task.url,
      });
      return newTask;
    } catch (error) {
      throw error;
    }
  }

  async duplicateTask(id: number): Promise<CrawlTask> {
    try {
      const task = await this.getTaskStatus(id);
      // Create a new crawl task with the same URL
      const newTask = await this.startCrawl({
        url: task.url,
      });
      return newTask;
    } catch (error) {
      throw error;
    }
  }

  async exportResults(taskId: number, format: 'csv' | 'json' | 'xlsx' = 'csv'): Promise<Blob> {
    try {
      const response = await apiService.downloadFile(
        `/api/v1/crawl/${taskId}/export?format=${format}`,
        `crawl-results-${taskId}.${format}`
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getTaskHistory(params?: { page?: number; limit?: number; userId?: number }): Promise<CrawlTasksResponse> {
    try {
      const response = await apiService.get<CrawlTasksResponse>('/api/v1/crawl/history', { params });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Real-time task monitoring
  async pollTaskStatus(taskId: number, interval: number = 5000): Promise<() => void> {
    let timeoutId: NodeJS.Timeout;
    let isPolling = true;
    
    const poll = async () => {
      if (!isPolling) return;
      
      try {
        const status = await this.getTaskStatus(taskId);
        
        // Emit custom event for status updates
        window.dispatchEvent(new CustomEvent('crawl-status-update', {
          detail: { taskId, status }
        }));
        
        // Continue polling if task is still running
        if (status.status === 'in_progress' || status.status === 'pending') {
          timeoutId = setTimeout(poll, interval);
        }
      } catch (error) {
        console.error('Error polling task status:', error);
        // Continue polling even on error
        timeoutId = setTimeout(poll, interval);
      }
    };
    
    // Start polling
    poll();
    
    // Return cleanup function
    return () => {
      isPolling = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }

  // Batch operations
  async processBatch<T>(
    items: T[],
    processor: (item: T) => Promise<any>,
    batchSize: number = 5,
    onProgress?: (completed: number, total: number) => void
  ): Promise<any[]> {
    const results: any[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(item => processor(item))
      );
      
      results.push(...batchResults);
      
      if (onProgress) {
        onProgress(Math.min(i + batchSize, items.length), items.length);
      }
    }
    
    return results;
  }

  // Validate crawl configuration
  validateCrawlConfig(config: StartCrawlRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!config.url || typeof config.url !== 'string') {
      errors.push('URL is required');
    } else {
      try {
        new URL(config.url);
      } catch {
        errors.push('Invalid URL format');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Get crawl statistics for a specific task
  async getTaskStats(taskId: number): Promise<{
    totalPages: number;
    uniquePages: number;
    externalLinks: number;
    internalLinks: number;
    brokenLinks: number;
    averageResponseTime: number;
    statusCodes: Record<number, number>;
  }> {
    try {
      const response = await apiService.get<{
        totalPages: number;
        uniquePages: number;
        externalLinks: number;
        internalLinks: number;
        brokenLinks: number;
        averageResponseTime: number;
        statusCodes: Record<number, number>;
      }>(`/api/v1/crawl/${taskId}/stats`);
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export const crawlService = CrawlService.getInstance(); 