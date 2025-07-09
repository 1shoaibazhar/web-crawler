// Crawl service for crawling operations

import { apiService, API_ENDPOINTS } from './api.service';
import type { 
  CrawlTask, 
  CrawlResult, 
  CrawlLink, 
  StartCrawlRequest, 
  CrawlTasksResponse, 
  TaskStatusResponse,
  TasksQueryParams 
} from '../types';

export class CrawlService {
  async startCrawl(data: StartCrawlRequest): Promise<CrawlTask> {
    return apiService.post<CrawlTask>(API_ENDPOINTS.startCrawl, data);
  }

  async getTasks(params?: TasksQueryParams): Promise<CrawlTasksResponse> {
    return apiService.get<CrawlTasksResponse>(API_ENDPOINTS.getTasks, { params });
  }

  async getTaskStatus(id: number): Promise<TaskStatusResponse> {
    return apiService.get<TaskStatusResponse>(API_ENDPOINTS.getTaskStatus(id));
  }

  async stopCrawl(id: number): Promise<void> {
    return apiService.put<void>(API_ENDPOINTS.stopCrawl(id));
  }

  async getResults(id: number): Promise<CrawlResult> {
    return apiService.get<CrawlResult>(API_ENDPOINTS.getResults(id));
  }

  async deleteTask(id: number): Promise<void> {
    return apiService.delete<void>(API_ENDPOINTS.deleteTask(id));
  }

  async getLinks(taskId: number): Promise<CrawlLink[]> {
    // This endpoint might need to be added to the backend
    return apiService.get<CrawlLink[]>(`/api/v1/crawl/${taskId}/links`);
  }
}

export const crawlService = new CrawlService(); 