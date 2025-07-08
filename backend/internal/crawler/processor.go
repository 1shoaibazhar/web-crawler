package crawler

import (
	"encoding/json"
	"fmt"
	"log"
	"time"
	"web-crawler/internal/db"
	"web-crawler/internal/websocket"
)

// Processor handles the processing of crawl tasks with database integration
type Processor struct {
	crawler    *Service
	taskRepo   *db.TaskRepository
	resultRepo *db.ResultRepository
	linkRepo   *db.LinkRepository
	wsHub      *websocket.Hub
}

// NewProcessor creates a new crawler processor
func NewProcessor(taskRepo *db.TaskRepository, resultRepo *db.ResultRepository, linkRepo *db.LinkRepository, wsHub *websocket.Hub) *Processor {
	return &Processor{
		crawler:    NewService(),
		taskRepo:   taskRepo,
		resultRepo: resultRepo,
		linkRepo:   linkRepo,
		wsHub:      wsHub,
	}
}

// ProcessTask processes a crawl task with progress updates
func (p *Processor) ProcessTask(task *db.CrawlTask, stopCh <-chan bool) error {
	log.Printf("Starting to process task %d for URL: %s", task.ID, task.URL)

	// Update task status to in_progress
	if err := p.taskRepo.UpdateStatus(task.ID, db.TaskStatusInProgress); err != nil {
		return fmt.Errorf("failed to update task status: %v", err)
	}

	// Send initial progress update
	p.sendProgressUpdate(task.UserID, task.ID, 0.0, "Starting crawl...")

	// Check for stop signal
	select {
	case <-stopCh:
		log.Printf("Task %d was stopped before crawling", task.ID)
		return p.taskRepo.UpdateStatus(task.ID, db.TaskStatusCancelled)
	default:
	}

	// Update progress to 10% - starting to fetch page
	p.taskRepo.UpdateProgress(task.ID, 10.0)
	p.sendProgressUpdate(task.UserID, task.ID, 10.0, "Fetching webpage...")

	// Crawl the page
	startTime := time.Now()
	result, err := p.crawler.CrawlPage(task.URL)
	if err != nil {
		log.Printf("Failed to crawl URL %s: %v", task.URL, err)
		errorMsg := err.Error()
		if updateErr := p.taskRepo.UpdateStatusWithError(task.ID, db.TaskStatusFailed, &errorMsg); updateErr != nil {
			log.Printf("Failed to update task status: %v", updateErr)
		}
		p.sendProgressUpdate(task.UserID, task.ID, 0.0, fmt.Sprintf("Failed: %s", err.Error()))
		return err
	}

	// Check for stop signal after crawling
	select {
	case <-stopCh:
		log.Printf("Task %d was stopped after crawling", task.ID)
		return p.taskRepo.UpdateStatus(task.ID, db.TaskStatusCancelled)
	default:
	}

	// Update progress to 60% - analyzing results
	p.taskRepo.UpdateProgress(task.ID, 60.0)
	p.sendProgressUpdate(task.UserID, task.ID, 60.0, "Analyzing page content...")

	// Save results to database
	dbResult := p.convertToDBResult(task.ID, result)
	if err := p.resultRepo.Create(dbResult); err != nil {
		log.Printf("Failed to save crawl results: %v", err)
		errorMsg := "Failed to save results"
		if updateErr := p.taskRepo.UpdateStatusWithError(task.ID, db.TaskStatusFailed, &errorMsg); updateErr != nil {
			log.Printf("Failed to update task status: %v", updateErr)
		}
		return err
	}

	// Update progress to 80% - saving link details
	p.taskRepo.UpdateProgress(task.ID, 80.0)
	p.sendProgressUpdate(task.UserID, task.ID, 80.0, "Saving link details...")

	// Save detailed link information
	if err := p.saveLinks(task.ID, result.Links); err != nil {
		log.Printf("Failed to save link details: %v", err)
		// This is not critical, so we don't fail the task
	}

	// Update progress to 100% - completed
	p.taskRepo.UpdateProgress(task.ID, 100.0)
	if err := p.taskRepo.UpdateStatus(task.ID, db.TaskStatusCompleted); err != nil {
		log.Printf("Failed to update task status to completed: %v", err)
	}

	completedAt := time.Now()
	if err := p.taskRepo.UpdateCompletedAt(task.ID, &completedAt); err != nil {
		log.Printf("Failed to update completion time: %v", err)
	}

	p.sendProgressUpdate(task.UserID, task.ID, 100.0, "Crawling completed successfully!")

	// Send final results via WebSocket
	p.sendResultsUpdate(task.UserID, task.ID, dbResult)

	log.Printf("Task %d completed successfully in %v", task.ID, time.Since(startTime))
	return nil
}

