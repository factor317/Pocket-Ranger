# Cloud Platform Deployment Guide - Pocket Ranger

## Overview

This comprehensive guide covers deployment of Pocket Ranger across major cloud platforms: Google Cloud Platform (GCP), Amazon Web Services (AWS), Microsoft Azure, and IBM Cloud. Each platform section includes specific configurations and best practices.

## Google Cloud Platform (GCP)

### Prerequisites

- GCP Account with billing enabled
- `gcloud` CLI installed and configured
- Docker installed
- Kubernetes Engine API enabled

### 1. Setup GCP Environment

```bash
# Set up project and authentication
gcloud auth login
gcloud config set project pocket-ranger-gcp
gcloud config set compute/zone us-central1-a

# Enable required APIs
gcloud services enable container.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### 2. Container Registry Setup

```bash
# Configure Docker for GCR
gcloud auth configure-docker

# Build and push image
docker build -t gcr.io/pocket-ranger-gcp/pocket-ranger:latest .
docker push gcr.io/pocket-ranger-gcp/pocket-ranger:latest
```

### 3. Google Kubernetes Engine (GKE) Deployment

```bash
# Create GKE cluster
gcloud container clusters create pocket-ranger-cluster \
  --num-nodes=3 \
  --machine-type=e2-medium \
  --enable-autoscaling \
  --min-nodes=1 \
  --max-nodes=10 \
  --enable-autorepair \
  --enable-autoupgrade \
  --zone=us-central1-a

# Get credentials
gcloud container clusters get-credentials pocket-ranger-cluster --zone=us-central1-a
```

### 4. GCP-Specific Kubernetes Manifests

```yaml
# gcp/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pocket-ranger-app
  namespace: pocket-ranger
spec:
  replicas: 3
  selector:
    matchLabels:
      app: pocket-ranger
  template:
    metadata:
      labels:
        app: pocket-ranger
    spec:
      containers:
      - name: pocket-ranger
        image: gcr.io/pocket-ranger-gcp/pocket-ranger:latest
        ports:
        - containerPort: 8081
        env:
        - name: NODE_ENV
          value: "production"
        - name: EXPO_PUBLIC_API_URL
          value: "https://api.pocketranger.app"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 8081
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 8081
          initialDelaySeconds: 5
          periodSeconds: 5
```

### 5. Cloud Build Configuration

```yaml
# cloudbuild.yaml
steps:
  # Build the container image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/pocket-ranger:$COMMIT_SHA', '.']
  # Push the container image to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/pocket-ranger:$COMMIT_SHA']
  # Deploy to GKE
  - name: 'gcr.io/cloud-builders/gke-deploy'
    args:
    - run
    - --filename=gcp/
    - --image=gcr.io/$PROJECT_ID/pocket-ranger:$COMMIT_SHA
    - --location=us-central1-a
    - --cluster=pocket-ranger-cluster
```

### 6. Firebase Integration

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Initialize Firebase project
firebase init

# Deploy Firebase configuration
firebase deploy --only hosting
```

### 7. GCP Load Balancer Setup

```yaml
# gcp/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: pocket-ranger-ingress
  annotations:
    kubernetes.io/ingress.global-static-ip-name: pocket-ranger-ip
    networking.gke.io/managed-certificates: pocket-ranger-ssl-cert
    kubernetes.io/ingress.class: "gce"
spec:
  rules:
  - host: pocketranger.app
    http:
      paths:
      - path: /*
        pathType: ImplementationSpecific
        backend:
          service:
            name: pocket-ranger-service
            port:
              number: 80
```

## Amazon Web Services (AWS)

### Prerequisites

- AWS Account with appropriate permissions
- AWS CLI installed and configured
- eksctl installed
- Docker installed

### 1. Setup AWS Environment

```bash
# Configure AWS CLI
aws configure

# Install eksctl
curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
sudo mv /tmp/eksctl /usr/local/bin
```

### 2. Elastic Container Registry (ECR) Setup

```bash
# Create ECR repository
aws ecr create-repository --repository-name pocket-ranger --region us-west-2

# Get login token
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-west-2.amazonaws.com

# Build and push image
docker build -t pocket-ranger .
docker tag pocket-ranger:latest 123456789012.dkr.ecr.us-west-2.amazonaws.com/pocket-ranger:latest
docker push 123456789012.dkr.ecr.us-west-2.amazonaws.com/pocket-ranger:latest
```

