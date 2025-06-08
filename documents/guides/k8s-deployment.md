# Kubernetes Deployment Guide - Pocket Ranger

## Overview

This guide provides comprehensive instructions for deploying Pocket Ranger on Kubernetes clusters, including configuration for development, staging, and production environments.

## Prerequisites

- Kubernetes cluster 1.24 or higher
- kubectl configured with cluster access
- Docker registry access (Docker Hub, GCR, ECR, etc.)
- Helm 3.0 or higher (optional, for package management)
- 4GB RAM and 2 CPU cores minimum for cluster

## Kubernetes Manifests

### Namespace Configuration

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: pocket-ranger
  labels:
    app: pocket-ranger
    environment: production
```

### ConfigMap for Application Configuration

```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: pocket-ranger-config
  namespace: pocket-ranger
data:
  NODE_ENV: "production"
  EXPO_PUBLIC_API_URL: "https://api.pocketranger.app"
  PORT: "8081"
  LOG_LEVEL: "info"
  # Add non-sensitive configuration here
```

### Secret for Sensitive Data

```yaml
# k8s/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: pocket-ranger-secrets
  namespace: pocket-ranger
type: Opaque
data:
  # Base64 encoded values
  firebase-project-id: <base64-encoded-project-id>
  firebase-private-key: <base64-encoded-private-key>
  firebase-client-email: <base64-encoded-client-email>
```

### Deployment Configuration

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pocket-ranger-app
  namespace: pocket-ranger
  labels:
    app: pocket-ranger
    component: app
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: pocket-ranger
      component: app
  template:
    metadata:
      labels:
        app: pocket-ranger
        component: app
    spec:
      containers:
      - name: pocket-ranger
        image: pocket-ranger:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 8081
          name: http
          protocol: TCP
        env:
        - name: NODE_ENV
          valueFrom:
            configMapKeyRef:
              name: pocket-ranger-config
              key: NODE_ENV
        - name: EXPO_PUBLIC_API_URL
          valueFrom:
            configMapKeyRef:
              name: pocket-ranger-config
              key: EXPO_PUBLIC_API_URL
        - name: PORT
          valueFrom:
            configMapKeyRef:
              name: pocket-ranger-config
              key: PORT
        - name: FIREBASE_PROJECT_ID
          valueFrom:
            secretKeyRef:
              name: pocket-ranger-secrets
              key: firebase-project-id
        - name: FIREBASE_PRIVATE_KEY
          valueFrom:
            secretKeyRef:
              name: pocket-ranger-secrets
              key: firebase-private-key
        - name: FIREBASE_CLIENT_EMAIL
          valueFrom:
            secretKeyRef:
              name: pocket-ranger-secrets
              key: firebase-client-email
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
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /api/health
            port: 8081
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        securityContext:
          allowPrivilegeEscalation: false
          runAsNonRoot: true
          runAsUser: 1001
          readOnlyRootFilesystem: true
          capabilities:
            drop:
            - ALL
        volumeMounts:
        - name: tmp
          mountPath: /tmp
        - name: cache
          mountPath: /app/.next/cache
      volumes:
      - name: tmp
        emptyDir: {}
      - name: cache
        emptyDir: {}
      securityContext:
        fsGroup: 1001
      restartPolicy: Always
```

### Service Configuration

```yaml
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: pocket-ranger-service
  namespace: pocket-ranger
  labels:
    app: pocket-ranger
    component: app
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 8081
    protocol: TCP
    name: http
  selector:
    app: pocket-ranger
    component: app
```

### Ingress Configuration

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: pocket-ranger-ingress
  namespace: pocket-ranger
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/cors-allow-origin: "*"
    nginx.ingress.kubernetes.io/cors-allow-methods: "GET, POST, OPTIONS"
    nginx.ingress.kubernetes.io/cors-allow-headers: "Content-Type, Authorization"
spec:
  tls:
  - hosts:
    - pocketranger.app
    - api.pocketranger.app
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
  - host: api.pocketranger.app
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: pocket-ranger-service
            port:
              number: 80
```

### Horizontal Pod Autoscaler

```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: pocket-ranger-hpa
  namespace: pocket-ranger
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: pocket-ranger-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
      - type: Pods
        value: 4
        periodSeconds: 15
      selectPolicy: Max
```

### Pod Disruption Budget

```yaml
# k8s/pdb.yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: pocket-ranger-pdb
  namespace: pocket-ranger
spec:
  maxUnavailable: 1
  selector:
    matchLabels:
      app: pocket-ranger
      component: app
