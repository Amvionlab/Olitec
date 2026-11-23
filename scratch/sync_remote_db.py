import paramiko

sql = """
-- 1. Add purchase_date column if missing
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = 'warranty_db' 
      AND TABLE_NAME = 'serial_numbers' 
      AND COLUMN_NAME = 'purchase_date'
);

SET @sql_stmt = IF(@col_exists = 0, 'ALTER TABLE warranty_db.serial_numbers ADD COLUMN purchase_date DATE NULL', 'SELECT 1');
PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Populate purchase dates for all serials
UPDATE warranty_db.serial_numbers SET purchase_date = '2026-02-14' WHERE serial_number = '9876rtgfhjk,';
UPDATE warranty_db.serial_numbers SET purchase_date = '2026-02-20' WHERE serial_number = 'varsh09vk';
UPDATE warranty_db.serial_numbers SET purchase_date = '2026-03-08' WHERE serial_number = 'OLITEC-005';
UPDATE warranty_db.serial_numbers SET purchase_date = '2026-03-25' WHERE serial_number = 'OLITEC-002';
UPDATE warranty_db.serial_numbers SET purchase_date = '2026-04-12' WHERE serial_number = 'varsh09vkkkk';
UPDATE warranty_db.serial_numbers SET purchase_date = '2026-05-18' WHERE serial_number = 'OLITEC-001';
UPDATE warranty_db.serial_numbers SET purchase_date = '2026-06-22' WHERE serial_number = 'PVMODULE001';
UPDATE warranty_db.serial_numbers SET purchase_date = '2026-02-15' WHERE purchase_date IS NULL;

-- 3. Insert or update active registered warranties
INSERT INTO warranty_db.warranties (
    warranty_number, customer_name, email, mobile,
    installation_address, product_id, product_model, serial_number,
    purchase_date, installation_date, dealer_name, dealer_contact,
    status, start_date, end_date, admin_remark, reviewed_at
) VALUES 
('WR-100119', 'Amitabh Mukherjee', 'amitabh.m@gmail.com', '9830012345', '18 Lake Gardens, Kolkata, West Bengal', 3, 'P 35 Series', 'PVMODULE001', '2026-06-22', '2026-06-22', 'Authorized Olitec Energy Partner', '1800-123-4567', 'active', '2026-06-22', '2027-06-21', 'Auto-verified hardware serial against master registry', NOW()),
('WR-100102', 'Karthik Raja', 'karthik.raja@live.com', '9444012345', '56 Anna Salai, Guindy, Chennai', 1, 'P 18 Series', 'OLITEC-001', '2026-05-18', '2026-05-18', 'Authorized Olitec Energy Partner', '1800-123-4567', 'active', '2026-05-18', '2027-05-17', 'Auto-verified hardware serial against master registry', NOW()),
('WR-100085', 'Sunita Verma', 'sunita.v@gmail.com', '9811012345', '304 Eco Habitat, Gurugram, Haryana', 3, 'P 35 Series', 'varsh09vkkkk', '2026-04-12', '2026-04-12', 'Authorized Olitec Energy Partner', '1800-123-4567', 'active', '2026-04-12', '2027-04-11', 'Auto-verified hardware serial against master registry', NOW()),
('WR-100068', 'Vikram Reddy', 'vikram.reddy@gmail.com', '9949012345', '78 Hill View, Jubilee Hills, Hyderabad', 2, 'P 30 Series', 'OLITEC-002', '2026-03-25', '2026-03-25', 'Authorized Olitec Energy Partner', '1800-123-4567', 'active', '2026-03-25', '2027-03-24', 'Auto-verified hardware serial against master registry', NOW()),
('WR-100051', 'Anand Patel', 'anand.patel@yahoo.com', '9879012345', '12 Solar Crest, Sector 4, Gandhinagar', 1, 'P 18 Series', 'OLITEC-005', '2026-03-08', '2026-03-08', 'Authorized Olitec Energy Partner', '1800-123-4567', 'active', '2026-03-08', '2027-03-07', 'Auto-verified hardware serial against master registry', NOW()),
('WR-100034', 'Priya Venkatesh', 'priya.v@outlook.com', '9820123456', '45 Green Meadows, Whitefield, Bangalore', 3, 'P 35 Series', 'varsh09vk', '2026-02-20', '2026-02-20', 'Authorized Olitec Energy Partner', '1800-123-4567', 'active', '2026-02-20', '2027-02-19', 'Auto-verified hardware serial against master registry', NOW()),
('WR-100017', 'Rajesh Sharma', 'rajesh.sharma@gmail.com', '9845012345', '102 Sunrise Towers, Indiranagar, Bangalore', 1, 'P 18 Series', '9876rtgfhjk,', '2026-02-14', '2026-02-14', 'Authorized Olitec Energy Partner', '1800-123-4567', 'active', '2026-02-14', '2027-02-13', 'Auto-verified hardware serial against master registry', NOW())
ON DUPLICATE KEY UPDATE 
    purchase_date = VALUES(purchase_date),
    start_date = VALUES(start_date),
    end_date = VALUES(end_date),
    status = 'active';
"""

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.1.164", username="ubuntu", password="Amvion@123")

sftp = client.open_sftp()
with sftp.file("/home/ubuntu/seed_warranties.sql", "w") as f:
    f.write(sql)
sftp.close()

stdin, stdout, stderr = client.exec_command("mysql -u olitec_user -pAmvion@123 warranty_db < /home/ubuntu/seed_warranties.sql")
print("EXEC STDOUT:\n", stdout.read().decode())
err = stderr.read().decode()
if err:
    print("EXEC STDERR:\n", err)

# Check query result
stdin, stdout, stderr = client.exec_command("mysql -u olitec_user -pAmvion@123 -e \"SELECT sn.serial_number, p.name, p.model_number, sn.purchase_date, w.status FROM warranty_db.serial_numbers sn JOIN warranty_db.products p ON sn.product_id = p.id LEFT JOIN warranty_db.warranties w ON w.serial_number = sn.serial_number;\"")
print("VERIFICATION:\n", stdout.read().decode())

client.close()
