import urllib.request
import json

urls = [
    'http://192.168.1.164:4005/api/warranty-registrations/status?serialNumber=PVMODULE001',
    'http://192.168.1.164:4005/api/serial-numbers?limit=10',
    'http://localhost:4000/api/warranty-registrations/status?serialNumber=PVMODULE001',
    'http://localhost:4000/api/serial-numbers?limit=10'
]

for url in urls:
    try:
        req = urllib.request.urlopen(url, timeout=5)
        res = json.loads(req.read().decode())
        print(f"=== URL: {url} ===")
        if 'status?serialNumber=' in url:
            print(json.dumps(res, indent=2))
        else:
            items = res.get('items', [])
            print(f"Total serials: {len(items)}")
            for it in items:
                print(f"  Serial: {it.get('serialNumber'):<15} , Model: {it.get('model'):<12} , Purchased: {it.get('purchaseDate')} , Status: {it.get('warrantyStatus')}")
    except Exception as e:
        print(f"Error for {url}: {e}")