### 3. Elastic Kubernetes Service (EKS) Deployment

```bash
# Create EKS cluster
eksctl create cluster \
  --name pocket-ranger-cluster \
  --version 1.24 \
  --region us-west-2 \
  --nodegroup-name pocket-ranger-nodes \
  --node-type t3.medium \
  --nodes 3 \
  --nodes-min 1 \
  --nodes-max 10 \
  --managed

# Update kubeconfig
aws eks update-kubeconfig --region us-west-2 --name pocket-ranger-cluster
```

### 4. AWS-Specific Kubernetes Manifests

```yaml
# aws/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pocket-ranger-app
  namespace: pocket-ranger
spec:
  replicas: 3
  selector:
    matchLabels:
      app: pocket-ranger
  template:
    metadata:
      labels:
        app: pocket-ranger
    spec:
      containers:
      - name: pocket-ranger
        image: 123456789012.dkr.ecr.us-west-2.amazonaws.com/pocket-ranger:latest
        ports:
        - containerPort: 8081
        env:
        - name: NODE_ENV
          value: "production"
        - name: EXPO_PUBLIC_API_URL
          value: "https://api.pocketranger.app"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

### 5. Application Load Balancer Setup

```yaml
# aws/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: pocket-ranger-ingress
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:us-west-2:123456789012:certificate/your-cert-arn
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTP": 80}, {"HTTPS":443}]'
    alb.ingress.kubernetes.io/ssl-redirect: '443'
spec:
  rules:
  - host: pocketranger.app
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: pocket-ranger-service
            port:
              number: 80
```

### 6. AWS Load Balancer Controller

```bash
# Install AWS Load Balancer Controller
kubectl apply -k "github.com/aws/eks-charts/stable/aws-load-balancer-controller/crds?ref=master"

helm repo add eks https://aws.github.io/eks-charts
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=pocket-ranger-cluster \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller
```

### 7. RDS Database Setup (Future Enhancement)

```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier pocket-ranger-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username pocketranger \
  --master-user-password YourPassword123 \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-12345678 \
  --db-subnet-group-name pocket-ranger-subnet-group
```

## Microsoft Azure

### Prerequisites

- Azure Account with active subscription
- Azure CLI installed
- Docker installed
- kubectl installed

### 1. Setup Azure Environment

```bash
# Login to Azure
az login

# Set subscription
az account set --subscription "your-subscription-id"

# Create resource group
az group create --name pocket-ranger-rg --location eastus
```

### 2. Azure Container Registry (ACR) Setup

```bash
# Create ACR
az acr create --resource-group pocket-ranger-rg --name pocketrangeracr --sku Basic

# Login to ACR
az acr login --name pocketrangeracr

# Build and push image
docker build -t pocketrangeracr.azurecr.io/pocket-ranger:latest .
docker push pocketrangeracr.azurecr.io/pocket-ranger:latest
```

### 3. Azure Kubernetes Service (AKS) Deployment

```bash
# Create AKS cluster
az aks create \
  --resource-group pocket-ranger-rg \
  --name pocket-ranger-cluster \
  --node-count 3 \
  --enable-addons monitoring \
  --generate-ssh-keys \
  --attach-acr pocketrangeracr

# Get credentials
az aks get-credentials --resource-group pocket-ranger-rg --name pocket-ranger-cluster
```

### 4. Azure-Specific Kubernetes Manifests

```yaml
# azure/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pocket-ranger-app
  namespace: pocket-ranger
spec:
  replicas: 3
  selector:
    matchLabels:
      app: pocket-ranger
  template:
    metadata:
      labels:
        app: pocket-ranger
    spec:
      containers:
      - name: pocket-ranger
        image: pocketrangeracr.azurecr.io/pocket-ranger:latest
        ports:
        - containerPort: 8081
        env:
        - name: NODE_ENV
          value: "production"
        - name: EXPO_PUBLIC_API_URL
          value: "https://api.pocketranger.app"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

### 5. Azure Application Gateway Ingress

