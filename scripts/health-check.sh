#!/bin/bash

# Pocket Ranger Health Check Script
# Usage: ./scripts/health-check.sh [endpoint] [timeout]
# Example: ./scripts/health-check.sh http://localhost:8081 30

set -e

# Configuration
ENDPOINT=${1:-http://localhost:8081}
TIMEOUT=${2:-30}
MAX_RETRIES=10
RETRY_INTERVAL=3

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

# Health check function
check_health() {
    local url="$1"
    local timeout="$2"
    
    log_info "Checking health at: $url"
    
    # Use curl with timeout
    if curl -f -s --max-time "$timeout" "$url/api/health" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Detailed health check
detailed_health_check() {
    local url="$1"
    
    log_info "Performing detailed health check..."
    
    # Check health endpoint
    local health_response
    health_response=$(curl -s --max-time 10 "$url/api/health" 2>/dev/null || echo "ERROR")
    
    if [[ "$health_response" == "ERROR" ]]; then
        log_error "Health endpoint is not responding"
        return 1
    fi
    
    log_success "Health endpoint response: $health_response"
    
    # Check main application endpoint
    local main_response_code
    main_response_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null || echo "000")
    
    if [[ "$main_response_code" == "200" ]]; then
        log_success "Main application endpoint is responding (HTTP $main_response_code)"
    else
        log_warning "Main application endpoint returned HTTP $main_response_code"
    fi
    
    # Check API endpoint
    local api_response_code
    api_response_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url/api/pocPlan" -X OPTIONS 2>/dev/null || echo "000")
    
    if [[ "$api_response_code" == "200" ]]; then
        log_success "API endpoint is responding (HTTP $api_response_code)"
    else
        log_warning "API endpoint returned HTTP $api_response_code"
    fi
    
    return 0
}

# Wait for application to be ready
wait_for_ready() {
    local url="$1"
    local timeout="$2"
    local retries=0
    
    log_info "Waiting for application to be ready (timeout: ${timeout}s)..."
    
    while [[ $retries -lt $MAX_RETRIES ]]; do
        if check_health "$url" 5; then
            log_success "Application is ready!"
            detailed_health_check "$url"
            return 0
        fi
        
        retries=$((retries + 1))
        log_info "Attempt $retries/$MAX_RETRIES failed, retrying in ${RETRY_INTERVAL}s..."
        sleep $RETRY_INTERVAL
    done
    
    log_error "Application failed to become ready within timeout"
    return 1
}

# Performance check
performance_check() {
    local url="$1"
    
    log_info "Performing performance check..."
    
    # Measure response time
    local response_time
    response_time=$(curl -s -o /dev/null -w "%{time_total}" --max-time 10 "$url/api/health" 2>/dev/null || echo "0")
    
    if (( $(echo "$response_time > 0" | bc -l) )); then
        log_info "Health endpoint response time: ${response_time}s"
        
        if (( $(echo "$response_time < 1.0" | bc -l) )); then
            log_success "Response time is good (< 1s)"
        elif (( $(echo "$response_time < 3.0" | bc -l) )); then
            log_warning "Response time is acceptable (< 3s)"
        else
            log_warning "Response time is slow (> 3s)"
        fi
    else
        log_error "Could not measure response time"
    fi
    
    # Test API endpoint performance
    local api_response_time
    api_response_time=$(curl -s -o /dev/null -w "%{time_total}" --max-time 10 \
        -X POST "$url/api/pocPlan" \
        -H "Content-Type: application/json" \
        -d '{"userInput": "test"}' 2>/dev/null || echo "0")
    
    if (( $(echo "$api_response_time > 0" | bc -l) )); then
        log_info "API endpoint response time: ${api_response_time}s"
    else
        log_warning "Could not measure API response time"
    fi
}

# Kubernetes health check
k8s_health_check() {
    log_info "Checking Kubernetes deployment health..."
    
    # Check if kubectl is available
    if ! command -v kubectl &> /dev/null; then
        log_warning "kubectl not found, skipping Kubernetes checks"
        return 0
    fi
    
    # Check deployment status
    local deployment_status
    deployment_status=$(kubectl get deployment pocket-ranger-app -n pocket-ranger -o jsonpath='{.status.conditions[?(@.type=="Available")].status}' 2>/dev/null || echo "Unknown")
    
    if [[ "$deployment_status" == "True" ]]; then
        log_success "Kubernetes deployment is available"
    else
        log_warning "Kubernetes deployment status: $deployment_status"
    fi
    
    # Check pod status
    local ready_pods
    local total_pods
    ready_pods=$(kubectl get deployment pocket-ranger-app -n pocket-ranger -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
    total_pods=$(kubectl get deployment pocket-ranger-app -n pocket-ranger -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "0")
    
    log_info "Ready pods: $ready_pods/$total_pods"
    
    if [[ "$ready_pods" == "$total_pods" ]] && [[ "$total_pods" != "0" ]]; then
        log_success "All pods are ready"
    else
        log_warning "Not all pods are ready"
        
        # Show pod details
        kubectl get pods -n pocket-ranger -l app=pocket-ranger 2>/dev/null || true
    fi
}

# Docker health check
docker_health_check() {
    log_info "Checking Docker container health..."
    
    # Check if docker is available
    if ! command -v docker &> /dev/null; then
        log_warning "Docker not found, skipping Docker checks"
        return 0
    fi
    
    # Find running containers
    local containers
    containers=$(docker ps --filter "name=pocket-ranger" --format "{{.Names}}" 2>/dev/null || echo "")
    
    if [[ -n "$containers" ]]; then
        log_success "Found running containers: $containers"
        
        # Check container health
        for container in $containers; do
            local health_status
            health_status=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "unknown")
            
            case $health_status in
                "healthy")
                    log_success "Container $container is healthy"
                    ;;
                "unhealthy")
                    log_error "Container $container is unhealthy"
                    ;;
                "starting")
                    log_info "Container $container is starting"
                    ;;
                *)
                    log_info "Container $container health status: $health_status"
                    ;;
            esac
        done
    else
        log_warning "No running Pocket Ranger containers found"
    fi
}

# Main function
main() {
    log_info "Starting Pocket Ranger health check..."
    log_info "Endpoint: $ENDPOINT"
    log_info "Timeout: ${TIMEOUT}s"
    
    # Wait for application to be ready
    if wait_for_ready "$ENDPOINT" "$TIMEOUT"; then
        # Perform additional checks
        performance_check "$ENDPOINT"
        k8s_health_check
        docker_health_check
        
        log_success "All health checks completed successfully!"
        exit 0
    else
        log_error "Health check failed!"
        
        # Show additional debugging info
        log_info "Debugging information:"
        
        # Try to get more details about the failure
        curl -v "$ENDPOINT/api/health" 2>&1 || true
        
        exit 1
    fi
}

# Check if bc is available for floating point comparisons
if ! command -v bc &> /dev/null; then
    log_warning "bc not found, some performance checks will be skipped"
fi

# Run main function
main "$@"