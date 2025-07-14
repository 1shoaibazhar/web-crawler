# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies first (for better caching)
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY frontend/ .

# Build argument to determine mode
ARG BUILD_MODE=development

# Build the application if in production mode
RUN if [ "$BUILD_MODE" = "production" ]; then \
        npm run build; \
    fi

# Expose port
EXPOSE 3000

# Start the application based on build mode
CMD if [ "$BUILD_MODE" = "production" ]; then \
        npx serve -s dist -l 3000; \
    else \
        npm run dev -- --host 0.0.0.0; \
    fi 