```

## Deployment Instructions

### 1. Create Namespace and Secrets

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Create secrets (replace with actual base64 encoded values)
kubectl create secret generic pocket-ranger-secrets \
  --from-literal=firebase-project-id=your-project-id \
  --from-literal=firebase-private-key="your-private-key" \
  --from-literal=firebase-client-email=your-client-email \
  --namespace=pocket-ranger

# Or apply secret manifest
kubectl apply -f k8s/secret.yaml
```

### 2. Apply Configuration

```bash
# Apply all configurations
kubectl apply -f k8s/

# Or apply individually
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml
kubectl apply -f k8s/pdb.yaml
```

### 3. Verify Deployment

```bash
# Check deployment status
kubectl get deployments -n pocket-ranger
kubectl get pods -n pocket-ranger
kubectl get services -n pocket-ranger

# Check pod logs
kubectl logs -l app=pocket-ranger -n pocket-ranger

# Check ingress
kubectl get ingress -n pocket-ranger
```

## Environment-Specific Configurations

### Development Environment

```yaml
# k8s/overlays/dev/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: pocket-ranger-dev
namePrefix: dev-

resources:
- ../../base

patchesStrategicMerge:
- deployment-dev.yaml
- configmap-dev.yaml

replicas:
- name: pocket-ranger-app
  count: 1
```

```yaml
# k8s/overlays/dev/deployment-dev.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pocket-ranger-app
spec:
  template:
    spec:
      containers:
      - name: pocket-ranger
        image: pocket-ranger:dev
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "250m"
```

### Staging Environment

```yaml
# k8s/overlays/staging/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: pocket-ranger-staging
namePrefix: staging-

resources:
- ../../base

patchesStrategicMerge:
- deployment-staging.yaml
- configmap-staging.yaml

replicas:
- name: pocket-ranger-app
  count: 2
```

### Production Environment

Production uses the base configuration with additional security and monitoring.

## Helm Chart (Optional)

### Chart.yaml

```yaml
# helm/Chart.yaml
apiVersion: v2
name: pocket-ranger
description: Pocket Ranger Outdoor Adventure Planning App
type: application
version: 1.0.0
appVersion: 1.0.0
maintainers:
- name: Pocket Ranger Team
  email: support@pocketranger.app
```

### Values.yaml

```yaml
# helm/values.yaml
replicaCount: 3

image:
  repository: pocket-ranger
  tag: latest
  pullPolicy: Always

service:
  type: ClusterIP
  port: 80
  targetPort: 8081

ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: pocketranger.app
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: pocket-ranger-tls
      hosts:
        - pocketranger.app

resources:
  requests:
    memory: 256Mi
    cpu: 250m
  limits:
    memory: 512Mi
    cpu: 500m

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80

config:
  nodeEnv: production
  apiUrl: https://api.pocketranger.app
  port: 8081
  logLevel: info

secrets:
  firebaseProjectId: your-project-id
  firebasePrivateKey: your-private-key
  firebaseClientEmail: your-client-email
```

### Helm Deployment

```bash
# Install with Helm
helm install pocket-ranger ./helm -n pocket-ranger --create-namespace

# Upgrade with Helm
helm upgrade pocket-ranger ./helm -n pocket-ranger

# Uninstall with Helm
helm uninstall pocket-ranger -n pocket-ranger
```

## Monitoring and Observability

### ServiceMonitor for Prometheus

```yaml
# k8s/servicemonitor.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: pocket-ranger-metrics
  namespace: pocket-ranger
spec:
  selector:
    matchLabels:
      app: pocket-ranger
  endpoints:
  - port: http
    path: /metrics
    interval: 30s
```

### Network Policies

```yaml
# k8s/networkpolicy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: pocket-ranger-netpol
  namespace: pocket-ranger
spec:
  podSelector:
    matchLabels:
      app: pocket-ranger
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 8081
  egress:
  - to: []
    ports:
    - protocol: TCP
      port: 53
    - protocol: UDP
      port: 53
  - to: []
    ports:
    - protocol: TCP
      port: 443
```

## Security Hardening

### Pod Security Policy

```yaml
# k8s/psp.yaml
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: pocket-ranger-psp
spec:
  privileged: false
  allowPrivilegeEscalation: false
  requiredDropCapabilities:
    - ALL
  volumes:
    - 'configMap'
    - 'emptyDir'
    - 'projected'
    - 'secret'
    - 'downwardAPI'
    - 'persistentVolumeClaim'
  runAsUser:
    rule: 'MustRunAsNonRoot'
  seLinux:
    rule: 'RunAsAny'
  fsGroup:
    rule: 'RunAsAny'
```

