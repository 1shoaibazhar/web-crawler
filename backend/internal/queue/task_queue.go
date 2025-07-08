package queue

import (
	"log"
	"sync"
	"web-crawler/internal/db"
)

// TaskQueue manages crawling tasks
type TaskQueue struct {
	mu       sync.RWMutex
	tasks    map[int]*db.CrawlTask
	stopChan map[int]chan bool
}

// NewTaskQueue creates a new task queue
func NewTaskQueue() *TaskQueue {
	return &TaskQueue{
		tasks:    make(map[int]*db.CrawlTask),
		stopChan: make(map[int]chan bool),
	}
}

// AddTask adds a new task to the queue
func (tq *TaskQueue) AddTask(task *db.CrawlTask) {
	tq.mu.Lock()
	defer tq.mu.Unlock()

	tq.tasks[task.ID] = task
	tq.stopChan[task.ID] = make(chan bool, 1)

	log.Printf("Task %d added to queue for URL: %s", task.ID, task.URL)

	// Start processing the task in a goroutine
	go tq.processTask(task)
}

// StopTask stops a running task
func (tq *TaskQueue) StopTask(taskID int) {
	tq.mu.Lock()
	defer tq.mu.Unlock()

	if stopCh, exists := tq.stopChan[taskID]; exists {
		select {
		case stopCh <- true:
			log.Printf("Stop signal sent to task %d", taskID)
		default:
			log.Printf("Task %d already has stop signal", taskID)
		}
	}
}

// GetTask retrieves a task by ID
func (tq *TaskQueue) GetTask(taskID int) *db.CrawlTask {
	tq.mu.RLock()
	defer tq.mu.RUnlock()

	return tq.tasks[taskID]
}

// processTask processes a single crawl task (placeholder implementation)
func (tq *TaskQueue) processTask(task *db.CrawlTask) {
	taskID := task.ID
	stopCh := tq.stopChan[taskID]

	defer func() {
		tq.mu.Lock()
		delete(tq.tasks, taskID)
		delete(tq.stopChan, taskID)
		tq.mu.Unlock()
	}()

	log.Printf("Starting to process task %d", taskID)

	// This is a placeholder - actual crawling logic will be implemented later
	select {
	case <-stopCh:
		log.Printf("Task %d was stopped", taskID)
		return
	default:
		// Simulate some work
		log.Printf("Task %d processing completed (placeholder)", taskID)
	}
}
