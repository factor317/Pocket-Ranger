#!/bin/bash

# Pocket Ranger Deployment Script
# Usage: ./scripts/deploy.sh [environment] [platform]
# Example: ./scripts/deploy.sh production docker
#          ./scripts/deploy.sh staging k8s

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT=${1:-development}
PLATFORM=${2:-docker}
IMAGE_TAG=${3:-latest}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validation functions
validate_environment() {
    case $ENVIRONMENT in
        development|staging|production)
            log_info "Deploying to $ENVIRONMENT environment"
            ;;
        *)
            log_error "Invalid environment: $ENVIRONMENT"
            log_info "Valid environments: development, staging, production"
            exit 1
            ;;
    esac
}

validate_platform() {
    case $PLATFORM in
        docker|k8s|gcp|aws|azure|ibm)
            log_info "Using $PLATFORM platform"
            ;;
        *)
            log_error "Invalid platform: $PLATFORM"
            log_info "Valid platforms: docker, k8s, gcp, aws, azure, ibm"
            exit 1
            ;;
    esac
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if required tools are installed
    case $PLATFORM in
        docker)
            if ! command -v docker &> /dev/null; then
                log_error "Docker is not installed"
                exit 1
            fi
            if ! command -v docker-compose &> /dev/null; then
                log_error "Docker Compose is not installed"
                exit 1
            fi
            ;;
        k8s)
            if ! command -v kubectl &> /dev/null; then
                log_error "kubectl is not installed"
                exit 1
            fi
            ;;
        gcp)
            if ! command -v gcloud &> /dev/null; then
                log_error "gcloud CLI is not installed"
                exit 1
            fi
            ;;
        aws)
            if ! command -v aws &> /dev/null; then
                log_error "AWS CLI is not installed"
                exit 1
            fi
            ;;
        azure)
            if ! command -v az &> /dev/null; then
                log_error "Azure CLI is not installed"
                exit 1
            fi
            ;;
        ibm)
            if ! command -v ibmcloud &> /dev/null; then
                log_error "IBM Cloud CLI is not installed"
                exit 1
            fi
            ;;
    esac
    
    log_success "Prerequisites check passed"
}

# Build functions
build_application() {
    log_info "Building application..."
    
    cd "$PROJECT_ROOT"
    
    # Install dependencies
    log_info "Installing dependencies..."
    npm ci
    
    # Run tests
    log_info "Running tests..."
    npm test
    
    # Build application
    log_info "Building application..."
    npm run build:web
    
    log_success "Application built successfully"
}

build_docker_image() {
    log_info "Building Docker image..."
    
    cd "$PROJECT_ROOT"
    
    # Build image with appropriate tag
    docker build -t "pocket-ranger:$IMAGE_TAG" .
    
    # Tag for environment
    docker tag "pocket-ranger:$IMAGE_TAG" "pocket-ranger:$ENVIRONMENT"
    
    log_success "Docker image built successfully"
}

# Deployment functions
deploy_docker() {
    log_info "Deploying with Docker Compose..."
    
    cd "$PROJECT_ROOT"
    
    # Choose appropriate compose file
    case $ENVIRONMENT in
        development)
            COMPOSE_FILE="docker-compose.dev.yml"
            ;;
        staging|production)
            COMPOSE_FILE="docker-compose.yml"
            ;;
    esac
    
    # Stop existing containers
    docker-compose -f "$COMPOSE_FILE" down
    
    # Start new containers
    docker-compose -f "$COMPOSE_FILE" up -d
    
    # Wait for health check
    log_info "Waiting for application to be healthy..."
    sleep 30
    
    # Check health
    if curl -f http://localhost:8081/api/health > /dev/null 2>&1; then
        log_success "Application is healthy and running"
    else
        log_error "Application health check failed"
        docker-compose -f "$COMPOSE_FILE" logs
        exit 1
    fi
}

deploy_k8s() {
    log_info "Deploying to Kubernetes..."
    
    cd "$PROJECT_ROOT"
    
    # Create namespace if it doesn't exist
    kubectl create namespace pocket-ranger --dry-run=client -o yaml | kubectl apply -f -
    
    # Apply configurations
    kubectl apply -f k8s/
    
    # Wait for deployment to be ready
    log_info "Waiting for deployment to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/pocket-ranger-app -n pocket-ranger
    
    # Check pod status
    kubectl get pods -n pocket-ranger
    
    log_success "Kubernetes deployment completed"
}

