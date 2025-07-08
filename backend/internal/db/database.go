package db

import (
	"database/sql"
	"fmt"
	"io/ioutil"
	"log"
	"path/filepath"
	"sort"
	"web-crawler/config"

	_ "github.com/go-sql-driver/mysql"
)

var db *sql.DB

// Initialize sets up the database connection and runs migrations
func Initialize() (*sql.DB, error) {
	cfg := config.Load()

	// Create connection string
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		cfg.Database.User,
		cfg.Database.Password,
		cfg.Database.Host,
		cfg.Database.Port,
		cfg.Database.Name,
	)

	// Open database connection
	var err error
	db, err = sql.Open("mysql", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database connection: %v", err)
	}

	// Test connection
	if err = db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %v", err)
	}

	// Set connection pool settings
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(25)

	// Run migrations
	if err = runMigrations(); err != nil {
		return nil, fmt.Errorf("failed to run migrations: %v", err)
	}

	log.Println("Database connection initialized successfully")
	return db, nil
}

// GetDB returns the database connection
func GetDB() *sql.DB {
	return db
}

// runMigrations executes all migration files in order
func runMigrations() error {
	// Create migrations table if it doesn't exist
	createMigrationsTable := `
		CREATE TABLE IF NOT EXISTS migrations (
			id INT AUTO_INCREMENT PRIMARY KEY,
			filename VARCHAR(255) NOT NULL UNIQUE,
			executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`

	if _, err := db.Exec(createMigrationsTable); err != nil {
		return fmt.Errorf("failed to create migrations table: %v", err)
	}

	// Get executed migrations
	executedMigrations := make(map[string]bool)
	rows, err := db.Query("SELECT filename FROM migrations")
	if err != nil {
		return fmt.Errorf("failed to get executed migrations: %v", err)
	}
	defer rows.Close()

	for rows.Next() {
		var filename string
		if err := rows.Scan(&filename); err != nil {
			return fmt.Errorf("failed to scan migration filename: %v", err)
		}
		executedMigrations[filename] = true
	}

	// Get migration files
	migrationFiles, err := filepath.Glob("migrations/*.sql")
	if err != nil {
		return fmt.Errorf("failed to get migration files: %v", err)
	}

	// Sort migration files
	sort.Strings(migrationFiles)

	// Execute pending migrations
	for _, file := range migrationFiles {
		filename := filepath.Base(file)

		// Skip if already executed
		if executedMigrations[filename] {
			continue
		}

		// Read migration file
		content, err := ioutil.ReadFile(file)
		if err != nil {
			return fmt.Errorf("failed to read migration file %s: %v", file, err)
		}

		// Execute migration
		if _, err := db.Exec(string(content)); err != nil {
			return fmt.Errorf("failed to execute migration %s: %v", filename, err)
		}

		// Record migration as executed
		if _, err := db.Exec("INSERT INTO migrations (filename) VALUES (?)", filename); err != nil {
			return fmt.Errorf("failed to record migration %s: %v", filename, err)
		}

		log.Printf("Executed migration: %s", filename)
	}

	return nil
}

// UserRepository provides database operations for users
type UserRepository struct {
	db *sql.DB
}

// NewUserRepository creates a new user repository
func NewUserRepository(database *sql.DB) *UserRepository {
	return &UserRepository{db: database}
}

