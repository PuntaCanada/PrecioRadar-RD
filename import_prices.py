import csv,io,json,urllib.request,hashlib,os,tempfile,re
from pathlib import Path
from decimal import Decimal
URL='https://www.proconsumidor.gob.do/files/precios%20de%20productos%20de%20primera%20necesidad.csv'
MONTHS=dict(zip('enero febrero marzo abril mayo junio julio agosto septiembre octubre noviembre diciembre'.split(),range(1,13)))
def parse(data):
    try: text=data.decode('utf-8-sig')
    except UnicodeDecodeError: text=data.decode('cp1252')
    rows=csv.reader(io.StringIO(text),delimiter=';')
    found=False; result={}
    for row in rows:
        if row[:7]==['Id','Producto','Tipo','Precio','Mes','Año','establecimiento']:
            found=True; continue
        if not found or not row or not row[0].strip().isdigit(): continue
        if len(row)<7: raise ValueError('Short record')
        ident,name,unit,price,month,year,sector=[' '.join(x.split()) for x in row[:7]]
        if not all([name,unit,sector]) or month.lower() not in MONTHS or not re.fullmatch(r'20[0-9]{2}',year): raise ValueError('Invalid record '+ident)
        amount=Decimal(price.replace(',','.'))
        if not amount.is_finite() or amount<=0: raise ValueError('Invalid price')
        period=f'{year}-{MONTHS[month.lower()]:02d}'
        key=(name.casefold(),unit.casefold(),period,sector.casefold())
        record=dict(name=name,unit=unit,price=float(amount),period=period,sector=sector,source=URL)
        if key in result and result[key]!=record: raise ValueError('Conflicting observation '+str(key))
        result[key]=record
    if not found or len(result)<100: raise ValueError('Incomplete data')
    return list(result.values())
def main():
    with urllib.request.urlopen(URL,timeout=45) as r: data=r.read(20_000_001)
    if not data or len(data)>20_000_000: raise ValueError('Invalid download size')
    rows=parse(data)
    print('validated',len(rows),'periods',sorted({r['period'] for r in rows}),'segments',sorted({r['sector'] for r in rows}),'sha256',hashlib.sha256(data).hexdigest())
    # Public dataset write only once exact reuse terms are documented.
    if os.getenv('PRICE_REUSE_APPROVED')!='yes': return
    target=Path('data/observations.json')
    old=json.loads(target.read_text())
    def key(r): return (r['name'].casefold(),r['unit'].casefold(),r.get('period',r.get('date')),r['sector'].casefold(),r['source'])
    combined={key(r):r for r in old}
    for r in rows: combined[key(r)]=r
    fd,tmp=tempfile.mkstemp(dir=target.parent)
    try:
        with os.fdopen(fd,'w',encoding='utf-8') as f: json.dump(list(combined.values()),f,ensure_ascii=False,indent=2);f.write('\n');f.flush();os.fsync(f.fileno())
        os.replace(tmp,target)
    finally:
        if os.path.exists(tmp): os.unlink(tmp)
if __name__=='__main__': main()
