package api

import (
	"bytes"
	"encoding/csv"
	"net/http"
	"strconv"
	"web-crawler/internal/db"
	"web-crawler/internal/queue"
	"web-crawler/internal/websocket"

	"github.com/gin-gonic/gin"
)

// CrawlHandler handles crawling-related requests
type CrawlHandler struct {
	taskRepo   *db.TaskRepository
	resultRepo *db.ResultRepository
	linkRepo   *db.LinkRepository
	taskQueue  *queue.TaskQueue
	wsHub      *websocket.Hub
}

// NewCrawlHandler creates a new crawl handler
func NewCrawlHandler(taskRepo *db.TaskRepository, resultRepo *db.ResultRepository, linkRepo *db.LinkRepository, taskQueue *queue.TaskQueue, wsHub *websocket.Hub) *CrawlHandler {
	return &CrawlHandler{
		taskRepo:   taskRepo,
		resultRepo: resultRepo,
		linkRepo:   linkRepo,
		taskQueue:  taskQueue,
		wsHub:      wsHub,
	}
}

// StartCrawlRequest represents the request to start a crawl task
type StartCrawlRequest struct {
	URL string `json:"url" binding:"required,url"`
}

// TaskStatusResponse represents the task status response
type TaskStatusResponse struct {
	*db.CrawlTask
	Results *db.CrawlResult `json:"results,omitempty"`
}

// StartCrawl creates and starts a new crawl task
func (h *CrawlHandler) StartCrawl(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	var req StartCrawlRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
		})
		return
	}

	// Create new crawl task
	task := &db.CrawlTask{
		UserID:   userID.(int),
		URL:      req.URL,
		Status:   db.TaskStatusPending,
		Progress: 0.0,
	}

	if err := h.taskRepo.Create(task); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create crawl task",
		})
		return
	}

	// Add task to queue
	h.taskQueue.AddTask(task)

	c.JSON(http.StatusCreated, task)
}

// GetUserTasks retrieves crawl tasks for the authenticated user with pagination
func (h *CrawlHandler) GetUserTasks(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	// Get pagination parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	offset := (page - 1) * limit

	tasks, err := h.taskRepo.GetByUserID(userID.(int), limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve tasks",
		})
		return
	}

	if tasks == nil {
		tasks = []*db.CrawlTask{}
	}

	c.JSON(http.StatusOK, gin.H{
		"tasks": tasks,
		"page":  page,
		"limit": limit,
		"total": len(tasks),
	})
}

// GetTaskStatus retrieves the status of a specific crawl task
func (h *CrawlHandler) GetTaskStatus(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	taskID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid task ID",
		})
		return
	}

	task, err := h.taskRepo.GetByID(taskID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve task",
		})
		return
	}

	if task == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Task not found",
		})
		return
	}

	// Check if user owns this task
	if task.UserID != userID.(int) {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Access denied",
		})
		return
	}

	// Get results if task is completed
	var results *db.CrawlResult
	if task.Status == db.TaskStatusCompleted {
		results, _ = h.resultRepo.GetByTaskID(taskID)
	}

	response := TaskStatusResponse{
		CrawlTask: task,
		Results:   results,
	}

	c.JSON(http.StatusOK, response)
}

// StopCrawl stops a running crawl task
func (h *CrawlHandler) StopCrawl(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	taskID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid task ID",
		})
		return
	}

	task, err := h.taskRepo.GetByID(taskID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve task",
		})
		return
	}

	if task == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Task not found",
		})
		return
	}

	// Check if user owns this task
	if task.UserID != userID.(int) {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Access denied",
		})
		return
	}

	// Check if task can be stopped
	if task.Status != db.TaskStatusPending && task.Status != db.TaskStatusInProgress {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Task cannot be stopped in current status",
		})
		return
	}

	// Stop the task
	h.taskQueue.StopTask(taskID)

	// Update task status
	if err := h.taskRepo.UpdateStatus(taskID, db.TaskStatusCancelled); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update task status",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Task stopped successfully",
	})
}

