import urllib.request
import json

req = urllib.request.Request(
    'http://192.168.1.164:4005/api/auth/login',
    data=json.dumps({'email': 'admin@olitec.in', 'password': 'admin123'}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)
try:
    with urllib.request.urlopen(req) as resp:
        body = json.loads(resp.read().decode('utf-8'))
        token = body.get('token') or body.get('data', {}).get('token')
        print('Logged in successfully.')
        
        sn_req = urllib.request.Request(
            'http://192.168.1.164:4005/api/admin/serial-numbers',
            headers={'Authorization': f'Bearer {token}'}
        )
        with urllib.request.urlopen(sn_req) as sn_resp:
            sn_body = json.loads(sn_resp.read().decode('utf-8'))
            items = sn_body.get('data') or sn_body.get('items', [])
            print(f'Total serials returned: {len(items)}')
            for it in items:
                print(f"Serial: {it.get('serialNumber'):<16} , Model: {it.get('modelNumber') or it.get('model'):<12} , Purchased: {it.get('purchaseDate')} , Status: {it.get('warrantyStatus')}")
except Exception as e:
    print('Error:', e)
