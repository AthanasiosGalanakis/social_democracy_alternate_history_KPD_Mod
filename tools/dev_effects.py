#!/usr/bin/env python3
"""Append the numeric effects of every choice to its subtitle, for the dev site.

Usage: python3 tools/dev_effects.py          add or refresh the effects
       python3 tools/dev_effects.py --strip  remove them again (for a release)

Only single-line on-arrival statements of the form "name += x", "name -= x" or "name = x" are listed.
The suffix always starts with SEP so that it can be removed again.
"""
import re, sys, glob

SEP = ' · dev: '
SKIP_FILES = ('root.scene.dry', 'post_event.scene.dry', 'status.scene.dry', 'library.scene.dry')
SKIP_VAR = re.compile(r'(_done|_timer|_pending)$|^month_actions$|^difficulty$|^kpd_ending$|^y23_outcome$|^civil_war$|^cw_')
STMT = re.compile(r'^\s*([A-Za-z_][A-Za-z_0-9]*)\s*(\+=|-=|=)\s*(.+?)\s*$')


def describe(expr):
    expr = expr.strip()
    expr = re.sub(r'\*\s*campaign_mult', '×m', expr)
    return expr.replace('-', '−') if re.match(r'^-?[0-9.]+', expr) else expr


def effects(line):
    out = []
    for part in line.split(';'):
        part = part.strip()
        if not part:
            continue
        cond = ''
        m = re.match(r'^(.*?)\s+if\s+(.+)$', part)
        if m:
            part, cond = m.group(1), ' (if ' + m.group(2).strip() + ')'
        m = STMT.match(part)
        if not m:
            continue
        name, op, val = m.groups()
        if SKIP_VAR.search(name):
            continue
        if name == 'comintern_trust':
            name = 'trust'
        if op == '=':
            out.append('%s = %s%s' % (name, describe(val), cond))
        else:
            sign = '+' if op == '+=' else '−'
            out.append('%s %s%s%s' % (name, sign, describe(val), cond))
    return out


def process(text, strip):
    blocks = re.split(r'(?m)^(?=@[A-Za-z_0-9.]+\s*$)', text)
    result = []
    for b in blocks:
        if not b.startswith('@'):
            result.append(b)
            continue
        lines = b.split('\n')
        eff = []
        sub_idx = None
        for i, l in enumerate(lines):
            if l.startswith('subtitle:'):
                sub_idx = i
            if l.startswith('on-arrival:'):
                eff = effects(l[len('on-arrival:'):])
        if sub_idx is not None and SEP in lines[sub_idx]:
            lines[sub_idx] = lines[sub_idx].split(SEP)[0].rstrip()
        if not strip and eff:
            suffix = SEP + ', '.join(eff)
            if sub_idx is not None:
                lines[sub_idx] = lines[sub_idx] + suffix
            else:
                lines.insert(1, 'subtitle: ' + suffix.lstrip(' ·').strip())
        elif strip and sub_idx is not None and lines[sub_idx].startswith('subtitle: dev: '):
            del lines[sub_idx]
        result.append('\n'.join(lines))
    return ''.join(result)


def main():
    strip = '--strip' in sys.argv
    for path in glob.glob('source/scenes/**/*.scene.dry', recursive=True):
        if path.split('/')[-1] in SKIP_FILES:
            continue
        text = open(path).read()
        new = process(text, strip)
        if new != text:
            open(path, 'w').write(new)


if __name__ == '__main__':
    main()
