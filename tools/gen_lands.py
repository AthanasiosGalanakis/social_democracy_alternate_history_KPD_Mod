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
    ('organise', 'Build factory cells and recruit', 'Builds organisation. Costs 1 resource.', 'Needs 1 resource.',
     'Organisers go from works gate to works gate in {name}. New cells meet in back rooms after the shift. The dues book fills slowly, and so does the list of names the police would like to have.'),
    ('struggle', 'Lead a strike or an unemployed march', 'Some organisation; the police take note. The Left gains.', 'Needs at least a thin organisation here.',
     'In {name} the party calls the workers out: a strike over the wage the inflation ate this week, a march of the unemployed to the town hall. The employers answer with lockouts and the police with batons, and the workers see who stood with them.'),
    ('front', 'Build the united front with SPD and union workers', 'Widens the united front. Costs 1 resource. The Right gains, the Left grumbles.', 'Needs 1 resource and at least a weak organisation here.',
     'In {name} our cells go to the SPD and union branches with a concrete proposal, not a lecture: a joint meeting, a joint demand, a joint committee. Some branch secretaries refuse. Some of their members come anyway.'),
    ('defence', 'Form a unit of the Proletarian Hundreds', 'A new unit here. The state answers. Costs 1 resource.', 'Needs 1 resource and at least a thin organisation here.',
     'A new unit of the Proletarian Hundreds forms in {name}: workers from the same works, drilling at night with what weapons they have. Today they protect meetings. What they will be asked to do tomorrow is a question the party has not yet answered.'),
    ('control', 'Set up price control committees', 'Builds organisation; housewives and the unemployed come to us.', 'Needs at least a solid organisation here.',
     'Control committees of workers and housewives go to the markets of {name}, check prices and hoards, and post the names of the profiteers. The police call it vigilantism. The queues call it the first sensible thing anyone has done.'),
    ('mayday', 'Hold May Day in Munich against the leagues', 'Builds organisation and the united front.', '',
     'On the first of May the workers of Munich march, while the völkisch leagues gather under arms on the Oberwiesenfeld. This time the state holds the leagues back, and the workers see that they can be faced.'),
    ('border', 'Watch the Bavarian border with the Thuringian Hundreds', 'A new unit in Thuringia, and the united front grows. Costs 1 resource.', 'Needs 1 resource and at least a thin organisation in Thuringia.',
     'Hundreds from Thuringia take up watch along the Bavarian border, where the leagues are gathering. It is a job the Reich will not do, and the workers of the border towns notice who does it.'),
    ('underground', 'Move the work underground', 'Eases the pressure. Costs 1 resource.', 'Needs 1 resource.',
     'In {name} the work moves out of sight: lists burned, meetings in allotment huts, a second set of officers ready for the day the first are arrested.'),
]


DEV = {'organise': 'org +5×m', 'struggle': 'org +2×m, pressure +6, strikes +1, workers_kpd +1×m, kf_left_strength +1', 'front': 'resources −1, unity +1, org +1, spd_relation +1, kf_right_strength +1, kf_left_dissent +2', 'defence': 'resources −1, units +1, pressure +7, kf_left_strength +1', 'control': 'org +3×m, pressure +3, workers_kpd +1×m, unemployed_kpd +1×m', 'mayday': 'org +4×m, pressure +5, unity +1', 'border': 'resources −1, Thuringia units +1, unity +1', 'underground': 'resources −1, pressure −12, org +1'}


def insert(kind, arg=''):
    return '{!<div class="kpd-insert" data-insert="%s" data-arg="%s"></div>!}' % (kind, arg)


def action_scene(d, a):
    aid, title, summary, why, text = a
    return f"""@act_{d}_{aid}
title: {title}
subtitle: {summary} · dev: {DEV[aid]}
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
