package queue

import (
	"log"
	"sync"
	"web-crawler/internal/crawler"
	"web-crawler/internal/db"
	"web-crawler/internal/websocket"
)

// TaskQueue manages crawling tasks
type TaskQueue struct {
	mu        sync.RWMutex
	tasks     map[int]*db.CrawlTask
	stopChan  map[int]chan bool
	processor *crawler.Processor
}

// NewTaskQueue creates a new task queue
func NewTaskQueue(taskRepo *db.TaskRepository, resultRepo *db.ResultRepository, linkRepo *db.LinkRepository, wsHub *websocket.Hub) *TaskQueue {
	return &TaskQueue{
		tasks:     make(map[int]*db.CrawlTask),
		stopChan:  make(map[int]chan bool),
		processor: crawler.NewProcessor(taskRepo, resultRepo, linkRepo, wsHub),
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

// processTask processes a single crawl task using the crawler processor
func (tq *TaskQueue) processTask(task *db.CrawlTask) {
	taskID := task.ID
	stopCh := tq.stopChan[taskID]

	defer func() {
		tq.mu.Lock()
		delete(tq.tasks, taskID)
		delete(tq.stopChan, taskID)
		tq.mu.Unlock()
	}()

	log.Printf("Starting to process task %d with crawler", taskID)

	// Use the crawler processor to handle the task
	if err := tq.processor.ProcessTask(task, stopCh); err != nil {
		log.Printf("Failed to process task %d: %v", taskID, err)
	} else {
		log.Printf("Task %d processed successfully", taskID)
	}
}
