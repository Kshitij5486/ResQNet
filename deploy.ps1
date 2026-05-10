# ResQNet Kubernetes Deploy Script for Windows
# Usage: .\deploy.ps1 [build|deploy|status|delete]

param([string]$Action = "status")

$NAMESPACE = "resqnet"
$REGISTRY  = "resqnet"

Write-Host "ResQNet Kubernetes Deployment" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan

function Build-Images {
    Write-Host "Building Docker images..." -ForegroundColor Yellow

    $services = @("user-service","emergency-service","dispatch-service","api-gateway")
    foreach ($svc in $services) {
        Write-Host "Building $svc..." -ForegroundColor Cyan
        Push-Location "services\$svc"
        mvn clean package -DskipTests -q
        docker build -t "$REGISTRY/${svc}:latest" .
        Pop-Location
    }

    Write-Host "Building ai-service..." -ForegroundColor Cyan
    docker build -t "$REGISTRY/ai-service:latest" services\ai-service\

    Write-Host "Building frontend..." -ForegroundColor Cyan
    docker build -t "$REGISTRY/frontend:latest" frontend\

    Write-Host "All images built!" -ForegroundColor Green
}

function Deploy {
    Write-Host "Deploying to Kubernetes..." -ForegroundColor Yellow
    kubectl apply -k k8s\
    Write-Host "Deployment complete!" -ForegroundColor Green
    Get-Status
}

function Get-Status {
    Write-Host "`n=== Pods ===" -ForegroundColor Cyan
    kubectl get pods -n $NAMESPACE
    Write-Host "`n=== Services ===" -ForegroundColor Cyan
    kubectl get services -n $NAMESPACE
    Write-Host "`n=== HPA ===" -ForegroundColor Cyan
    kubectl get hpa -n $NAMESPACE
    Write-Host "`n=== Ingress ===" -ForegroundColor Cyan
    kubectl get ingress -n $NAMESPACE
}

function Remove-All {
    Write-Host "Deleting ResQNet from Kubernetes..." -ForegroundColor Red
    kubectl delete namespace $NAMESPACE
    Write-Host "Deleted!" -ForegroundColor Green
}

switch ($Action) {
    "build"  { Build-Images }
    "deploy" { Deploy       }
    "status" { Get-Status   }
    "delete" { Remove-All   }
    default  {
        Write-Host "Usage: .\deploy.ps1 [build|deploy|status|delete]" -ForegroundColor Yellow
    }
}