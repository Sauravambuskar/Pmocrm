# Enterprise CRM Deployment Guide

This guide covers the complete deployment process for the Enterprise CRM system in production environments.

## 🏢 Enterprise Features Overview

The Enterprise CRM system includes advanced features designed for business-critical applications:

- **Advanced Authentication**: JWT tokens, role-based access, session management
- **Enterprise Database**: Comprehensive schema with 25+ tables
- **Business Intelligence**: Advanced reporting and analytics
- **Audit & Compliance**: Complete activity logging and audit trails
- **Scalable Architecture**: Cloud-native design for high availability
- **Security First**: Enterprise-grade security features

## 🚀 Production Deployment Options

### Option 1: Vercel (Recommended for Scalability)

#### Prerequisites
- Vercel account with Pro plan (for enterprise features)
- Cloud database (PlanetScale, Railway, or AWS RDS)
- Domain name for production
- Email service (SendGrid, AWS SES, or similar)

#### Step 1: Database Setup

**PlanetScale (Recommended)**
```bash
# Install PlanetScale CLI
curl -fsSL https://get.planetscale.com/install.sh | bash

# Login and create database
pscale auth login
pscale database create enterprise-crm --region us-east

# Create production branch
pscale branch create enterprise-crm production

# Get connection string
pscale connect enterprise-crm production --port 3309
```

**Import Enterprise Schema**
```bash
# Import the enterprise schema
mysql -h 127.0.0.1 -P 3309 -u root < database_schema_enterprise.sql
```

#### Step 2: Environment Configuration

Create production environment file:
```env
# Database
DATABASE_URL=mysql://username:password@host:port/database?ssl={"rejectUnauthorized":true}

# Application
NODE_ENV=production
API_BASE_URL=https://your-domain.com

# Security
JWT_SECRET=your-super-secure-jwt-secret-min-32-chars
SESSION_SECRET=your-session-secret-min-32-chars

# Email Service
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
FROM_EMAIL=noreply@your-domain.com

# File Storage (Optional)
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_BUCKET_NAME=your-s3-bucket
AWS_REGION=us-east-1

# Monitoring (Optional)
SENTRY_DSN=your-sentry-dsn
```

#### Step 3: Vercel Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to production
vercel --prod

# Add environment variables
vercel env add DATABASE_URL production
vercel env add JWT_SECRET production
# ... add all environment variables

# Redeploy with environment variables
vercel --prod
```

#### Step 4: Domain Configuration

```bash
# Add custom domain
vercel domains add your-domain.com

# Configure DNS records (in your DNS provider)
# A record: @ -> 76.76.19.61
# CNAME record: www -> cname.vercel-dns.com
```

### Option 2: AWS Deployment (Enterprise Scale)

#### Prerequisites
- AWS Account with appropriate permissions
- AWS CLI configured
- Docker installed
- Terraform (optional, for infrastructure as code)

#### Step 1: Infrastructure Setup

**RDS Database**
```bash
# Create RDS MySQL instance
aws rds create-db-instance \
  --db-instance-identifier enterprise-crm-prod \
  --db-instance-class db.t3.medium \
  --engine mysql \
  --master-username admin \
  --master-user-password YourSecurePassword123! \
  --allocated-storage 100 \
  --storage-type gp2 \
  --vpc-security-group-ids sg-xxxxxxxxx \
  --db-subnet-group-name default \
  --backup-retention-period 7 \
  --multi-az \
  --storage-encrypted
```

**ECS Fargate Service**
```yaml
# docker-compose.yml for AWS ECS
version: '3.8'
services:
  enterprise-crm:
    image: your-account.dkr.ecr.region.amazonaws.com/enterprise-crm:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
```

#### Step 2: Application Containerization

**Dockerfile**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
```

**Build and Deploy**
```bash
# Build Docker image
docker build -t enterprise-crm .

# Tag for ECR
docker tag enterprise-crm:latest your-account.dkr.ecr.region.amazonaws.com/enterprise-crm:latest

# Push to ECR
aws ecr get-login-password --region region | docker login --username AWS --password-stdin your-account.dkr.ecr.region.amazonaws.com
docker push your-account.dkr.ecr.region.amazonaws.com/enterprise-crm:latest

# Deploy to ECS
aws ecs update-service --cluster enterprise-crm --service enterprise-crm-service --force-new-deployment
```

### Option 3: Kubernetes Deployment (Large Scale)

#### Prerequisites
- Kubernetes cluster (EKS, GKE, or AKS)
- kubectl configured
- Helm package manager

#### Step 1: Kubernetes Manifests

**Deployment**
```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: enterprise-crm
  namespace: production
spec:
  replicas: 5
  selector:
    matchLabels:
      app: enterprise-crm
  template:
    metadata:
      labels:
        app: enterprise-crm
    spec:
      containers:
      - name: enterprise-crm
        image: your-registry/enterprise-crm:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: crm-secrets
              key: database-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: crm-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

**Service & Ingress**
```yaml
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: enterprise-crm-service
  namespace: production
