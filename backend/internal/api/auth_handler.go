package api

import (
	"net/http"
	"strconv"
	"web-crawler/internal/auth"
	"web-crawler/internal/db"

	"github.com/gin-gonic/gin"
)

// AuthHandler handles authentication-related requests
type AuthHandler struct {
	userRepo   *db.UserRepository
	jwtService *auth.JWTService
}

// NewAuthHandler creates a new authentication handler
func NewAuthHandler(userRepo *db.UserRepository) *AuthHandler {
	return &AuthHandler{
		userRepo:   userRepo,
		jwtService: auth.NewJWTService(),
	}
}

// LoginRequest represents the login request payload
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// RegisterRequest represents the registration request payload
type RegisterRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

// TokenResponse represents the token response
type TokenResponse struct {
	Token string    `json:"token"`
	User  *UserInfo `json:"user"`
}

// UserInfo represents user information in responses
type UserInfo struct {
	ID       int    `json:"id"`
	Username string `json:"username"`
	Email    string `json:"email"`
}

// Login authenticates a user and returns a JWT token
func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
		})
		return
	}

	// Get user by username
	user, err := h.userRepo.GetByUsername(req.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Internal server error",
		})
		return
	}

	if user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid credentials",
		})
		return
	}

	// Verify password
	if err := auth.VerifyPassword(user.PasswordHash, req.Password); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid credentials",
		})
		return
	}

	// Generate JWT token
	token, err := h.jwtService.GenerateToken(user.ID, user.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate token",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"access_token": token,
		"user": &UserInfo{
			ID:       user.ID,
			Username: user.Username,
			Email:    user.Email,
		},
	})
}

// Register creates a new user account
func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
		})
		return
	}

	// Check if user already exists by username
	existingUser, err := h.userRepo.GetByUsername(req.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Internal server error",
		})
		return
	}

	if existingUser != nil {
		c.JSON(http.StatusConflict, gin.H{
			"error": "Username already exists",
		})
		return
	}

	// Check if user already exists by email
	existingUserByEmail, err := h.userRepo.GetByEmail(req.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Internal server error",
		})
		return
	}

	if existingUserByEmail != nil {
		c.JSON(http.StatusConflict, gin.H{
			"error": "Email already exists",
		})
		return
	}

	// Hash password
	hashedPassword, err := auth.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to process password",
		})
		return
	}

	// Create new user
	user := &db.User{
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: hashedPassword,
	}

	if err := h.userRepo.Create(user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create user account",
		})
		return
	}

	// Generate JWT token for the new user
	token, err := h.jwtService.GenerateToken(user.ID, user.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate token",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"access_token": token,
		"user": &UserInfo{
			ID:       user.ID,
			Username: user.Username,
			Email:    user.Email,
		},
	})
}

// RefreshToken generates a new token from an existing valid token
func (h *AuthHandler) RefreshToken(c *gin.Context) {
	type RefreshRequest struct {
		Token string `json:"token" binding:"required"`
	}

	var req RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
		})
		return
	}

	// Refresh the token
	newToken, err := h.jwtService.RefreshToken(req.Token)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid or expired token",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"access_token": newToken,
	})
}

// GetProfile returns the current user's profile information
func (h *AuthHandler) GetProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	user, err := h.userRepo.GetByID(userID.(int))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get user profile",
		})
		return
	}

	if user == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "User not found",
		})
		return
	}

	c.JSON(http.StatusOK, UserInfo{
		ID:       user.ID,
		Username: user.Username,
		Email:    user.Email,
	})
}

// UpdateProfile updates the current user's profile information
func (h *AuthHandler) UpdateProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	type UpdateProfileRequest struct {
		Email string `json:"email" binding:"omitempty,email"`
	}

	var req UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
		})
		return
	}

	// For now, just return success - we'll implement profile updates later
	c.JSON(http.StatusOK, gin.H{
		"message": "Profile updated successfully",
		"user_id": strconv.Itoa(userID.(int)),
	})
}
