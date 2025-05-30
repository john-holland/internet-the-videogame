# Internet Cloud Protocol (ICP) Server Setup

This document outlines the steps to set up the ICP server on OpenShift for Internet the Video Game.

## Prerequisites

- OpenShift CLI (`oc`) installed
- Access to an OpenShift cluster
- Node.js 18+ installed locally
- Docker installed locally

## 1. Project Setup

```bash
# Create new project
oc new-project internet-game

# Create service account
oc create serviceaccount icp-server

# Grant necessary permissions
oc adm policy add-scc-to-user anyuid -z icp-server
```

## 2. Database Setup

```bash
# Create PostgreSQL database
oc new-app postgresql-persistent \
  --name=icp-db \
  --param=POSTGRESQL_DATABASE=internet_game \
  --param=POSTGRESQL_USER=icp_user \
  --param=POSTGRESQL_PASSWORD=your_secure_password

# Wait for database to be ready
oc rollout status dc/icp-db
```

## 3. Server Configuration

Create a `config.yaml` file:

```yaml
server:
  port: 8080
  host: 0.0.0.0

database:
  host: icp-db
  port: 5432
  name: internet_game
  user: icp_user
  password: your_secure_password

redis:
  host: icp-redis
  port: 6379

websocket:
  pingInterval: 30000
  pingTimeout: 5000

game:
  minAudienceSize: 3
  roundDuration: 900000  # 15 minutes
  cohortSize: 100
  maxFakeAnswers: 5
```

## 4. Build and Deploy

```bash
# Create build config
oc new-build --name=icp-server \
  --strategy=docker \
  --binary=true

# Start build
oc start-build icp-server --from-dir=. --follow

# Create deployment config
oc new-app icp-server \
  --name=icp-server \
  --env-file=config.yaml

# Expose service
oc expose svc/icp-server
```

## 5. Redis Setup (for real-time features)

```bash
# Deploy Redis
oc new-app redis-ephemeral \
  --name=icp-redis

# Wait for Redis to be ready
oc rollout status dc/icp-redis
```

## 6. Environment Variables

Set the following environment variables in your OpenShift deployment:

```bash
oc set env dc/icp-server \
  NODE_ENV=production \
  REDIS_URL=redis://icp-redis:6379 \
  DATABASE_URL=postgresql://icp_user:your_secure_password@icp-db:5432/internet_game \
  JWT_SECRET=your_jwt_secret \
  WAYBACK_API_KEY=your_wayback_api_key
```

## 7. Scaling Configuration

```bash
# Configure horizontal pod autoscaling
oc autoscale dc/icp-server \
  --min=2 \
  --max=10 \
  --cpu-percent=70
```

## 8. Monitoring Setup

```bash
# Deploy Prometheus
oc new-app prometheus

# Deploy Grafana
oc new-app grafana

# Configure service monitors
oc create -f monitoring/service-monitor.yaml
```

## 9. Backup Configuration

```bash
# Create backup job
oc create -f backup/backup-job.yaml

# Schedule backup cronjob
oc create -f backup/backup-cronjob.yaml
```

## 10. Security Configuration

```bash
# Create network policies
oc create -f security/network-policies.yaml

# Configure TLS
oc create route edge icp-server \
  --service=icp-server \
  --cert=path/to/cert.pem \
  --key=path/to/key.pem
```

## 11. Testing the Deployment

```bash
# Test WebSocket connection
wscat -c wss://your-openshift-route/game

# Test HTTP endpoints
curl https://your-openshift-route/health
```

## 12. Troubleshooting

Common issues and solutions:

1. **Database Connection Issues**
   ```bash
   oc logs dc/icp-server
   oc rsh dc/icp-db
   ```

2. **WebSocket Connection Problems**
   ```bash
   oc describe pod -l app=icp-server
   oc logs -f dc/icp-server
   ```

3. **Scaling Issues**
   ```bash
   oc describe hpa icp-server
   oc get events --sort-by='.lastTimestamp'
   ```

## 13. Maintenance

Regular maintenance tasks:

1. **Database Backup**
   ```bash
   oc exec -it $(oc get pod -l app=icp-db -o jsonpath='{.items[0].metadata.name}') -- pg_dump -U icp_user internet_game > backup.sql
   ```

2. **Log Rotation**
   ```bash
   oc set env dc/icp-server LOG_ROTATION_SIZE=100M
   ```

3. **Performance Monitoring**
   ```bash
   oc exec -it $(oc get pod -l app=grafana -o jsonpath='{.items[0].metadata.name}') -- grafana-cli
   ```

## 14. Cleanup

To remove the entire setup:

```bash
oc delete project internet-game
```

Remember to backup any important data before cleanup. 