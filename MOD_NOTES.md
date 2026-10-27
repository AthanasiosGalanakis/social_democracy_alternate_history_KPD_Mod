# KPD mod: working notes

A near total conversion of Autumn Chen's *Social Democracy: An Alternate History* (MIT licence, see LICENSE). The player leads the KPD, starting in January 1923.

Decisions so far:

- Start: January 1923 (German October). Only start for now.
- Player is the KPD leadership. Internal factions and a "Party Line" replace the government/toleration loop.
- The KPD may join governments, depending on which faction leads.
- Moscow/Comintern is a mechanic the player can influence. Outcomes follow visible conditions, never random rolls.
- Armed insurrection and civil war are playable outcomes.
- English only. Critical Marxist voice: critical of the KPD and Comintern, of the NSDAP and DNVP, and later of the bourgeois parties that enabled the NSDAP.

Keep from the base game: look, monthly ticks, hand/deck/advisor cards, elections, events, modifiers.

Build with `dendrynexus make-html` (see README.md).

## Status (milestone M1, shell conversion)

- Starts January 1923; the first election is May 1924. The Reichstag starts from the June 1920 result (rounded, USPD inside "other").
- The hand holds the KPD Party Affairs deck (Campaigning, Fundraising) and no advisors yet. The SPD Government Affairs deck is no longer in the hand.
- Only scenes tagged `kpd_event` run as events. The old SPD-era `event` scenes stay in the repo, unused, until they are rewritten. The Reichstag election scene is tagged for both so elections still happen.
- Known gaps: class-by-party support numbers are still the 1928 placeholders; the election aftermath and government formation are still the SPD versions (milestone M7); the Library and credits still describe the base game.

## Status (milestone M2, Party Line system)

- Pinned "Party Line" card shows the faction in power, its 5-step plan, and the other factions' plans.
- "Work for the Party Line" card: two actions per line, each adds 1 step to that plan (1 resource, except the apparatus line).
- Line contests: the "Contest for the party line" event runs when `line_change_open = 1`. Winner = larger total weight (strength minus a fifth of dissent, +10 if Moscow favours it, +5 for the faction in power, +15 for the side the leadership backs). No random rolls. The winner takes the line, the loser gets +15 dissent, zigzag +3, Moscow trust +-8, and the player chooses purge (loser's strength halved, members lost) or tolerate.
- Crisis path: the "Call an extraordinary conference" card appears when the line holder's dissent is 20 or more; congress, plenum and Moscow-intervention triggers come with the events (M4, M5).
- Plans of factions out of power lose 0.25 step per month; zigzag recovers 1 per 6 months; each zigzag point cuts campaign gains 4%.

## M4 Moscow (feat/moscow)
- moscow_balance (-100 Left Opposition to +100 Stalin) drifts +0.8 a month. Thresholds: <= -30 Trotsky-Radek (favours Left), -29 to 24 Zinoviev-Kamenev-Stalin (Right), 25-59 Stalin-Bukharin (Centre), 60+ Stalin (Apparatus). No dice.
- Card "Send a delegation to Moscow" (3 month timer): lobby for the Opposition (-9 balance, -6 trust), for the Secretariat (+8, +4 trust), or an obedient report (+5 trust).
- Divergence ladder: each month with a line Moscow does not favour adds 1 point (0.5 at trust 75+); 3 points per step. Steps: warning, subsidy cut, Moscow backs the favoured faction, Open Letter, removal by decree (forced line change). Aligned months remove 2 points.
- Soviet subsidy gives 1 resource a quarter while active.
- Events: moscow_divergence, moscow_change. Balance numbers are placeholders to tune in M5.
## Status (milestone M3, KPD advisers)

- Eleven advisers as pinned cards, tagged by faction: Right (Brandler, Thalheimer, Walcher), Left (Fischer, Maslow, Thälmann), Centre (Meyer, Zetkin, Pieck), Moscow apparatus (Radek, Eberlein). Two actions each, one action every 4 months (`advisor_action_timer`). Effects are first-pass numbers.
- Start: Brandler, Pieck and Eberlein advise; at most 3 advisers at a time.
- "Reshape the leadership" card (every 8 months): bringing someone in gives their faction +4 strength; removing someone is a purge (+5 dissent for their faction).
- Biographical lines are written from memory and need a fact check before release. Gating by date (e.g. Fischer joining the leadership in April 1923 by Comintern order) comes with the 1923 events (M5); for now all are available.

## M5 1923 campaign (content/1923-october)
- Scripted hyperinflation: dollar rate per month and inflation set in post_event until 1924, then the real economy takes over.
- Events (ids y23_*): Ruhr occupation, Leipzig congress, prices, Ruhr strikes, Schlageter line, Anti-Fascist Day, fall of Cuno, Moscow decides, state of emergency, Saxony and Thuringia governments, Chemnitz, Hamburg, Reichsexekution, Munich putsch, Rentenmark, ban, post-mortem.
- Chemnitz is deterministic. Readiness = unity with the SPD left (5 per joint action, max 30) + Hundreds (6 each, max 30) + strikes (3 each, max 10) + workers' governments (10 Saxony, 5 Thuringia) + Moscow (5 subsidy, 10 if Trotsky-Radek lead, 5 if trust 60+). Rising succeeds at 75 with unity 15; a strike holds at 60 with unity 15; calling off leads to Hamburg only under the Left line.
- Civil war: four campaign months, strength vs the Reichswehr (+5 a month); more than 10 ahead wins, within 10 is a long war, otherwise defeat. Endings are in kpd_endings.scene.dry; the base-game endings still appear and are replaced in M10.
- To verify before release: Leipzig congress dates, Cuno strike dates, ECCI Politburo positions (Zinoviev, Trotsky, Stalin), Hamburg casualty figure, Reichsexekution and ban dates, the Dec 1923 working-time decree, Rentenmark rate wording.

## M6 Mass Work deck (feat/mass-work-deck)
- Second deck "Mass Work" (tag kpd_mass) next to Party Affairs. It replaces the Government Affairs deck.
- Seven cards: strikes and factory councils, unemployed councils, workers' relief, the party press, defence units (Proletarian Hundreds, RFB from July 1924), parliamentary tactics, underground work (only while banned).
- The actions do not depend on the party line. They feed the same counters as the line actions (y23_unity, y23_hundreds, y23_strikes), so every faction can prepare for October, which is what makes the Chemnitz thresholds reachable.
- To verify: the RFB founding date (July 1924), Münzenberg's International Workers' Aid.

## M7 Governments and elections (feat/kpd-government)
- The election results page now leads to kpd_aftermath instead of the SPD coalition menu. The Reich government is formed from the result alone (Weimar, Grand, bourgeois, right, or a minority cabinet); the player decides only where the KPD stands.
- Options: opposition; tolerate an SPD-led minority cabinet; propose a workers' government. Requirements are visible: Right or Centre leads the party, Moscow trust 40+, joint work with the SPD 6+ (y23_unity), and for the workers' government SPD+KPD above 50%.
- Land governments (card "The Land governments", Mass Work deck, from 1924): Saxony and Thuringia need unity 6, Prussia unity 10. Each pays 1 resource a quarter and adds 1 Left dissent. The Reich removes the Saxony and Thuringia cabinets if the armed units exceed 250.
- If the line changes away from Right/Centre, or trust falls under 20, a government crisis ends the partnership.
- The revolutionary government path is the October civil war branch from M5 (endings in kpd_endings.scene.dry). A second route is left for M8 to M10.
- Still SPD-era: much of election_1928.scene.dry below the results page (coalition scenes, now unreachable), and the base-game endings.
