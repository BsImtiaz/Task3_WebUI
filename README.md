Task3_WebUI - Task Management System
A modern web application built with React 19, TypeScript, and Ant Design for task management. Provides a complete frontend interface for CRUD operations, search functionality, and command execution with focus on usability and accessibility.

Features
-Complete task management (Create, Read, Update, Delete)
-Advanced search and filtering
-Command execution interface
-Responsive design with Ant Design
-TypeScript for type safety
-Accessibility-focused components
-Kubernetes deployment ready

Tech Stack
-Frontend:
-React 19
-TypeScript
-Ant Design
-Axios for API calls

Backend:
-Spring Boot
-MongoDB
-REST APIs

Deployment:
-Docker
-Kubernetes

Project Structure
taskapi/
src/ (Spring Boot backend)
taskapi-frontend/ (React frontend)
task-frontend/ (Alternative frontend)
kubernetes-mongodb/ (MongoDB K8s config)
k8s/ (Kubernetes deployment files)
Screenshots/ (Application screenshots)
task3-submission/ (Submission files)

Quick Start
Prerequisites:
-Node.js 18+
-Java 17+
-MongoDB

Backend Setup:
-cd taskapi
-./mvnw spring-boot:run

Frontend Setup:
-cd taskapi-frontend
-npm install
-npm start

Docker Deployment:
-docker build -t taskapi .
-docker run -p 8080:8080 taskapi

Kubernetes Deployment:
-kubectl apply -f k8s/
-kubectl apply -f kubernetes-mongodb/

API Endpoints
-GET /api/tasks - Get all tasks
-GET /api/tasks/{id} - Get task by ID
-POST /api/tasks - Create new task
-PUT /api/tasks/{id} - Update task
-DELETE /api/tasks/{id} - Delete task
-POST /api/commands - Execute commands

UI Components
-Dashboard with task overview
-Task list with pagination and search
-Task form for create/edit operations
-Command console for executing system commands
-Responsive layout that works on mobile and desktop