### RBAC Configuration

```yaml
# k8s/rbac.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: pocket-ranger-sa
  namespace: pocket-ranger
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pocket-ranger-role
  namespace: pocket-ranger
rules:
- apiGroups: [""]
  resources: ["configmaps", "secrets"]
  verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: pocket-ranger-rolebinding
  namespace: pocket-ranger
subjects:
- kind: ServiceAccount
  name: pocket-ranger-sa
  namespace: pocket-ranger
roleRef:
  kind: Role
  name: pocket-ranger-role
  apiGroup: rbac.authorization.k8s.io
```

## Backup and Disaster Recovery

### Backup Script

```bash
#!/bin/bash
# scripts/backup-k8s.sh

NAMESPACE="pocket-ranger"
BACKUP_DIR="/backups/$(date +%Y%m%d)"

mkdir -p $BACKUP_DIR

# Backup configurations
kubectl get all -n $NAMESPACE -o yaml > $BACKUP_DIR/all-resources.yaml
kubectl get configmap -n $NAMESPACE -o yaml > $BACKUP_DIR/configmaps.yaml
kubectl get secret -n $NAMESPACE -o yaml > $BACKUP_DIR/secrets.yaml

# Backup persistent volumes (if any)
kubectl get pv -o yaml > $BACKUP_DIR/persistent-volumes.yaml
kubectl get pvc -n $NAMESPACE -o yaml > $BACKUP_DIR/persistent-volume-claims.yaml

echo "Backup completed: $BACKUP_DIR"
```

## Troubleshooting

### Common Issues

1. **Pods not starting**
   ```bash
   kubectl describe pod -l app=pocket-ranger -n pocket-ranger
   kubectl logs -l app=pocket-ranger -n pocket-ranger
   ```

2. **Service not accessible**
   ```bash
   kubectl get svc -n pocket-ranger
   kubectl describe svc pocket-ranger-service -n pocket-ranger
   ```

3. **Ingress issues**
   ```bash
   kubectl get ingress -n pocket-ranger
   kubectl describe ingress pocket-ranger-ingress -n pocket-ranger
   ```

4. **Resource constraints**
   ```bash
   kubectl top pods -n pocket-ranger
   kubectl describe hpa -n pocket-ranger
   ```

### Debug Commands

```bash
# Port forward for local access
kubectl port-forward svc/pocket-ranger-service 8081:80 -n pocket-ranger

# Execute commands in pod
kubectl exec -it deployment/pocket-ranger-app -n pocket-ranger -- sh

# Check resource usage
kubectl top pods -n pocket-ranger
kubectl top nodes

# View events
kubectl get events -n pocket-ranger --sort-by=.metadata.creationTimestamp
```

## Maintenance and Updates

### Rolling Updates

```bash
# Update image
kubectl set image deployment/pocket-ranger-app pocket-ranger=pocket-ranger:v1.1.0 -n pocket-ranger

# Check rollout status
kubectl rollout status deployment/pocket-ranger-app -n pocket-ranger

# Rollback if needed
kubectl rollout undo deployment/pocket-ranger-app -n pocket-ranger
```

### Cluster Maintenance

```bash
# Cordon nodes for maintenance
kubectl cordon node-1

# Drain nodes
kubectl drain node-1 --ignore-daemonsets --delete-emptydir-data

# Uncordon after maintenance
kubectl uncordon node-1
```

## Performance Tuning

### Resource Optimization

```yaml
# Adjust resource requests and limits based on monitoring data
resources:
  requests:
    memory: "384Mi"  # Increased based on usage
    cpu: "300m"
  limits:
    memory: "768Mi"
    cpu: "600m"
```

### JVM Tuning (if applicable)

```yaml
env:
- name: NODE_OPTIONS
  value: "--max-old-space-size=512"
```

## Next Steps

After successful Kubernetes deployment, consider:

1. **Monitoring Setup**: Implement Prometheus and Grafana
2. **Logging**: Set up centralized logging with ELK stack
3. **Security Scanning**: Regular vulnerability assessments
4. **Performance Monitoring**: APM tools like New Relic or Datadog
5. **Disaster Recovery**: Multi-region deployment strategies

For additional support, refer to the [Architecture Documentation](../architecture/system-overview.md) or create an issue in the project repository.