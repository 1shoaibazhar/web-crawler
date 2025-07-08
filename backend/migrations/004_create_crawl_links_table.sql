-- Create crawl_links table for storing detailed link information
CREATE TABLE crawl_links (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    url VARCHAR(2048) NOT NULL,
    link_type ENUM('internal', 'external') NOT NULL,
    status_code INT,
    is_accessible BOOLEAN DEFAULT TRUE,
    anchor_text TEXT,
    response_time_ms INT DEFAULT 0,
    checked_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (task_id) REFERENCES crawl_tasks(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_crawl_links_task_id ON crawl_links(task_id);
CREATE INDEX idx_crawl_links_type ON crawl_links(link_type);
CREATE INDEX idx_crawl_links_accessible ON crawl_links(is_accessible);
CREATE INDEX idx_crawl_links_status ON crawl_links(status_code); 