/**
 * TradeOS AI - PM2 Cluster Process Management Configuration
 * Scales Node.js server across all available CPU cores on AWS EC2/ECS
 */

module.exports = {
  apps: [
    {
      name: 'tradeos-ai-core',
      script: 'dist/server.cjs',
      instances: 'max', // Auto-scale to all available CPU cores (e.g. 8 cores = 8 workers)
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1500M', // Auto-restart if any single worker exceeds 1.5GB
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      exp_backoff_restart_delay: 100,
      listen_timeout: 8000,
      kill_timeout: 4000,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
