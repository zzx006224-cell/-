"""Extract all original pages for review; never infer new Chinese summaries."""
import json,hashlib
from pathlib import Path
from pypdf import PdfReader
root=Path(__file__).resolve().parent.parent
result=[]
for id in ('discipline','hostel','dress'):
    file=root/'rules-assets'/f'{id}.pdf'
    reader=PdfReader(file)
    result.append({'id':id,'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'pageCount':len(reader.pages),'pages':[{'pdfPage':i+1,'text':p.extract_text(extraction_mode='layout'),'imageCount':len(p.images)} for i,p in enumerate(reader.pages)]})
target=root/'rules-tools'/'extracted-pages.json'
target.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
print('Extracted',sum(d['pageCount'] for d in result),'pages to',target)
