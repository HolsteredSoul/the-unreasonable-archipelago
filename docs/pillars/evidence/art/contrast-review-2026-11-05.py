"""Read-only review arithmetic: explicit opaque CSS pairs, not screenshot pixels.

Run from repository root: python docs/pillars/evidence/art/contrast-review-2026-11-05.py
Outputs JSON to stdout. No source files or evidence files are modified.
Normal text target: 4.5; large display text / focus boundary target: 3.0.
This scoped calculation is not a whole-product accessibility certification.
"""
import json


def luminance(hex_color):
    channels = [int(hex_color[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    linear = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in channels]
    return sum(c * weight for c, weight in zip(linear, (0.2126, 0.7152, 0.0722)))


def contrast(fg, bg):
    low, high = sorted((luminance(fg), luminance(bg)))
    return (high + 0.05) / (low + 0.05)


# (selector/state, foreground, opaque background, target)
current = [
    ('.save-status', '#66391f', '#fff1da', 4.5),
    ('.save-recovery-note', '#315b54', '#e6eadc', 4.5),
    ('.finale-checks .ready', '#38694e', '#e8eddf', 4.5),
    ('.finale-checks .not-ready', '#9a5134', '#e8eddf', 4.5),
    ('.finale-checks section > p', '#4d6555', '#e8eddf', 4.5),
    ('.finale-check-modal .finale-rule, .finale-retry p', '#6f7866', '#f5f1e5', 4.5),
    ('.finale-check-modal .final-accept', '#956446', '#f5f1e5', 4.5),
    ('.campaign-pair > p span', '#7c8170', '#f5f0e2', 4.5),
    ('.campaign-progression', '#69786e', '#f5f0e2', 4.5),
    ('.campaign-chart-heading > strong', '#526d61', '#f5f0e2', 4.5),
    ('.campaign-map small [current/hover enabled]', '#52675a', '#edf2df', 4.5),
    ('.campaign-map small [default enabled]', '#52675a', '#fffbee', 4.5),
    ('.campaign-map-action [current/hover enabled]', '#365c4c', '#edf2df', 4.5),
    ('.campaign-map-number [current enabled; redundant ordinal]', '#69927e', '#edf2df', 4.5),
    ('.campaign-replay-note', '#486452', '#f5f0e2', 4.5),
    ('.campaign-medal-help', '#385d49', '#f5f0e2', 4.5),
    ('.campaign-save-note', '#59695e', '#f5f0e2', 4.5),
    ('.campaign-bell small', '#6c7b65', '#e6ecdd', 4.5),
    ('.campaign-bell.needs-shelter small', '#975a36', '#f0e4ce', 4.5),
    ('.campaign-bell .queued-growth', '#477254', '#e6ecdd', 4.5),
    # The small element selector is more specific than .campaign-bell .queued-growth.
    ('.campaign-bell.needs-shelter small.queued-growth [winning small rule]', '#975a36', '#f0e4ce', 4.5),
    ('.result-modal .result-verdict', '#42755d', '#f5f1e5', 4.5),
    ('.result-modal.result-lost .result-verdict', '#aa604e', '#f5f1e5', 4.5),
    ('.result-conditions strong', '#345f4f', '#e9ecdf', 4.5),
    ('.result-conditions .needs-care', '#a75f4d', '#e9ecdf', 4.5),
    ('.campaign-unlock', '#567b56', '#f5f1e5', 4.5),
    ('.modal-lead [ordinary modal]', '#7e8671', '#f5f1e5', 4.5),
    ('.modal h2 em [large ordinary modal heading]', '#87906e', '#f5f1e5', 3.0),
    ('.primary-button [ordinary modal]', '#f5f1df', '#315846', 4.5),
    ('.secondary-button [default]', '#738163', '#eaeadd', 4.5),
    ('.secondary-button [hover]', '#738163', '#dee3d0', 4.5),
    ('.text-button [ordinary modal]', '#879472', '#f5f1e5', 4.5),
    ('button/input:focus-visible [ordinary modal surrounding surface]', '#bf8d3f', '#f5f1e5', 3.0),
    ('button:focus-visible [campaign chart surrounding surface]', '#bf8d3f', '#f5f0e2', 3.0),
    ('button:focus-visible [finale check section surrounding surface]', '#bf8d3f', '#e8eddf', 3.0),
]
proposed = [
    ('modal-lead / finale rule / retry helper -> #52675a', '#52675a', '#f5f1e5', 4.5),
    ('campaign metadata / progression -> #59695e', '#59695e', '#f5f0e2', 4.5),
    ('secondary-button -> #52675a default', '#52675a', '#eaeadd', 4.5),
    ('secondary-button -> #52675a hover', '#52675a', '#dee3d0', 4.5),
    ('modal text-button -> #52675a', '#52675a', '#f5f1e5', 4.5),
    ('modal large emphasis -> #6f7866', '#6f7866', '#f5f1e5', 3.0),
    ('campaign-bell small -> #52675a', '#52675a', '#e6ecdd', 4.5),
    ('needs-shelter small / queued -> #9a5134', '#9a5134', '#f0e4ce', 4.5),
    ('final-accept -> #9a5134', '#9a5134', '#f5f1e5', 4.5),
    ('result needs-care -> #9a5134', '#9a5134', '#e9ecdf', 4.5),
    ('lost verdict -> #9a5134', '#9a5134', '#f5f1e5', 4.5),
    ('campaign unlock -> #486452', '#486452', '#f5f1e5', 4.5),
    ('focus on ordinary modal -> #264d45', '#264d45', '#f5f1e5', 3.0),
    ('focus on campaign chart -> #264d45', '#264d45', '#f5f0e2', 3.0),
    ('focus on finale check section -> #264d45', '#264d45', '#e8eddf', 3.0),
]

def rows(pairs):
    return [dict(selector=name, foreground=fg, background=bg, ratio=round(contrast(fg, bg), 4),
                 target=target, meets_target=contrast(fg, bg) >= target)
            for name, fg, bg, target in pairs]


print(json.dumps({
    'method': 'sRGB linearization, weighted relative luminance, (Lmax + .05)/(Lmin + .05)',
    'scope': 'Explicit opaque CSS pairs only; no disabled opacity, gradients, sea, alpha panels, or screenshot sampling.',
    'current': rows(current), 'proposed_not_applied': rows(proposed),
}, indent=2))
