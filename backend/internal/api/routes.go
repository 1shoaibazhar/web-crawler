package api

import (
	"database/sql"
	"web-crawler/internal/db"
	"web-crawler/internal/middleware"
	"web-crawler/internal/queue"
	"web-crawler/internal/websocket"

	"github.com/gin-gonic/gin"
)

// SetupRoutes configures all API routes
func SetupRoutes(r *gin.Engine, database *sql.DB, taskQueue *queue.TaskQueue, wsHub *websocket.Hub) {
	// Initialize repositories
	userRepo := db.NewUserRepository(database)
	taskRepo := db.NewTaskRepository(database)
	resultRepo := db.NewResultRepository(database)

	// Initialize handlers
	authHandler := NewAuthHandler(userRepo)
	crawlHandler := NewCrawlHandler(taskRepo, resultRepo, taskQueue, wsHub)

	// API v1 group
	v1 := r.Group("/api/v1")
	{
		// Authentication routes (no auth required)
		auth := v1.Group("/auth")
		{
			auth.POST("/login", authHandler.Login)
			auth.POST("/register", authHandler.Register)
			auth.POST("/refresh", authHandler.RefreshToken)
		}

		// Protected routes (auth required)
		protected := v1.Group("/")
		protected.Use(middleware.AuthMiddleware())
		{
			// User routes
			user := protected.Group("/user")
			{
				user.GET("/profile", authHandler.GetProfile)
				user.PUT("/profile", authHandler.UpdateProfile)
			}

			// Crawl routes
			crawl := protected.Group("/crawl")
			{
				crawl.POST("/", crawlHandler.StartCrawl)
				crawl.GET("/", crawlHandler.GetUserTasks)
				crawl.GET("/:id", crawlHandler.GetTaskStatus)
				crawl.PUT("/:id/stop", crawlHandler.StopCrawl)
				crawl.GET("/:id/results", crawlHandler.GetResults)
				crawl.DELETE("/:id", crawlHandler.DeleteTask)
			}
		}
	}
}