```yaml
# azure/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: pocket-ranger-ingress
  annotations:
    kubernetes.io/ingress.class: azure/application-gateway
    appgw.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - pocketranger.app
    secretName: pocket-ranger-tls
  rules:
  - host: pocketranger.app
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: pocket-ranger-service
            port:
              number: 80
```

### 6. Azure Database for PostgreSQL (Future Enhancement)

```bash
# Create PostgreSQL server
az postgres server create \
  --resource-group pocket-ranger-rg \
  --name pocket-ranger-db \
  --location eastus \
  --admin-user pocketranger \
  --admin-password YourPassword123 \
  --sku-name GP_Gen5_2 \
  --version 13
```

## IBM Cloud

### Prerequisites

- IBM Cloud Account
- IBM Cloud CLI installed
- Docker installed
- kubectl installed

### 1. Setup IBM Cloud Environment

```bash
# Login to IBM Cloud
ibmcloud login

# Target resource group
ibmcloud target -g pocket-ranger

# Install container registry plugin
ibmcloud plugin install container-registry
```

### 2. IBM Container Registry Setup

```bash
# Create namespace
ibmcloud cr namespace-add pocket-ranger

# Login to registry
ibmcloud cr login

# Build and push image
docker build -t us.icr.io/pocket-ranger/pocket-ranger:latest .
docker push us.icr.io/pocket-ranger/pocket-ranger:latest
```

### 3. IBM Kubernetes Service (IKS) Deployment

```bash
# Create cluster
ibmcloud ks cluster create classic \
  --name pocket-ranger-cluster \
  --location dal10 \
  --workers 3 \
  --machine-type b3c.4x16 \
  --hardware shared

# Get cluster configuration
ibmcloud ks cluster config --cluster pocket-ranger-cluster
```

### 4. IBM-Specific Kubernetes Manifests

```yaml
# ibm/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pocket-ranger-app
  namespace: pocket-ranger
spec:
  replicas: 3
  selector:
    matchLabels:
      app: pocket-ranger
  template:
    metadata:
      labels:
        app: pocket-ranger
    spec:
      containers:
      - name: pocket-ranger
        image: us.icr.io/pocket-ranger/pocket-ranger:latest
        ports:
        - containerPort: 8081
        env:
        - name: NODE_ENV
          value: "production"
        - name: EXPO_PUBLIC_API_URL
          value: "https://api.pocketranger.app"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
      imagePullSecrets:
      - name: all-icr-io
```

### 5. IBM Cloud Internet Services

```bash
# Create Internet Services instance
ibmcloud resource service-instance-create pocket-ranger-cis internet-svcs standard global
```

## Cross-Platform CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/multi-cloud-deploy.yml
name: Multi-Cloud Deployment

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build application
      run: npm run build:web

  deploy-gcp:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Cloud Build
      uses: google-github-actions/setup-gcloud@v0
      with:
        project_id: ${{ secrets.GCP_PROJECT_ID }}
        service_account_key: ${{ secrets.GCP_SA_KEY }}
    
    - name: Build and Deploy to GCP
      run: |
        gcloud builds submit --config cloudbuild.yaml

  deploy-aws:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v1
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-west-2
    
    - name: Build and Deploy to AWS
      run: |
        aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.us-west-2.amazonaws.com
        docker build -t pocket-ranger .
        docker tag pocket-ranger:latest ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.us-west-2.amazonaws.com/pocket-ranger:latest
        docker push ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.us-west-2.amazonaws.com/pocket-ranger:latest
        kubectl set image deployment/pocket-ranger-app pocket-ranger=${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.us-west-2.amazonaws.com/pocket-ranger:latest -n pocket-ranger

  deploy-azure:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Azure Login
      uses: azure/login@v1
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}
    
    - name: Build and Deploy to Azure
      run: |
        az acr login --name pocketrangeracr
        docker build -t pocketrangeracr.azurecr.io/pocket-ranger:latest .
        docker push pocketrangeracr.azurecr.io/pocket-ranger:latest
        az aks get-credentials --resource-group pocket-ranger-rg --name pocket-ranger-cluster
        kubectl set image deployment/pocket-ranger-app pocket-ranger=pocketrangeracr.azurecr.io/pocket-ranger:latest -n pocket-ranger
