// Crawl-related types matching backend models

export interface CrawlTask {
  id: number;
  user_id: number;
  url: string;
  status: TaskStatus;
  progress: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface CrawlResult {
  id: number;
  task_id: number;
  html_version?: string;
  page_title?: string;
  h1_count: number;
  h2_count: number;
  h3_count: number;
  h4_count: number;
  h5_count: number;
  h6_count: number;
  internal_links_count: number;
  external_links_count: number;
  inaccessible_links_count: number;
  has_login_form: boolean;
  total_links_count: number;
  response_time_ms: number;
  page_size_bytes: number;
  created_at: string;
}

export interface CrawlLink {
  id: number;
  task_id: number;
  url: string;
  link_type: LinkType;
  status_code?: number;
  is_accessible: boolean;
  anchor_text?: string;
  response_time_ms: number;
  checked_at?: string;
  created_at: string;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

export type LinkType = 'internal' | 'external';

export interface TaskStatusResponse {
  id: number;
  user_id: number;
  url: string;
  status: TaskStatus;
  progress: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
  results?: CrawlResult;
}

export interface StartCrawlRequest {
  url: string;
}

export interface CrawlTaskRequest {
  url: string;
  max_depth?: number;
  max_pages?: number;
  delay?: number;
  timeout?: number;
  follow_redirects?: boolean;
  respect_robots_txt?: boolean;
  user_agent?: string;
  headers?: Record<string, string>;
}

export interface CrawlTasksResponse {
  tasks: CrawlTask[];
  page: number;
  limit: number;
  total: number;
}



export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface HeadingCounts {
  h1: number;
  h2: number;
  h3: number;
  h4: number;
  h5: number;
  h6: number;
}

// Real-time crawl progress information
export interface CrawlProgress {
  task_id: number;
  url: string;
  status: TaskStatus;
  progress: {
    urls_crawled: number;
    total_urls: number;
    percentage: number;
    current_url?: string;
    urls_found: number;
    errors: number;
    start_time: string;
    elapsed_time: number;
    estimated_time_remaining?: number;
  };
  statistics: {
    pages_crawled: number;
    links_found: number;
    external_links: number;
    internal_links: number;
    broken_links: number;
    redirects: number;
    errors: number;
    average_response_time: number;
    total_size: number;
  };
  timestamp: string;
} 