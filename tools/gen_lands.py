#!/usr/bin/env python3
"""Generate the map scenes: the Lands card, a page per Land, a page per Prussian district and
one scene per district action. Run from the repository root:

    python3 tools/gen_lands.py

The rules (who may act where, the effects, the numbers) live in out/html/kpd.js (KPD.LANDS,
KPD.DISTRICTS, KPD.ACTIONS); keep the lists below in step with it. This file only writes scenes.
"""
import os

OUT = 'source/scenes/lands'

LANDS = [  # id, name, districts
    ('prussia', 'Prussia', ['berlin', 'ruhr', 'central']),
    ('saxony', 'Saxony', ['saxony']),
    ('thuringia', 'Thuringia', ['thuringia']),
    ('hamburg', 'Hamburg', ['hamburg']),
    ('bavaria', 'Bavaria', ['bavaria']),
]
DISTRICT_NAMES = {'berlin': 'Berlin', 'ruhr': 'Rhine and Ruhr', 'central': 'Central Germany', 'saxony': 'Saxony',
                  'thuringia': 'Thuringia', 'hamburg': 'Hamburg', 'bavaria': 'Bavaria'}

# id, title, summary, unavailable reason, result text ({name} = the district)
ACTIONS = [
    ('organise', 'Build factory cells and recruit', 'Organisation +5 × m. Costs 1 resource.', 'Needs 1 resource.',
     'Organisers go from works gate to works gate in {name}. New cells meet in back rooms after the shift. The dues book fills slowly, and so does the list of names the police would like to have.'),
    ('struggle', 'Lead a strike or an unemployed march', 'Organisation +2 × m, strikes +1, pressure rises. The Left gains.', 'Needs organisation 25 here.',
     'In {name} the party calls the workers out: a strike over the wage the inflation ate this week, a march of the unemployed to the town hall. The employers answer with lockouts and the police with batons, and the workers see who stood with them.'),
    ('front', 'Act together with the SPD workers', 'Joint actions +1. Costs 1 resource. The Right gains, the Left grumbles.', 'Needs 1 resource and organisation 20 here.',
     'In {name} our cells go to the SPD and union branches with a concrete proposal, not a lecture: a joint meeting, a joint demand, a joint committee. Some branch secretaries refuse. Some of their members come anyway.'),
    ('defence', 'Form a unit of the Proletarian Hundreds', 'Hundreds +1 here. Pressure rises sharply. Costs 1 resource.', 'Needs 1 resource and organisation 30 here.',
     'A new unit of the Proletarian Hundreds forms in {name}: workers from the same works, drilling at night with what weapons they have. Today they protect meetings. What they will be asked to do tomorrow is a question the party has not yet answered.'),
    ('control', 'Set up price control committees', 'Organisation +3 × m; housewives and the unemployed come to us.', 'Needs organisation 35 here.',
     'Control committees of workers and housewives go to the markets of {name}, check prices and hoards, and post the names of the profiteers. The police call it vigilantism. The queues call it the first sensible thing anyone has done.'),
    ('mayday', 'Hold May Day in Munich against the leagues', 'Organisation +4 × m, joint actions +1.', '',
     'On the first of May the workers of Munich march, while the völkisch leagues gather under arms on the Oberwiesenfeld. This time the state holds the leagues back, and the workers see that they can be faced.'),
    ('border', 'Watch the Bavarian border with the Thuringian Hundreds', 'Hundreds +1 in Thuringia, joint actions +1. Costs 1 resource.', 'Needs 1 resource and organisation 30 in Thuringia.',
     'Hundreds from Thuringia take up watch along the Bavarian border, where the leagues are gathering. It is a job the Reich will not do, and the workers of the border towns notice who does it.'),
    ('underground', 'Move the work underground', 'Pressure −12. Costs 1 resource.', 'Needs 1 resource.',
     'In {name} the work moves out of sight: lists burned, meetings in allotment huts, a second set of officers ready for the day the first are arrested.'),
]


def insert(kind, arg=''):
    return '{!<div class="kpd-insert" data-insert="%s" data-arg="%s"></div>!}' % (kind, arg)


def action_scene(d, a):
    aid, title, summary, why, text = a
    return f"""@act_{d}_{aid}
title: {title}
subtitle: {summary}
view-if: x_{d}_{aid} = 1
choose-if: c_{d}_{aid} = 1
unavailable-subtitle: [? if d_{d}_cd > 0 : We acted here this turn. ?][? if d_{d}_cd <= 0 : {why} ?]
on-arrival: {{! window.KPD.act(Q, '{d}', '{aid}'); !}}
new-page: true

= {title}

{text.format(name=DISTRICT_NAMES[d])}

{insert('district', d)}

- @root: Continue.

"""


def district_options(d):
    return ''.join(f'- @act_{d}_{a[0]}\n' for a in ACTIONS)


def main():
    os.makedirs(OUT, exist_ok=True)
    # the pinned card and the map
    opts = ''.join(f'- @to_{l}: {name}\n' for l, name, _ in LANDS)
    views = ''.join(f'@to_{l}\nview-if: x_{l} = 1\ngo-to: land_{l}\n\n' for l, name, _ in LANDS)
    with open(os.path.join(OUT, 'lands.scene.dry'), 'w') as f:
        f.write(f"""title: The Lands
subtitle: Where the party works and fights.
card-image: img/cards/map.svg
is-pinned-card: true
tags: mapcard
new-page: true

= The Lands

{insert('map')}

- @root: Back to the party.
{opts}
{views}""")
    for l, name, ds in LANDS:
        if len(ds) > 1:
            dopts = ''.join(f'- @to_{d}: {DISTRICT_NAMES[d]}\n' for d in ds)
            dviews = ''.join(f'@to_{d}\nview-if: x_{d} = 1\ngo-to: district_{d}\n\n' for d in ds)
            body = f"""{insert('land', l)}

- @lands: Back to the map.
{dopts}
{dviews}"""
        else:
            d = ds[0]
            body = f"""{insert('land', l)}

{insert('district', d)}

- @lands: Back to the map.
{district_options(d)}
{''.join(action_scene(d, a) for a in ACTIONS)}"""
        with open(os.path.join(OUT, f'land_{l}.scene.dry'), 'w') as f:
            f.write(f"""title: {name}
new-page: true
on-arrival: land_view = "{l}"

= {name}

{body}""")
        if len(ds) > 1:
            for d in ds:
                with open(os.path.join(OUT, f'district_{d}.scene.dry'), 'w') as f:
                    f.write(f"""title: {DISTRICT_NAMES[d]}
new-page: true
on-arrival: district_view = "{d}"

= {DISTRICT_NAMES[d]}

{insert('district', d)}

- @land_{l}: Back to {name}.
{district_options(d)}
{''.join(action_scene(d, a) for a in ACTIONS)}""")


if __name__ == '__main__':
    main()
