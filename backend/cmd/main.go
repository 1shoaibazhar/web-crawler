package main

import (
	"log"
	"net/http"
	"os"
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

	// Initialize task queue
	taskQueue := queue.NewTaskQueue()

	// Initialize WebSocket hub
	wsHub := websocket.NewHub()
	go wsHub.Run()

	// Initialize Gin router
	r := gin.Default()

	// Add CORS middleware
	r.Use(middleware.CORSMiddleware())

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "healthy",
			"service": "web-crawler",
		})
	})

	// API routes
	api.SetupRoutes(r, database, taskQueue, wsHub)

	// WebSocket endpoint
	r.GET("/ws", func(c *gin.Context) {
		websocket.ServeWS(wsHub, c.Writer, c.Request)
	})

	// Get port from environment or use default
	port := os.Getenv("SERVER_PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	log.Fatal(r.Run(":" + port))
} 