import io,json,urllib.request,hashlib
URL="https://www.proconsumidor.gob.do/files/precios%20de%20productos%20de%20primera%20necesidad.json"
with urllib.request.urlopen(urllib.request.Request(URL,headers={'User-Agent':'PublicDataDirectory/1.0'}),timeout=45) as response:
    data=response.read(20_000_001)
if not data or len(data)>20_000_000: raise ValueError('Invalid download size')
print('bytes',len(data),'sha256',hashlib.sha256(data).hexdigest())
doc=json.loads(data)
for key,value in doc.items():
    print('section',key,'type',type(value).__name__,'length',len(value))
    if isinstance(value,list):
        for i,row in enumerate(value):
            if i<4 or i%100==0 or (isinstance(row,dict) and any(str(v).lower() in ('producto','productos','presentacion','presentación','supermercado','mercado','colmado','almacen','almacén') for v in row.values())): print(i,repr(row)[:1500])