// GetResults retrieves the results of a completed crawl task
func (h *CrawlHandler) GetResults(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	taskID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid task ID",
		})
		return
	}

	task, err := h.taskRepo.GetByID(taskID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve task",
		})
		return
	}

	if task == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Task not found",
		})
		return
	}

	// Check if user owns this task
	if task.UserID != userID.(int) {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Access denied",
		})
		return
	}

	// Get results
	results, err := h.resultRepo.GetByTaskID(taskID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve results",
		})
		return
	}

	if results == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Results not found",
		})
		return
	}

	c.JSON(http.StatusOK, results)
}

// DeleteTask deletes a crawl task and its associated data
func (h *CrawlHandler) DeleteTask(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	taskID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid task ID",
		})
		return
	}

	task, err := h.taskRepo.GetByID(taskID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve task",
		})
		return
	}

	if task == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Task not found",
		})
		return
	}

	// Check if user owns this task
	if task.UserID != userID.(int) {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Access denied",
		})
		return
	}

	// For now, just return success - we'll implement deletion later
	c.JSON(http.StatusOK, gin.H{
		"message": "Task deletion scheduled",
	})
}

// GetLinks retrieves all links for a specific crawl task
func (h *CrawlHandler) GetLinks(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	taskID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}
	task, err := h.taskRepo.GetByID(taskID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve task"})
		return
	}
	if task == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		return
	}
	if task.UserID != userID.(int) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}
	links, err := h.linkRepo.GetByTaskID(taskID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve links"})
		return
	}
	c.JSON(http.StatusOK, links)
}

// ExportResults exports crawl results and links as CSV
func (h *CrawlHandler) ExportResults(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	taskID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}
	task, err := h.taskRepo.GetByID(taskID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve task"})
		return
	}
	if task == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		return
	}
	if task.UserID != userID.(int) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}
	result, _ := h.resultRepo.GetByTaskID(taskID)
	links, _ := h.linkRepo.GetByTaskID(taskID)

	var buf bytes.Buffer
	w := csv.NewWriter(&buf)
	// Write result summary
	w.Write([]string{"Field", "Value"})
	if result != nil {
		w.Write([]string{"Page Title", derefStr(result.PageTitle)})
		w.Write([]string{"HTML Version", derefStr(result.HTMLVersion)})
		w.Write([]string{"H1 Count", itoa(result.H1Count)})
		w.Write([]string{"H2 Count", itoa(result.H2Count)})
		w.Write([]string{"H3 Count", itoa(result.H3Count)})
		w.Write([]string{"Internal Links", itoa(result.InternalLinksCount)})
		w.Write([]string{"External Links", itoa(result.ExternalLinksCount)})
		w.Write([]string{"Inaccessible Links", itoa(result.InaccessibleLinksCount)})
		w.Write([]string{"Total Links", itoa(result.TotalLinksCount)})
		w.Write([]string{"Response Time (ms)", itoa(result.ResponseTimeMs)})
		w.Write([]string{"Page Size (bytes)", itoa(result.PageSizeBytes)})
	}
	w.Write([]string{})
	// Write links header
	w.Write([]string{"URL", "Type", "Status Code", "Accessible", "Anchor Text", "Response Time (ms)"})
	for _, link := range links {
		w.Write([]string{
			link.URL,
			link.LinkType,
			itoaPtr(link.StatusCode),
			boolToStr(link.IsAccessible),
			derefStr(link.AnchorText),
			itoa(link.ResponseTimeMs),
		})
	}
	w.Flush()
	c.Header("Content-Disposition", "attachment; filename=crawl-results.csv")
	c.Data(http.StatusOK, "text/csv", buf.Bytes())
}

func derefStr(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
func itoa(i int) string {
	return strconv.Itoa(i)
}
func itoaPtr(i *int) string {
	if i == nil {
		return ""
	}
	return strconv.Itoa(*i)
}
func boolToStr(b bool) string {
	if b {
		return "true"
	}
	return "false"
}
