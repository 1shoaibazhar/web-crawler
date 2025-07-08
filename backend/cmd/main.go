package main

import (
	"log"
	"net/http"
	"strconv"
	"web-crawler/config"
	"web-crawler/internal/api"
	"web-crawler/internal/db"
	"web-crawler/internal/middleware"
	"web-crawler/internal/queue"
	"web-crawler/internal/websocket"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Initialize database
	database, err := db.Initialize()
	if err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	defer database.Close()

	// Initialize repositories
	taskRepo := db.NewTaskRepository(database)
	resultRepo := db.NewResultRepository(database)
	linkRepo := db.NewLinkRepository(database)

	// Initialize WebSocket hub
	wsHub := websocket.NewHub()
	go wsHub.Run()

	// Initialize task queue with dependencies
	taskQueue := queue.NewTaskQueue(taskRepo, resultRepo, linkRepo, wsHub)

	// Initialize Gin router
	r := gin.Default()

	// Add CORS middleware
	r.Use(middleware.CORSMiddleware())

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "healthy",
			"service": "web-crawler",
		})
	})

	// API routes
	api.SetupRoutes(r, database, taskQueue, wsHub)

	// WebSocket endpoint
	r.GET("/ws", func(c *gin.Context) {
		websocket.ServeWS(wsHub, c.Writer, c.Request)
	})

	// Get port from config
	cfg := config.Load()
	port := strconv.Itoa(cfg.Server.Port)

	log.Printf("Server starting on port %s", port)
	log.Fatal(r.Run(":" + port))
}
