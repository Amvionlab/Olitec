import paramiko

HOSTNAME = "192.168.1.164"
USERNAME = "ubuntu"
PASSWORD = "Amvion@123"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOSTNAME, username=USERNAME, password=PASSWORD)

commands = [
    "cd /var/www/olitec && git pull origin main",
    "cd /var/www/olitec && npm --prefix website run build",
    "pm2 restart olitec-website",
    "pm2 status"
]

for cmd in commands:
    print(f"\n>>> Running: {cmd}")
    stdin, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode()
    err = stderr.read().decode()
    print("OUTPUT:\n", out)
    if err:
        print("STDERR:\n", err)

client.close()
