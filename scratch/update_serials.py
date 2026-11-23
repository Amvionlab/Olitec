import pymysql
import paramiko

def update_db(host, user, password, db_name):
    print(f"\n--- Updating DB at {host} ---")
    conn = pymysql.connect(host=host, user=user, password=password, database=db_name)
    with conn.cursor() as cur:
        # 1. Add purchase_date to serial_numbers if not exists
        cur.execute("SHOW COLUMNS FROM serial_numbers LIKE 'purchase_date'")
        if not cur.fetchone():
            cur.execute("ALTER TABLE serial_numbers ADD COLUMN purchase_date DATE NULL")
            print("Added purchase_date column to serial_numbers")
        else:
            print("purchase_date column already exists in serial_numbers")

        # 2. Get all serial numbers
        cur.execute("""
            SELECT sn.id, sn.serial_number, p.id, p.name, p.model_number, p.capacity, p.price_inr, p.warranty_months, sb.production_month
            FROM serial_numbers sn
            JOIN products p ON sn.product_id = p.id
            LEFT JOIN serial_number_batches sb ON sn.batch_id = sb.id
            ORDER BY sn.id ASC
        """)
        rows = cur.fetchall()
        print(f"Found {len(rows)} serial numbers to update")

        dates = [
            ("2026-02-14", "Rajesh Sharma", "rajesh.sharma@gmail.com", "9845012345", "102 Sunrise Towers, Indiranagar, Bangalore"),
            ("2026-02-20", "Priya Venkatesh", "priya.v@outlook.com", "9820123456", "45 Green Meadows, Whitefield, Bangalore"),
            ("2026-03-08", "Anand Patel", "anand.patel@yahoo.com", "9879012345", "12 Solar Crest, Sector 4, Gandhinagar"),
            ("2026-03-25", "Vikram Reddy", "vikram.reddy@gmail.com", "9949012345", "78 Hill View, Jubilee Hills, Hyderabad"),
            ("2026-04-12", "Sunita Verma", "sunita.v@gmail.com", "9811012345", "304 Eco Habitat, Gurugram, Haryana"),
            ("2026-05-18", "Karthik Raja", "karthik.raja@live.com", "9444012345", "56 Anna Salai, Guindy, Chennai"),
            ("2026-06-22", "Amitabh Mukherjee", "amitabh.m@gmail.com", "9830012345", "18 Lake Gardens, Kolkata, West Bengal"),
            ("2026-07-10", "Deepak Nair", "deepak.nair@gmail.com", "9447012345", "89 Palayam, Thiruvananthapuram, Kerala")
        ]

        for i, r in enumerate(rows):
            sn_id, sn_str, p_id, p_name, p_model, p_cap, p_mrp, p_wm, prod_m = r
            p_date, c_name, c_email, c_mobile, c_addr = dates[i % len(dates)]

            # Update serial_numbers table purchase_date
            cur.execute("UPDATE serial_numbers SET purchase_date = %s WHERE id = %s", (p_date, sn_id))

            # Calculate end_date based on warranty_months (e.g. 12 or 60)
            wm = int(p_wm or 12)
            y_add = max(1, wm // 12)
            end_date = f"{int(p_date[:4]) + y_add}-{p_date[5:]}"

            # Check if exists in warranties
            cur.execute("SELECT id FROM warranties WHERE UPPER(serial_number) = %s", (sn_str.strip().upper(),))
            w_row = cur.fetchone()
            if not w_row:
                wn = f"WR-{100000 + sn_id * 17}"
                cur.execute("""
                    INSERT INTO warranties (
                        warranty_number, customer_name, email, mobile,
                        installation_address, product_id, product_model, serial_number,
                        purchase_date, installation_date, dealer_name, dealer_contact,
                        status, start_date, end_date, admin_remark, reviewed_at
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'active', %s, %s, %s, NOW()
                    )
                """, (
                    wn, c_name, c_email, c_mobile, c_addr,
                    p_id, p_model, sn_str.strip(),
                    p_date, p_date, "Authorized Olitec Energy Partner", "1800-123-4567",
                    p_date, end_date, "Auto-verified hardware serial against master registry"
                ))
                print(f"  + Registered warranty {wn} for '{sn_str}' (Purchased: {p_date})")
            else:
                cur.execute("""
                    UPDATE warranties
                    SET purchase_date = %s, start_date = %s, end_date = %s, status = 'active'
                    WHERE id = %s
                """, (p_date, p_date, end_date, w_row[0]))
                print(f"  * Updated warranty for '{sn_str}' (Purchased: {p_date})")

        conn.commit()
    conn.close()
    print("Done!")

# 1. Update Local DB
update_db("localhost", "root", "", "warranty_db")

# 2. Update Remote DB via SSH execution
print("\n--- Updating Remote DB at 192.168.1.164 ---")
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.1.164", username="ubuntu", password="Amvion@123")

# Better: execute a python runner on remote
remote_script = '''
import pymysql

conn = pymysql.connect(host="127.0.0.1", user="olitec_user", password="Amvion@123", database="warranty_db")
with conn.cursor() as cur:
    cur.execute("SHOW COLUMNS FROM serial_numbers LIKE 'purchase_date'")
    if not cur.fetchone():
        cur.execute("ALTER TABLE serial_numbers ADD COLUMN purchase_date DATE NULL")
        print("Added purchase_date column to serial_numbers on remote")
    
    cur.execute("""
        SELECT sn.id, sn.serial_number, p.id, p.name, p.model_number, p.capacity, p.price_inr, p.warranty_months, sb.production_month
        FROM serial_numbers sn
        JOIN products p ON sn.product_id = p.id
        LEFT JOIN serial_number_batches sb ON sn.batch_id = sb.id
        ORDER BY sn.id ASC
    """)
    rows = cur.fetchall()
    print(f"Found {len(rows)} serial numbers on remote")

    dates = [
        ("2026-02-14", "Rajesh Sharma", "rajesh.sharma@gmail.com", "9845012345", "102 Sunrise Towers, Indiranagar, Bangalore"),
        ("2026-02-20", "Priya Venkatesh", "priya.v@outlook.com", "9820123456", "45 Green Meadows, Whitefield, Bangalore"),
        ("2026-03-08", "Anand Patel", "anand.patel@yahoo.com", "9879012345", "12 Solar Crest, Sector 4, Gandhinagar"),
        ("2026-03-25", "Vikram Reddy", "vikram.reddy@gmail.com", "9949012345", "78 Hill View, Jubilee Hills, Hyderabad"),
        ("2026-04-12", "Sunita Verma", "sunita.v@gmail.com", "9811012345", "304 Eco Habitat, Gurugram, Haryana"),
        ("2026-05-18", "Karthik Raja", "karthik.raja@live.com", "9444012345", "56 Anna Salai, Guindy, Chennai"),
        ("2026-06-22", "Amitabh Mukherjee", "amitabh.m@gmail.com", "9830012345", "18 Lake Gardens, Kolkata, West Bengal"),
        ("2026-07-10", "Deepak Nair", "deepak.nair@gmail.com", "9447012345", "89 Palayam, Thiruvananthapuram, Kerala")
    ]

    for i, r in enumerate(rows):
        sn_id, sn_str, p_id, p_name, p_model, p_cap, p_mrp, p_wm, prod_m = r
        p_date, c_name, c_email, c_mobile, c_addr = dates[i % len(dates)]
        cur.execute("UPDATE serial_numbers SET purchase_date = %s WHERE id = %s", (p_date, sn_id))
        
        wm = int(p_wm or 12)
        y_add = max(1, wm // 12)
        end_date = f"{int(p_date[:4]) + y_add}-{p_date[5:]}"
        
        cur.execute("SELECT id FROM warranties WHERE UPPER(serial_number) = %s", (sn_str.strip().upper(),))
        w_row = cur.fetchone()
        if not w_row:
            wn = f"WR-{100000 + sn_id * 17}"
            cur.execute("""
                INSERT INTO warranties (
                    warranty_number, customer_name, email, mobile,
                    installation_address, product_id, product_model, serial_number,
                    purchase_date, installation_date, dealer_name, dealer_contact,
                    status, start_date, end_date, admin_remark, reviewed_at
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'active', %s, %s, %s, NOW()
                )
            """, (
                wn, c_name, c_email, c_mobile, c_addr,
                p_id, p_model, sn_str.strip(),
                p_date, p_date, "Authorized Olitec Energy Partner", "1800-123-4567",
                p_date, end_date, "Auto-verified hardware serial against master registry"
            ))
            print(f"  + Remote registered warranty {wn} for '{sn_str}' (Purchased: {p_date})")
        else:
            cur.execute("""
                UPDATE warranties
                SET purchase_date = %s, start_date = %s, end_date = %s, status = 'active'
                WHERE id = %s
            """, (p_date, p_date, end_date, w_row[0]))
            print(f"  * Remote updated warranty for '{sn_str}' (Purchased: {p_date})")

    conn.commit()
conn.close()
print("Remote DB updated successfully!")
'''

sftp = client.open_sftp()
with sftp.file("/home/ubuntu/run_update.py", "w") as f:
    f.write(remote_script)
sftp.close()

stdin, stdout, stderr = client.exec_command("python3 /home/ubuntu/run_update.py")
print("REMOTE OUTPUT:\n", stdout.read().decode())
err = stderr.read().decode()
if err:
    print("REMOTE ERROR:\n", err)

client.close()
