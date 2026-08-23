# ==============================================================================
# TradeOS AI - AWS Mumbai (ap-south-1) High-Concurrency Production Deployment
# Architecture Guide & Step-by-Step Terminal Execution for 100,000+ Concurrent Traders
# ==============================================================================

## 🏗️ 1. AWS High-Availability Architecture (100k Traders)

| Component | AWS Resource Recommendation | Spec / Configuration |
|---|---|---|
| **Compute / Worker Nodes** | AWS EC2 (c6i.2xlarge / c6i.4xlarge) or AWS ECS Fargate | 8 vCPU, 16GB RAM with Auto-Scaling (Min: 2, Max: 10 instances) |
| **Load Balancing** | AWS Application Load Balancer (ALB) | Dual-stack IPv4/IPv6, WSS Sticky Sessions, HTTP/2 enabled |
| **Distributed Pub/Sub Cache** | AWS ElastiCache for Redis (Cluster Mode) | `cache.r6g.large` Multi-AZ with Auto-Failover |
| **Edge Delivery & WAF** | AWS CloudFront + AWS WAF | SEBI-compliant geo-restriction, SSL termination, DDoS protection |
| **Static IP & DNS** | AWS Elastic IP (EIP) & Amazon Route 53 | High-availability Anycast DNS routing to `ap-south-1` (Mumbai) |

---

## 💻 2. Complete Step-by-Step Terminal Execution Commands

Run the following commands sequentially on a fresh **Ubuntu 22.04 LTS (x86_64)** AWS EC2 instance in **Mumbai (`ap-south-1`)**:

### Step 1: System Update & Kernel TCP Optimization
```bash
# 1. Update system packages
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw fail2ban htop build-essential ca-certificates gnupg lsb-release

# 2. Optimize Linux Kernel TCP Stack for 100k+ concurrent WebSockets
sudo bash -c 'cat <<EOF >> /etc/sysctl.conf
# Maximum open files and socket backlog
fs.file-max = 2097152
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.core.netdev_max_backlog = 65535

# TCP buffer sizing for low-latency streaming
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216

# Enable fast port reuse & keepalives
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_fin_timeout = 15
net.ipv4.tcp_keepalive_time = 300
net.ipv4.tcp_keepalive_intvl = 15
net.ipv4.tcp_keepalive_probes = 5
EOF'

# Apply kernel parameters immediately
sudo sysctl -p
```

---

### Step 2: Install Docker Engine & Docker Compose
```bash
# 1. Add official Docker GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# 2. Setup Docker repository
echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 3. Install Docker packages
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 4. Enable non-root docker execution
sudo usermod -aG docker $USER
newgrp docker
```

---

### Step 3: Clone Project & Setup Environment Secrets
```bash
# 1. Clone repository into production directory
cd /home/ubuntu
git clone https://github.com/your-org/tradeos-ai.git tradeos-app
cd tradeos-app

# 2. Configure production .env file
cp .env.example .env
nano .env

# (Set your MASTER_ENCRYPTION_KEY, JWT_SECRET, RAZORPAY_KEY_SECRET, etc.)
```

---

### Step 4: Generate SSL Certificates (Let's Encrypt / Self-Signed)
```bash
# Create SSL directory structure
mkdir -p nginx/ssl/live certbot/www

# Option A: Self-signed certificate for immediate testing
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/live/privkey.pem \
  -out nginx/ssl/live/fullchain.pem \
  -subj "/C=IN/ST=Maharashtra/L=Mumbai/O=TradeOS/CN=tradeos.ai"

# Option B: Or obtain free Let's Encrypt production SSL using Certbot
# sudo apt install -y certbot
# sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
# cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/live/fullchain.pem
# cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/live/privkey.pem
```

---

### Step 5: Configure AWS Security Group & Firewall (UFW)
```bash
# Allow SSH (22), HTTP (80), HTTPS (443)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

---

### Step 6: Launch Multi-Container Production Cluster
```bash
# 1. Build and boot all containers in background
docker compose up -d --build

# 2. Verify all containers are healthy
docker compose ps

# 3. Stream real-time production logs
docker compose logs -f app
```

---

### Step 7: Zero-Downtime Health & Algorithmic Telemetry Verification
```bash
# Test local HTTP health & metrics endpoint
curl -s http://localhost:3000/api/v1/system/metrics | jq .

# Test WebSocket streaming endpoint connection
curl -i -N -H "Connection: Upgrade" \
     -H "Upgrade: websocket" \
     -H "Host: localhost" \
     -H "Origin: http://localhost" \
     http://localhost:3000/ws/stream
```