// convertToDBResult converts crawler result to database result format
func (p *Processor) convertToDBResult(taskID int, result *CrawlResult) *db.CrawlResult {
	// Handle nil page title
	var pageTitle *string
	if result.PageTitle != "" {
		pageTitle = &result.PageTitle
	}

	// Handle nil HTML version
	var htmlVersion *string
	if result.HTMLVersion != "" {
		htmlVersion = &result.HTMLVersion
	}

	return &db.CrawlResult{
		TaskID:                 taskID,
		HTMLVersion:            htmlVersion,
		PageTitle:              pageTitle,
		H1Count:                result.HeadingCounts["h1"],
		H2Count:                result.HeadingCounts["h2"],
		H3Count:                result.HeadingCounts["h3"],
		H4Count:                result.HeadingCounts["h4"],
		H5Count:                result.HeadingCounts["h5"],
		H6Count:                result.HeadingCounts["h6"],
		InternalLinksCount:     result.InternalLinksCount,
		ExternalLinksCount:     result.ExternalLinksCount,
		InaccessibleLinksCount: result.InaccessibleLinksCount,
		HasLoginForm:           result.HasLoginForm,
		TotalLinksCount:        result.TotalLinksCount,
		ResponseTimeMs:         result.ResponseTimeMs,
		PageSizeBytes:          result.PageSizeBytes,
	}
}

// saveLinks saves detailed link information to the database
func (p *Processor) saveLinks(taskID int, links []LinkInfo) error {
	for _, link := range links {
		dbLink := &db.CrawlLink{
			TaskID:         taskID,
			URL:            link.URL,
			LinkType:       link.LinkType,
			IsAccessible:   link.IsAccessible,
			ResponseTimeMs: link.ResponseTime,
		}

		if link.StatusCode > 0 {
			dbLink.StatusCode = &link.StatusCode
		}

		if link.AnchorText != "" {
			dbLink.AnchorText = &link.AnchorText
		}

		if link.IsAccessible {
			now := time.Now()
			dbLink.CheckedAt = &now
		}

		if err := p.linkRepo.Create(dbLink); err != nil {
			log.Printf("Failed to save link %s: %v", link.URL, err)
			// Continue with other links instead of failing completely
		}
	}

	return nil
}

// sendProgressUpdate sends progress updates via WebSocket
func (p *Processor) sendProgressUpdate(userID, taskID int, progress float64, message string) {
	update := map[string]interface{}{
		"type":     "progress_update",
		"task_id":  taskID,
		"progress": progress,
		"message":  message,
	}

	if data, err := json.Marshal(update); err == nil {
		p.wsHub.BroadcastToUser(userID, data)
	} else {
		log.Printf("Failed to marshal progress update: %v", err)
	}
}

// sendResultsUpdate sends final results via WebSocket
func (p *Processor) sendResultsUpdate(userID, taskID int, result *db.CrawlResult) {
	update := map[string]interface{}{
		"type":    "results_update",
		"task_id": taskID,
		"results": result,
	}

	if data, err := json.Marshal(update); err == nil {
		p.wsHub.BroadcastToUser(userID, data)
	} else {
		log.Printf("Failed to marshal results update: %v", err)
	}
}