// GetByUsername retrieves a user by username
func (r *UserRepository) GetByUsername(username string) (*User, error) {
	var user User
	err := r.db.QueryRow(
		"SELECT id, username, email, password_hash, created_at, updated_at FROM users WHERE username = ?",
		username,
	).Scan(&user.ID, &user.Username, &user.Email, &user.PasswordHash, &user.CreatedAt, &user.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &user, nil
}

// GetByID retrieves a user by ID
func (r *UserRepository) GetByID(id int) (*User, error) {
	var user User
	err := r.db.QueryRow(
		"SELECT id, username, email, password_hash, created_at, updated_at FROM users WHERE id = ?",
		id,
	).Scan(&user.ID, &user.Username, &user.Email, &user.PasswordHash, &user.CreatedAt, &user.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &user, nil
}

// TaskRepository provides database operations for crawl tasks
type TaskRepository struct {
	db *sql.DB
}

// NewTaskRepository creates a new task repository
func NewTaskRepository(database *sql.DB) *TaskRepository {
	return &TaskRepository{db: database}
}

// Create creates a new crawl task
func (r *TaskRepository) Create(task *CrawlTask) error {
	result, err := r.db.Exec(
		"INSERT INTO crawl_tasks (user_id, url, status, progress) VALUES (?, ?, ?, ?)",
		task.UserID, task.URL, task.Status, task.Progress,
	)
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}

	task.ID = int(id)
	return nil
}

// GetByID retrieves a crawl task by ID
func (r *TaskRepository) GetByID(id int) (*CrawlTask, error) {
	var task CrawlTask
	err := r.db.QueryRow(
		`SELECT id, user_id, url, status, progress, error_message, created_at, updated_at, started_at, completed_at 
		 FROM crawl_tasks WHERE id = ?`,
		id,
	).Scan(&task.ID, &task.UserID, &task.URL, &task.Status, &task.Progress, &task.ErrorMessage,
		&task.CreatedAt, &task.UpdatedAt, &task.StartedAt, &task.CompletedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &task, nil
}

// GetByUserID retrieves crawl tasks for a specific user with pagination
func (r *TaskRepository) GetByUserID(userID int, limit, offset int) ([]*CrawlTask, error) {
	rows, err := r.db.Query(
		`SELECT id, user_id, url, status, progress, error_message, created_at, updated_at, started_at, completed_at 
		 FROM crawl_tasks WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
		userID, limit, offset,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tasks []*CrawlTask
	for rows.Next() {
		var task CrawlTask
		err := rows.Scan(&task.ID, &task.UserID, &task.URL, &task.Status, &task.Progress,
			&task.ErrorMessage, &task.CreatedAt, &task.UpdatedAt, &task.StartedAt, &task.CompletedAt)
		if err != nil {
			return nil, err
		}
		tasks = append(tasks, &task)
	}

	return tasks, nil
}

// UpdateStatus updates the status of a crawl task
func (r *TaskRepository) UpdateStatus(id int, status string) error {
	_, err := r.db.Exec(
		"UPDATE crawl_tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
		status, id,
	)
	return err
}

// UpdateProgress updates the progress of a crawl task
func (r *TaskRepository) UpdateProgress(id int, progress float64) error {
	_, err := r.db.Exec(
		"UPDATE crawl_tasks SET progress = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
		progress, id,
	)
	return err
}

// ResultRepository provides database operations for crawl results
type ResultRepository struct {
	db *sql.DB
}

// NewResultRepository creates a new result repository
func NewResultRepository(database *sql.DB) *ResultRepository {
	return &ResultRepository{db: database}
}

// Create creates a new crawl result
func (r *ResultRepository) Create(result *CrawlResult) error {
	res, err := r.db.Exec(
		`INSERT INTO crawl_results (task_id, html_version, page_title, h1_count, h2_count, h3_count, h4_count, h5_count, h6_count, 
		 internal_links_count, external_links_count, inaccessible_links_count, has_login_form, total_links_count, response_time_ms, page_size_bytes) 
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		result.TaskID, result.HTMLVersion, result.PageTitle, result.H1Count, result.H2Count, result.H3Count, result.H4Count, result.H5Count, result.H6Count,
		result.InternalLinksCount, result.ExternalLinksCount, result.InaccessibleLinksCount, result.HasLoginForm, result.TotalLinksCount, result.ResponseTimeMs, result.PageSizeBytes,
	)
	if err != nil {
		return err
	}

	id, err := res.LastInsertId()
	if err != nil {
		return err
	}

	result.ID = int(id)
	return nil
}

// GetByTaskID retrieves crawl results for a specific task
func (r *ResultRepository) GetByTaskID(taskID int) (*CrawlResult, error) {
	var result CrawlResult
	err := r.db.QueryRow(
		`SELECT id, task_id, html_version, page_title, h1_count, h2_count, h3_count, h4_count, h5_count, h6_count, 
		 internal_links_count, external_links_count, inaccessible_links_count, has_login_form, total_links_count, response_time_ms, page_size_bytes, created_at 
		 FROM crawl_results WHERE task_id = ?`,
		taskID,
	).Scan(&result.ID, &result.TaskID, &result.HTMLVersion, &result.PageTitle, &result.H1Count, &result.H2Count, &result.H3Count, &result.H4Count, &result.H5Count, &result.H6Count,
		&result.InternalLinksCount, &result.ExternalLinksCount, &result.InaccessibleLinksCount, &result.HasLoginForm, &result.TotalLinksCount, &result.ResponseTimeMs, &result.PageSizeBytes, &result.CreatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &result, nil
}
