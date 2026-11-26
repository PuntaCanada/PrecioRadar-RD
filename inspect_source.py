import csv,io,urllib.request,hashlib
URL='https://www.proconsumidor.gob.do/files/precios%20de%20productos%20de%20primera%20necesidad.csv'
with urllib.request.urlopen(URL,timeout=45) as response:
    data=response.read(20_000_001)
if not data or len(data)>20_000_000: raise ValueError('Invalid size')
print('bytes',len(data),'sha256',hashlib.sha256(data).hexdigest())
try: text=data.decode('utf-8-sig')
except UnicodeDecodeError: text=data.decode('cp1252')
dialect=csv.Sniffer().sniff(text[:8192],delimiters=',;\t')
rows=list(csv.reader(io.StringIO(text),dialect))
print('rows',len(rows),'delimiter',repr(dialect.delimiter))
for row in rows[:15]: print(repr(row))
if max(map(len,rows))<4: raise ValueError('Incomplete CSV export')