spec:
  selector:
    app: enterprise-crm
  ports:
  - port: 80
    targetPort: 3000
  type: ClusterIP

---
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: enterprise-crm-ingress
  namespace: production
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - your-domain.com
    secretName: crm-tls
  rules:
  - host: your-domain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: enterprise-crm-service
            port:
              number: 80
```

#### Step 2: Deploy to Kubernetes

```bash
# Create namespace
kubectl create namespace production

# Create secrets
kubectl create secret generic crm-secrets \
  --from-literal=database-url="mysql://..." \
  --from-literal=jwt-secret="your-jwt-secret" \
  -n production

# Deploy application
kubectl apply -f k8s/ -n production

# Check deployment status
kubectl get pods -n production
kubectl get services -n production
kubectl get ingress -n production
```

## 🔒 Security Configuration

### SSL/TLS Setup

**Let's Encrypt with Certbot (Traditional hosting)**
```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

**CloudFlare SSL (Recommended)**
1. Add domain to CloudFlare
2. Update nameservers
3. Enable SSL/TLS Full (strict)
4. Enable security features (WAF, DDoS protection)

### Database Security

**Connection Security**
```sql
-- Create dedicated application user
CREATE USER 'crm_app'@'%' IDENTIFIED BY 'SecurePassword123!';

-- Grant minimal required permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON enterprise_crm.* TO 'crm_app'@'%';

-- Enable SSL connections only
REQUIRE SSL;

-- Create read-only user for reporting
CREATE USER 'crm_readonly'@'%' IDENTIFIED BY 'ReadOnlyPassword123!';
GRANT SELECT ON enterprise_crm.* TO 'crm_readonly'@'%';
```

**Firewall Rules**
```bash
# Allow only application servers
# Replace with your server IPs
ufw allow from 10.0.1.0/24 to any port 3306
ufw allow from 10.0.2.0/24 to any port 3306
ufw deny 3306
```

## 📊 Monitoring & Analytics

### Application Monitoring

**Sentry Integration**
```javascript
// Add to your application
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

**Health Check Endpoints**
```javascript
// Add to your API
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

app.get('/ready', async (req, res) => {
  try {
    // Check database connection
    await query('SELECT 1');
    res.status(200).json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: error.message });
  }
});
```

### Database Monitoring

**Performance Monitoring**
```sql
-- Enable slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;
SET GLOBAL slow_query_log_file = '/var/log/mysql/slow.log';

-- Monitor performance schema
SELECT * FROM performance_schema.events_statements_summary_by_digest 
ORDER BY sum_timer_wait DESC LIMIT 10;
```

## 🔄 Backup & Recovery

### Automated Database Backups

**MySQL Backup Script**
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mysql"
DB_NAME="enterprise_crm"

# Create backup
mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASS \
  --single-transaction \
  --routines \
  --triggers \
  $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/backup_$DATE.sql

# Upload to S3
aws s3 cp $BACKUP_DIR/backup_$DATE.sql.gz s3://your-backup-bucket/mysql/

# Clean old local backups (keep 7 days)
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

# Clean old S3 backups (keep 30 days)
aws s3 ls s3://your-backup-bucket/mysql/ | \
  while read -r line; do
    createDate=$(echo $line | awk '{print $1" "$2}')
    createDate=$(date -d "$createDate" +%s)
    olderThan=$(date -d "30 days ago" +%s)
    if [[ $createDate -lt $olderThan ]]; then
      fileName=$(echo $line | awk '{print $4}')
      aws s3 rm s3://your-backup-bucket/mysql/$fileName
    fi
  done
```

**Cron Schedule**
```bash
# Add to crontab
0 2 * * * /scripts/backup.sh >> /var/log/backup.log 2>&1
```

### Disaster Recovery

**Recovery Procedure**
```bash
# 1. Stop application
kubectl scale deployment enterprise-crm --replicas=0

# 2. Restore database
gunzip -c backup_20240115_020000.sql.gz | mysql -h $DB_HOST -u $DB_USER -p$DB_PASS enterprise_crm

# 3. Verify data integrity
mysql -h $DB_HOST -u $DB_USER -p$DB_PASS -e "SELECT COUNT(*) FROM enterprise_crm.users;"

# 4. Start application
kubectl scale deployment enterprise-crm --replicas=5

# 5. Verify application health
curl -f https://your-domain.com/health
```

## 📈 Performance Optimization

### Database Optimization

