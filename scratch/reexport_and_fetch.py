import paramiko
import os

HOSTNAME = "192.168.1.164"
USERNAME = "ubuntu"
PASSWORD = "Amvion@123"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOSTNAME, username=USERNAME, password=PASSWORD)

# 1. Run python script inside Blender on remote host to clean objects and export
blender_py = '''
import bpy

print("Listing all objects before cleaning:")
for obj in list(bpy.data.objects):
    print(f"  {obj.name} | type={obj.type} | dims={list(obj.dimensions)}")
    if obj.type in ("LIGHT", "CAMERA"):
        bpy.data.objects.remove(obj, do_unlink=True)
    elif "Plane" in obj.name or max(obj.dimensions) > 1.5:
        print(f"  --> DELETING BACKDROP: {obj.name}")
        bpy.data.objects.remove(obj, do_unlink=True)

print("Objects remaining after cleaning:")
for obj in bpy.data.objects:
    print(f"  {obj.name} | type={obj.type} | dims={list(obj.dimensions)}")

output_path = "/home/ubuntu/inverter_clean.glb"
bpy.ops.export_scene.gltf(
    filepath=output_path,
    export_format="GLB",
    export_apply=True
)
print("SUCCESSFULLY EXPORTED TO:", output_path)
'''

# Write script to remote
sftp = client.open_sftp()
with sftp.file("/home/ubuntu/clean_and_export.py", "w") as f:
    f.write(blender_py)

stdin, stdout, stderr = client.exec_command("/snap/bin/blender -b /home/ubuntu/inverter.blend -P /home/ubuntu/clean_and_export.py")
out = stdout.read().decode()
err = stderr.read().decode()
print("STDOUT:\n", out)
if err:
    print("STDERR:\n", err)

# Copy to /var/www/olitec/website/public/models/inverter.glb on remote
client.exec_command("cp /home/ubuntu/inverter_clean.glb /var/www/olitec/website/public/models/inverter.glb")

# Download to local
local_target = os.path.abspath("website/public/models/inverter.glb")
sftp.get("/home/ubuntu/inverter_clean.glb", local_target)
print("Downloaded cleaned model to local:", local_target, "Size:", os.path.getsize(local_target))

sftp.close()
client.close()
