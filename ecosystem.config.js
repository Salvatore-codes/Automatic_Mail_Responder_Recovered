// pm2 process supervision for Trofeo — auto-restart both the API/dashboard
// server and the email listener, so a crash self-heals instead of silently
// stopping quotes. Manage with:  pm2 start ecosystem.config.js  /  pm2 restart all
const cwd = '/Users/apple/Downloads/TrofeoMailResponder_production_ready';
const py = cwd + '/.venv/bin/python';

module.exports = {
  apps: [
    {
      name: 'trofeo-server',
      script: 'serve.py',
      interpreter: py,
      cwd,
      autorestart: true,
      max_restarts: 100,
      min_uptime: '10s',
      restart_delay: 3000,
      out_file: cwd + '/data/pm2-server.out.log',
      error_file: cwd + '/data/pm2-server.err.log',
      merge_logs: true,
    },
    {
      name: 'trofeo-listener',
      script: 'run_email_listener.py',
      interpreter: py,
      cwd,
      autorestart: true,
      max_restarts: 100,
      min_uptime: '10s',
      restart_delay: 5000,
      out_file: cwd + '/data/pm2-listener.out.log',
      error_file: cwd + '/data/pm2-listener.err.log',
      merge_logs: true,
    },
  ],
};
