import json, urllib.request, urllib.parse, sys
sources=["precios_productos_primera_necesidad","precios-justos"]
for slug in sources:
    url='https://www.datos.gov.do/api/3/action/package_show?'+urllib.parse.urlencode({'id':slug})
    try:
        with urllib.request.urlopen(url,timeout=25) as r: d=json.load(r)
        p=d['result']; print(json.dumps({'dataset':slug,'license':p.get('license_id'),'modified':p.get('metadata_modified'),'csv':[{'url':x.get('url'),'name':x.get('name')} for x in p.get('resources',[]) if x.get('format','').lower()=='csv']},ensure_ascii=False))
    except Exception as e:
        print(slug,repr(e),file=sys.stderr)
        sys.exit(1)
