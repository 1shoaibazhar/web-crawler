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