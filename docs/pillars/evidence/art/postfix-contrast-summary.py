"""Summarize saved computed CSS from the isolated production-stylesheet fixture.
Run from the repository root; writes JSON to stdout only.
"""
from pathlib import Path
import hashlib
import json
import re

root = Path(__file__).resolve().parents[4]
capture = json.loads((Path(__file__).parent / 'postfix-computed-css-2026-11-05.json').read_text(encoding='utf-8-sig'))


def lum(rgb):
    values = [float(x) / 255 for x in re.findall(r'[\d.]+', rgb)[:3]]
    linear = [x / 12.92 if x <= .04045 else ((x + .055) / 1.055) ** 2.4 for x in values]
    return sum(x * y for x, y in zip(linear, (.2126, .7152, .0722)))


def ratio(a, b):
    low, high = sorted((lum(a), lum(b)))
    return round((high + .05) / (low + .05), 4)


for row in capture['focus']:
    surface = row['surrounding']
    if surface['image'] == 'none':
        row['opaque_surface_ratio'] = ratio(row['colour'], surface['colour'])
    else:
        row['gradient_endpoint_ratios_only'] = [ratio(row['colour'], stop) for stop in re.findall(r'rgb\([^)]+\)', surface['image'])]
        row['measurement_limit'] = 'Endpoint calculations, not a sampled rendered focus-ring contrast.'
css = root / capture['css']
capture['css_sha256'] = hashlib.sha256(css.read_bytes()).hexdigest()
capture['limits'] = 'Colour/cascade fixture only. Font sizes/DOM ancestry are representative, not a whole-game accessibility audit. No exact alpha/sea contrast claim.'
print(json.dumps(capture, indent=2))
