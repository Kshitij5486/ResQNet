#!/bin/bash
# ResQNet Kubernetes Deploy Script
# Usage: ./deploy.sh [build|deploy|status|delete]

set -e

NAMESPACE="resqnet"
REGISTRY="resqnet"

echo "ResQNet Kubernetes Deployment"
echo "=============================="

build_images() {
    echo "Building Docker images..."

    echo "Building user-service..."
    cd services/user-service
    mvn clean package -DskipTests -q
    docker build -t $REGISTRY/user-service:latest .
    cd ../..

    echo "Building emergency-service..."
    cd services/emergency-service
    mvn clean package -DskipTests -q
    docker build -t $REGISTRY/emergency-service:latest .
    cd ../..

    echo "Building dispatch-service..."
    cd services/dispatch-service
    mvn clean package -DskipTests -q
    docker build -t $REGISTRY/dispatch-service:latest .
    cd ../..

    echo "Building api-gateway..."
    cd services/api-gateway
    mvn clean package -DskipTests -q
    docker build -t $REGISTRY/api-gateway:latest .
    cd ../..

    echo "Building ai-service..."
    docker build -t $REGISTRY/ai-service:latest services/ai-service/
    cd ..

    echo "Building frontend..."
    docker build -t $REGISTRY/frontend:latest frontend/

    echo "All images built successfully!"
}

deploy() {
    echo "Deploying to Kubernetes..."
    kubectl apply -k k8s/
    echo ""
    echo "Waiting for pods to be ready..."
    kubectl wait --for=condition=ready pod -l app=postgres         -n $NAMESPACE --timeout=120s
    kubectl wait --for=condition=ready pod -l app=redis            -n $NAMESPACE --timeout=60s
    kubectl wait --for=condition=ready pod -l app=kafka            -n $NAMESPACE --timeout=120s
    kubectl wait --for=condition=ready pod -l app=user-service     -n $NAMESPACE --timeout=180s
    kubectl wait --for=condition=ready pod -l app=emergency-service -n $NAMESPACE --timeout=180s
    kubectl wait --for=condition=ready pod -l app=dispatch-service  -n $NAMESPACE --timeout=180s
    kubectl wait --for=condition=ready pod -l app=api-gateway       -n $NAMESPACE --timeout=180s
    kubectl wait --for=condition=ready pod -l app=ai-service        -n $NAMESPACE --timeout=120s
    kubectl wait --for=condition=ready pod -l app=frontend          -n $NAMESPACE --timeout=60s
    echo ""
    echo "Deployment complete!"
    status
}

status() {
    echo ""
    echo "=== Pod Status ==="
    kubectl get pods -n $NAMESPACE
    echo ""
    echo "=== Services ==="
    kubectl get services -n $NAMESPACE
    echo ""
    echo "=== HPA Status ==="
    kubectl get hpa -n $NAMESPACE
    echo ""
    echo "=== Ingress ==="
    kubectl get ingress -n $NAMESPACE
}

delete() {
    echo "Deleting ResQNet from Kubernetes..."
    kubectl delete namespace $NAMESPACE
    echo "Deleted!"
}

case "$1" in
    build)   build_images ;;
    deploy)  deploy       ;;
    status)  status       ;;
    delete)  delete       ;;
    *)
        echo "Usage: $0 [build|deploy|status|delete]"
        echo ""
        echo "  build   - Build all Docker images"
        echo "  deploy  - Deploy to Kubernetes"
        echo "  status  - Show deployment status"
        echo "  delete  - Delete all resources"
        ;;
esac