**Indexing Strategy**
```sql
-- Critical indexes for performance
CREATE INDEX idx_users_email_status ON users(email, status);
CREATE INDEX idx_projects_status_priority ON projects(status, priority);
CREATE INDEX idx_tasks_project_assigned ON tasks(project_id, assigned_to);
CREATE INDEX idx_activities_user_date ON activities(user_id, activity_date);
CREATE INDEX idx_contacts_company_category ON contacts(company_id, category);

-- Composite indexes for common queries
CREATE INDEX idx_projects_manager_status_date ON projects(project_manager_id, status, end_date);
CREATE INDEX idx_tasks_assigned_status_due ON tasks(assigned_to, status, due_date);
```

**Query Optimization**
```sql
-- Analyze slow queries
EXPLAIN SELECT * FROM projects 
JOIN project_members ON projects.id = project_members.project_id 
WHERE project_members.user_id = 1 AND projects.status = 'active';

-- Optimize with proper indexes
ALTER TABLE projects ADD INDEX idx_status (status);
ALTER TABLE project_members ADD INDEX idx_user_project (user_id, project_id);
```

### Application Optimization

**Caching Strategy**
```javascript
// Redis caching for frequently accessed data
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);

async function getCachedData(key, fetchFunction, ttl = 300) {
  try {
    const cached = await client.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
    
    const data = await fetchFunction();
    await client.setex(key, ttl, JSON.stringify(data));
    return data;
  } catch (error) {
    console.error('Cache error:', error);
    return await fetchFunction();
  }
}

// Usage
const dashboardStats = await getCachedData(
  `dashboard:stats:${userId}`,
  () => getDashboardStats(userId),
  300 // 5 minutes
);
```

**Connection Pooling**
```javascript
// Optimized database connection pool
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 100,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  ssl: {
    rejectUnauthorized: false
  }
});
```

## 🔧 Maintenance

### Regular Maintenance Tasks

**Weekly Tasks**
```bash
#!/bin/bash
# weekly_maintenance.sh

# 1. Database optimization
mysql -e "OPTIMIZE TABLE enterprise_crm.activities;"
mysql -e "OPTIMIZE TABLE enterprise_crm.audit_logs;"

# 2. Clean old sessions
mysql -e "DELETE FROM enterprise_crm.user_sessions WHERE expires_at < NOW();"

# 3. Clean old activities (keep 90 days)
mysql -e "DELETE FROM enterprise_crm.activities WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);"

# 4. Update statistics
mysql -e "ANALYZE TABLE enterprise_crm.projects;"
mysql -e "ANALYZE TABLE enterprise_crm.tasks;"

# 5. Check disk space
df -h | grep -E '(8[0-9]|9[0-9])%' && echo "Warning: Disk space low"
```

**Monthly Tasks**
```bash
#!/bin/bash
# monthly_maintenance.sh

# 1. Full database backup
mysqldump --all-databases > monthly_backup_$(date +%Y%m).sql

# 2. Archive old data
mysql -e "INSERT INTO enterprise_crm.activities_archive SELECT * FROM enterprise_crm.activities WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);"
mysql -e "DELETE FROM enterprise_crm.activities WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);"

# 3. Security audit
mysql -e "SELECT user, host FROM mysql.user WHERE password_expired = 'Y';"

# 4. Performance review
mysql -e "SELECT table_name, round(((data_length + index_length) / 1024 / 1024), 2) AS 'DB Size in MB' FROM information_schema.tables WHERE table_schema='enterprise_crm' ORDER BY (data_length + index_length) DESC;"
```

## 🚨 Troubleshooting

### Common Issues

**Database Connection Issues**
```bash
# Check database connectivity
mysql -h $DB_HOST -u $DB_USER -p$DB_PASS -e "SELECT 1;"

# Check connection pool status
mysql -e "SHOW PROCESSLIST;"

# Check for locked tables
mysql -e "SHOW OPEN TABLES WHERE In_use > 0;"
```

**Performance Issues**
```bash
# Check slow queries
mysql -e "SELECT * FROM mysql.slow_log ORDER BY start_time DESC LIMIT 10;"

# Check server load
top -n 1 | head -5
iostat -x 1 1

# Check memory usage
free -h
cat /proc/meminfo | grep -E '(MemTotal|MemAvailable|MemFree)'
```

**Application Logs**
```bash
# View application logs
kubectl logs -f deployment/enterprise-crm -n production

# Search for errors
kubectl logs deployment/enterprise-crm -n production | grep -i error

# Monitor in real-time
kubectl logs -f deployment/enterprise-crm -n production --tail=100
```

## 📞 Support & Maintenance

For enterprise support and maintenance contracts, contact our team:

- **Email**: enterprise@yourcompany.com
- **Phone**: +1 (555) 123-4567
- **Support Portal**: https://support.yourcompany.com

### SLA Options

- **Gold**: 99.9% uptime, 4-hour response time
- **Platinum**: 99.95% uptime, 2-hour response time
- **Diamond**: 99.99% uptime, 1-hour response time, dedicated support team

---

**This deployment guide ensures your Enterprise CRM system is production-ready with enterprise-grade security, monitoring, and scalability.** 