deploy_gcp() {
    log_info "Deploying to Google Cloud Platform..."
    
    # Set project
    gcloud config set project pocket-ranger-gcp
    
    # Build and push to GCR
    gcloud builds submit --tag gcr.io/pocket-ranger-gcp/pocket-ranger:$IMAGE_TAG
    
    # Deploy to GKE
    gcloud container clusters get-credentials pocket-ranger-cluster --zone us-central1-a
    
    # Update deployment image
    kubectl set image deployment/pocket-ranger-app pocket-ranger=gcr.io/pocket-ranger-gcp/pocket-ranger:$IMAGE_TAG -n pocket-ranger
    
    # Wait for rollout
    kubectl rollout status deployment/pocket-ranger-app -n pocket-ranger
    
    log_success "GCP deployment completed"
}

deploy_aws() {
    log_info "Deploying to Amazon Web Services..."
    
    # Get ECR login
    aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-west-2.amazonaws.com
    
    # Tag and push image
    docker tag pocket-ranger:$IMAGE_TAG 123456789012.dkr.ecr.us-west-2.amazonaws.com/pocket-ranger:$IMAGE_TAG
    docker push 123456789012.dkr.ecr.us-west-2.amazonaws.com/pocket-ranger:$IMAGE_TAG
    
    # Update EKS deployment
    aws eks update-kubeconfig --region us-west-2 --name pocket-ranger-cluster
    kubectl set image deployment/pocket-ranger-app pocket-ranger=123456789012.dkr.ecr.us-west-2.amazonaws.com/pocket-ranger:$IMAGE_TAG -n pocket-ranger
    
    # Wait for rollout
    kubectl rollout status deployment/pocket-ranger-app -n pocket-ranger
    
    log_success "AWS deployment completed"
}

deploy_azure() {
    log_info "Deploying to Microsoft Azure..."
    
    # Login to ACR
    az acr login --name pocketrangeracr
    
    # Tag and push image
    docker tag pocket-ranger:$IMAGE_TAG pocketrangeracr.azurecr.io/pocket-ranger:$IMAGE_TAG
    docker push pocketrangeracr.azurecr.io/pocket-ranger:$IMAGE_TAG
    
    # Update AKS deployment
    az aks get-credentials --resource-group pocket-ranger-rg --name pocket-ranger-cluster
    kubectl set image deployment/pocket-ranger-app pocket-ranger=pocketrangeracr.azurecr.io/pocket-ranger:$IMAGE_TAG -n pocket-ranger
    
    # Wait for rollout
    kubectl rollout status deployment/pocket-ranger-app -n pocket-ranger
    
    log_success "Azure deployment completed"
}

deploy_ibm() {
    log_info "Deploying to IBM Cloud..."
    
    # Login to IBM Container Registry
    ibmcloud cr login
    
    # Tag and push image
    docker tag pocket-ranger:$IMAGE_TAG us.icr.io/pocket-ranger/pocket-ranger:$IMAGE_TAG
    docker push us.icr.io/pocket-ranger/pocket-ranger:$IMAGE_TAG
    
    # Update IKS deployment
    ibmcloud ks cluster config --cluster pocket-ranger-cluster
    kubectl set image deployment/pocket-ranger-app pocket-ranger=us.icr.io/pocket-ranger/pocket-ranger:$IMAGE_TAG -n pocket-ranger
    
    # Wait for rollout
    kubectl rollout status deployment/pocket-ranger-app -n pocket-ranger
    
    log_success "IBM Cloud deployment completed"
}

# Cleanup function
cleanup() {
    log_info "Cleaning up temporary files..."
    # Add cleanup logic here if needed
}

# Main deployment function
main() {
    log_info "Starting Pocket Ranger deployment..."
    log_info "Environment: $ENVIRONMENT"
    log_info "Platform: $PLATFORM"
    log_info "Image Tag: $IMAGE_TAG"
    
    # Validate inputs
    validate_environment
    validate_platform
    check_prerequisites
    
    # Build application
    build_application
    
    # Build Docker image for container platforms
    if [[ "$PLATFORM" != "docker" ]] || [[ "$ENVIRONMENT" != "development" ]]; then
        build_docker_image
    fi
    
    # Deploy based on platform
    case $PLATFORM in
        docker)
            deploy_docker
            ;;
        k8s)
            deploy_k8s
            ;;
        gcp)
            deploy_gcp
            ;;
        aws)
            deploy_aws
            ;;
        azure)
            deploy_azure
            ;;
        ibm)
            deploy_ibm
            ;;
    esac
    
    # Cleanup
    cleanup
    
    log_success "Deployment completed successfully!"
    log_info "Application should be available at the configured endpoint"
}

# Trap for cleanup on exit
trap cleanup EXIT

# Run main function
main "$@"