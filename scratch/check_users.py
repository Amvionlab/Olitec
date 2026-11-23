import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('192.168.1.164', username='ubuntu', password='Amvion@123')

stdin, stdout, stderr = client.exec_command("mysql -u olitec_user -pAmvion@123 -e 'SELECT id, email, role FROM warranty_db.users;'")
print(stdout.read().decode())
client.close()