```

## Cost Optimization

### GCP Cost Optimization

```bash
# Use preemptible instances
gcloud container node-pools create preemptible-pool \
  --cluster=pocket-ranger-cluster \
  --preemptible \
  --num-nodes=3 \
  --machine-type=e2-medium \
  --zone=us-central1-a

# Set up budget alerts
gcloud billing budgets create \
  --billing-account=BILLING_ACCOUNT_ID \
  --display-name="Pocket Ranger Budget" \
  --budget-amount=100USD
```

### AWS Cost Optimization

```bash
# Use Spot instances
eksctl create nodegroup \
  --cluster=pocket-ranger-cluster \
  --name=spot-nodes \
  --instance-types=t3.medium \
  --spot \
  --nodes-min=1 \
  --nodes-max=10 \
  --asg-access
```

### Azure Cost Optimization

```bash
# Use Spot VMs
az aks nodepool add \
  --cluster-name pocket-ranger-cluster \
  --name spotnodes \
  --resource-group pocket-ranger-rg \
  --priority Spot \
  --eviction-policy Delete \
  --spot-max-price -1 \
  --node-count 3
```

## Monitoring and Observability

### Cloud-Native Monitoring

```yaml
# monitoring/prometheus-values.yaml
prometheus:
  prometheusSpec:
    retention: 30d
    storageSpec:
      volumeClaimTemplate:
        spec:
          storageClassName: fast-ssd
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: 50Gi

grafana:
  adminPassword: admin123
  ingress:
    enabled: true
    hosts:
      - grafana.pocketranger.app
```

### Platform-Specific Monitoring

- **GCP**: Cloud Monitoring and Cloud Logging
- **AWS**: CloudWatch and X-Ray
- **Azure**: Azure Monitor and Application Insights
- **IBM**: IBM Cloud Monitoring and Logging

## Security Best Practices

### Common Security Measures

1. **Network Security**
   - Use private subnets for worker nodes
   - Implement network policies
   - Enable encryption in transit and at rest

2. **Identity and Access Management**
   - Use service accounts with minimal permissions
   - Enable audit logging
   - Implement RBAC policies

3. **Container Security**
   - Scan images for vulnerabilities
   - Use non-root containers
   - Implement Pod Security Policies

4. **Secrets Management**
   - Use platform-native secret management
   - Rotate secrets regularly
   - Never hardcode secrets in images

## Disaster Recovery

### Multi-Region Deployment

```bash
# GCP Multi-Region
gcloud container clusters create pocket-ranger-cluster-backup \
  --zone=us-east1-a \
  --num-nodes=2 \
  --machine-type=e2-small

# AWS Multi-Region
eksctl create cluster \
  --name pocket-ranger-cluster-backup \
  --region us-east-1 \
  --nodes 2
```

### Backup Strategies

1. **Configuration Backup**
   - Store Kubernetes manifests in Git
   - Regular backup of persistent volumes
   - Database backups (when applicable)

2. **Recovery Procedures**
   - Documented runbooks
   - Automated recovery scripts
   - Regular disaster recovery testing

## Troubleshooting

### Common Issues Across Platforms

1. **Authentication Issues**
   ```bash
   # Verify cluster access
   kubectl auth can-i get pods --namespace=pocket-ranger
   ```

2. **Image Pull Issues**
   ```bash
   # Check image registry authentication
   kubectl get events --namespace=pocket-ranger
   ```

3. **Resource Constraints**
   ```bash
   # Check node resources
   kubectl describe nodes
   kubectl top nodes
   ```

4. **Network Connectivity**
   ```bash
   # Test service connectivity
   kubectl exec -it deployment/pocket-ranger-app -- curl http://pocket-ranger-service
   ```

## Next Steps

After successful cloud deployment:

1. **Set up monitoring and alerting**
2. **Implement security scanning and compliance**
3. **Configure backup and disaster recovery**
4. **Optimize costs and performance**
5. **Set up multi-region deployment for high availability**

For platform-specific support, refer to:
- [GCP Documentation](https://cloud.google.com/docs)
- [AWS Documentation](https://docs.aws.amazon.com/)
- [Azure Documentation](https://docs.microsoft.com/azure/)
- [IBM Cloud Documentation](https://cloud.ibm.com/docs)

For additional support, refer to the [Architecture Documentation](../architecture/system-overview.md) or create an issue in the project repository.