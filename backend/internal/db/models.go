package db

import (
	"time"
)

// User represents a user in the system
type User struct {
	ID           int       `json:"id" db:"id"`
	Username     string    `json:"username" db:"username"`
	Email        string    `json:"email" db:"email"`
	PasswordHash string    `json:"-" db:"password_hash"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}

// CrawlTask represents a crawling task
type CrawlTask struct {
	ID           int        `json:"id" db:"id"`
	UserID       int        `json:"user_id" db:"user_id"`
	URL          string     `json:"url" db:"url"`
	Status       string     `json:"status" db:"status"`
	Progress     float64    `json:"progress" db:"progress"`
	ErrorMessage *string    `json:"error_message,omitempty" db:"error_message"`
	CreatedAt    time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at" db:"updated_at"`
	StartedAt    *time.Time `json:"started_at,omitempty" db:"started_at"`
	CompletedAt  *time.Time `json:"completed_at,omitempty" db:"completed_at"`
}

// CrawlResult represents the analysis result of a crawl task
type CrawlResult struct {
	ID                     int       `json:"id" db:"id"`
	TaskID                 int       `json:"task_id" db:"task_id"`
	HTMLVersion            *string   `json:"html_version,omitempty" db:"html_version"`
	PageTitle              *string   `json:"page_title,omitempty" db:"page_title"`
	H1Count                int       `json:"h1_count" db:"h1_count"`
	H2Count                int       `json:"h2_count" db:"h2_count"`
	H3Count                int       `json:"h3_count" db:"h3_count"`
	H4Count                int       `json:"h4_count" db:"h4_count"`
	H5Count                int       `json:"h5_count" db:"h5_count"`
	H6Count                int       `json:"h6_count" db:"h6_count"`
	InternalLinksCount     int       `json:"internal_links_count" db:"internal_links_count"`
	ExternalLinksCount     int       `json:"external_links_count" db:"external_links_count"`
	InaccessibleLinksCount int       `json:"inaccessible_links_count" db:"inaccessible_links_count"`
	HasLoginForm           bool      `json:"has_login_form" db:"has_login_form"`
	TotalLinksCount        int       `json:"total_links_count" db:"total_links_count"`
	ResponseTimeMs         int       `json:"response_time_ms" db:"response_time_ms"`
	PageSizeBytes          int       `json:"page_size_bytes" db:"page_size_bytes"`
	CreatedAt              time.Time `json:"created_at" db:"created_at"`
}

// CrawlLink represents a link found during crawling
type CrawlLink struct {
	ID             int        `json:"id" db:"id"`
	TaskID         int        `json:"task_id" db:"task_id"`
	URL            string     `json:"url" db:"url"`
	LinkType       string     `json:"link_type" db:"link_type"`
	StatusCode     *int       `json:"status_code,omitempty" db:"status_code"`
	IsAccessible   bool       `json:"is_accessible" db:"is_accessible"`
	AnchorText     *string    `json:"anchor_text,omitempty" db:"anchor_text"`
	ResponseTimeMs int        `json:"response_time_ms" db:"response_time_ms"`
	CheckedAt      *time.Time `json:"checked_at,omitempty" db:"checked_at"`
	CreatedAt      time.Time  `json:"created_at" db:"created_at"`
}

// TaskStatus constants
const (
	TaskStatusPending    = "pending"
	TaskStatusInProgress = "in_progress"
	TaskStatusCompleted  = "completed"
	TaskStatusFailed     = "failed"
	TaskStatusCancelled  = "cancelled"
)

// LinkType constants
const (
	LinkTypeInternal = "internal"
	LinkTypeExternal = "external"
)
