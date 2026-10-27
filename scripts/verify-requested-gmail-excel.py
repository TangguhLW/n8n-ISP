import json
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

root = Path('data/whatsapp')
ns = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}

def cells(path):
    with zipfile.ZipFile(path) as archive:
        shared = []
        if 'xl/sharedStrings.xml' in archive.namelist():
            strings = ET.fromstring(archive.read('xl/sharedStrings.xml'))
            shared = [''.join(item.itertext()) for item in strings]
        sheet = ET.fromstring(archive.read('xl/worksheets/sheet1.xml'))
        result = {}
        for cell in sheet.findall('.//m:sheetData/m:row/m:c', ns):
            value = cell.find('m:v', ns)
            text = value.text if value is not None else ''
            if cell.get('t') == 's':
                text = shared[int(text)]
            elif cell.get('t') == 'inlineStr':
                inline = cell.find('m:is', ns)
                text = ''.join(inline.itertext()) if inline is not None else ''
            if text:
                result[cell.get('r')] = text
            assert cell.get('t') != 'e', f'Excel error at {cell.get("r")}'
        return result

before = cells(root / 'e-somasi-whatsapp.xlsx')
after = cells(root / 'e-somasi-whatsapp.gmail.pending.xlsx')
report = json.loads((root / 'gmail-excel-report.json').read_text(encoding='utf-8'))
for address, value in before.items():
    assert after.get(address) == value, f'Existing value changed at {address}'
emails = []
for row in range(report['existingRows'] + 2, report['finalRows'] + 2):
    email = after.get(f'H{row}', '')
    assert email.endswith('@gmail.com'), f'Invalid Gmail row {row}'
    assert not after.get(f'G{row}'), f'Unverified number assigned at row {row}'
    assert not after.get(f'B{row}'), f'Unverified name assigned at row {row}'
    assert after.get(f'R{row}'), f'Source missing at row {row}'
    emails.append(email.lower())
assert len(emails) == len(set(emails)) == report['addedEmails']
print(json.dumps({'verified': True, 'existingValuesPreserved': len(before), 'addedEmails': len(emails), 'finalRows': report['finalRows']}))
