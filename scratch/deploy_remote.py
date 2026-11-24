import paramiko
import time
import sys

HOSTNAME = "192.168.1.164"
USERNAME = "ubuntu"
PASSWORD = "Amvion@123"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOSTNAME, username=USERNAME, password=PASSWORD, timeout=15)

def run_command(cmd, timeout=300):
    print(f"\n========================================================")
    print(f">>> Running: {cmd}")
    print(f"========================================================")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    # Stream output
    while not stdout.channel.exit_status_ready():
        if stdout.channel.recv_ready():
            chunk = stdout.channel.recv(4096).decode('utf-8', errors='replace')
            sys.stdout.write(chunk)
            sys.stdout.flush()
        if stdout.channel.recv_stderr_ready():
            err_chunk = stdout.channel.recv_stderr(4096).decode('utf-8', errors='replace')
            sys.stderr.write(err_chunk)
            sys.stderr.flush()
        time.sleep(0.1)

    # Read remaining
    out = stdout.read().decode('utf-8', errors='replace')
    if out:
        sys.stdout.write(out)
        sys.stdout.flush()
    err = stderr.read().decode('utf-8', errors='replace')
    if err:
        sys.stderr.write(err)
        sys.stderr.flush()

    status = stdout.channel.recv_exit_status()
    print(f"\n[Exit code: {status}]")
    return status

try:
    # 1. Pull latest code
    run_command("cd /var/www/olitec && git fetch origin main && git pull origin main")
    run_command("cd /var/www/olitec && git log -n 3 --oneline")

    # 2. Build backend
    run_command("cd /var/www/olitec && npm --prefix backend run build")

    # 3. Build website
    run_command("cd /var/www/olitec && npm --prefix website run build")

    # 4. Restart services
    run_command("pm2 restart olitec-backend olitec-website")

    # 5. Check PM2 status
    time.sleep(2)
    run_command("pm2 list")

    # 6. Verify health check
    run_command("curl -s http://127.0.0.1:4005/health || echo 'Health check failed'")
    run_command("curl -s -I http://127.0.0.1:3005 || echo 'Website check failed'")
    run_command("curl -s -I http://127.0.0.1:3000 || echo 'Nginx 3000 check failed'")
    run_command("curl -s -I http://127.0.0.1:8080 || echo 'Nginx 8080 check failed'")

finally:
    client.close()
