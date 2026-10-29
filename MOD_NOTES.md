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
- Civil war: four campaign months, strength vs the Reichswehr (starts at 95, +6 a month); more than 10 ahead wins, within 10 is a long war, otherwise defeat. Endings are in kpd_endings.scene.dry; the base-game endings still appear and are replaced in M10.
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

## Cleanup round (fix/facts-and-cleanup)
- Fact-checked against Wikipedia (German October, Hamburg Uprising, Cuno strikes, Beer Hall Putsch, Heinrich Brandler, Fritz Heckert), the LeMO pages of the Deutsches Historisches Museum and weimarer-republik.net, and Radek's Schlageter speech on marxists.org. Corrected: Rentenmark rate (4.2 trillion, not billion), Beer Hall casualties (16 Nazis, 4 police, 1 bystander), Hamburg dates and casualties (about 100 dead, 61 of them bystanders), Reichswehr entry into Saxony (23 Oct, not 27 Oct), Thuringia (cabinet dissolved itself), Politburo positions, Soviet committee (Radek, Unshlikht, Schmidt, Pyatakov), Radek's speech date (20 June) and title phrase, ban dates (23 Nov 1923 to 1 Mar 1924), Hitler's sentence, adviser bios (Fischer, Maslow, Meyer).
- Still unverified: monthly dollar rates are approximate; Böttcher as Saxon finance minister; the Dec 1923 labour decree date (only 'December 1923' is stated); RFB founding in July 1924; Münzenberg's International Workers' Aid.
- Removed the base game's SPD scenes (advisers, party affairs, government affairs, historical events 1929 to 1934), the SPD coalition scenes in the election file, and the old endings, library and achievements. Credits keep the base-game attributions. The unused SPD state variables in root.scene.dry remain; they are harmless and will be pruned as later milestones touch them.
- Balance: rising needs 85 readiness (was 75), a strike holds at 65 (was 60). Best play from events alone reaches about 74, so a rising needs at least a few deliberate Mass Work actions. Civil war: Reichswehr starts at 95 and grows 6 a month; a victory needs mostly Moscow and SPD-defection actions and a readiness near 85 or more.

## M8 1924 to 1927 (content/1924-1927)
- Elections now follow the historical dates: May 1924, December 1924, May 1928, then every four years. The 1923 class-by-party numbers were retuned so that a play without campaigns gives roughly the May 1924 result (estimates, not survey data).
- Events (y24_, y25_, y26_, y27_): Brandler recalled, legal again, Frankfurt congress (Left takeover contest after a failed October), Fifth Comintern Congress (bolshevisation), the RFB, Dawes Plan with the stabilisation swing, Ebert's death and the presidential election, the ECCI resolution against Fischer and Maslow, the princes' referendum, the expulsion, the DNVP in government, the Conciliators (fifth faction), and the 15th congress in Moscow.
- Moscow: after a failed October the troika's favoured faction is the Left (bolshevisation). The Stalin-Bukharin phase (balance 25 and up) triggers the ECCI resolution, which forces the favoured faction into the leadership. If Trotsky and Radek lead (balance -30 or lower) the 15th congress goes the other way.
- Deterministic branches: Marx wins the second round only if the KPD withdraws, which needs the Right or Centre in the lead, trust 40 and joint work 6. The princes' referendum passes at joint work 8 (yes turnout is 30 percent plus 2.5 per point of joint work, quorum 50 percent).
- To verify: tenth party congress date, Fischer's February 1926 meeting with Stalin, the Conciliators' membership (Ewert, Eisler, Eberlein).

## M9 1928 to 1933 (content/1928-1933)
- Elections: May 1928, September 1930, July 1932, November 1932, March 1933. The final one leads to y33_end (n_elections 7). Scripted unemployment each January 1929 to 1932 (10, 15, 22, 30 percent), which also shrinks the employed workers.
- Nazi rise: the class-by-party tables are shifted by the crash, the Young Plan referendum, the dissolution, the bank crisis, Harzburg, the 1932 presidential vote, Papen's SA amnesty, the autumn pause (a fall) and the chancellorship (a large rise). A passive game gives about NSDAP 20 (1930), 35 (July 1932), 31 (November 1932) and 42 (March 1933). Targets were 18.3, 37.3, 33.1 and 43.9.
- Events: y28_sixth (Third Period), y28_cruiser, y28_wittorf (if Moscow balance is 25 or more, resisting costs trust and patience; below 25, Thälmann stays out), y28_right (KPO), y29_blutmai (RFB banned, strength halved), y29_crash, y29_young, y30_muller, y30_dissolution, y30_programme, y31_banks, y31_prussia (comply: trust up, unity down; refuse: patience points) and result, y31_harzburg, y32_president, y32_antifa, y32_papen, y32_coup, y32_schleicher (BVG strike), y33_hitler, y33_fire, y33_end.
- Third Period: while the line is third_period, each point of joint work with the SPD costs 2 patience points (post_event).
- Anti-fascist front (0 to 100, shown on the status page): 4 per unity point (max 40), RFB strength /10 (max 25, halved while banned), 10 per level of Anti-Fascist Action openness, 5 per Anti-Fascist Action action (max 15). The Mass Work card "Anti-Fascist Action" appears once the front is opened in May 1932.
- Thresholds: the Prussian general strike holds at front 55 and saves Prussia. The 30 January general strike stops Hitler at front 75 (65 if Prussia was saved). Armed resistance needs RFB strength 100 and starts a four-month war (our strength = front + 20, +25 if Prussia was saved; the state starts at 100 + half the Nazi vote, +6 a month). Otherwise the party goes underground after the fire and the March election.
- Endings added: strike_stops_hitler, antinazi_victory, antinazi_long_war, antinazi_defeat, underground.
- To verify: the 1.2 million signatures for the cruiser referendum, the Altona toll (18), the Programme Declaration date (24 August 1930), the Antifaschistische Aktion dates, the BVG strike dates (3 to 7 November), Thälmann's arrest (3 March 1933).

## M10 Release prep (release/v0.1)
- Pruned 146 unused SPD-era state variables from root.scene.dry and the dead timers from Q.timers.
- Library: added a "what happened in our history, 1924 to 1933" page, the Third Period and front rules, and the later factions.
- Known gaps for after v0.1: KPD-specific art (mostly base-game images), dollar-rate approximations, the unverified facts listed above, working title and author line.
- Passive playthrough (the headless bot) ends in the underground ending with the Nazis at about 48 percent; a diligent playthrough can reach the three October endings, the January general strike and the antinazi war endings.

## Scope change: medium difficulty and 1923 only (feat/medium-1923-scope)
- Only Medium can be started; Easy, Hard, Historical and Custom are greyed out as "Not implemented yet". Medium: hand of 4, 3 resources, dues 2, no annual income. Cards can always be put back without using up the month (the "Return card" option); discarding in the sense of removing a card is disabled, with exceptions to be defined later.
- Plan progress and the whole line-change system (extraordinary conference card, contest event, Frankfurt/ECCI forced changes) are removed. The Right keeps the line.
- The patience ladder is replaced by trust: +1 a month when the party line is the one Moscow favours, -1 otherwise, plus events and cards. 50 or more opens government options (Saxony now needs it). Tiers: under 50 a letter, under 40 the subsidy is cut (and returns on recovery), under 30 an open letter (holder dissent +15, workers -2, campaigning -10 percent), under 15 emissaries (favoured faction +8, holder -8 strength and +10 dissent, campaigning -20 percent). Event: moscow_displeasure.
- Chemnitz: the rising is greyed out. A general strike now holds at readiness 45 with unity part 10 (2 joint actions). Calling off is as punishing as it was: trust -10, Left and Right dissent +10, workers -3, Hamburg always fights alone (workers -4, unemployed -2, RFB -50, trust -5), then the ban and the blame.
- The Leipzig congress and the Ruhr occupation were set for January, the month the game starts, so they never fired. They now fire at the first month change (February).
- Everything after December 1923 is moved out of the build to /shelved (events 1924 to 1933, elections, the government deck, Anti-Fascist Action, the later endings). The game ends in January 1924 with "End of the first act". The shelved files compile again by moving them back to source/scenes, but they still need adapting to the trust model.

## Opening screen
The title screen has Start game, Credits and Achievements only. The election simulation and custom difficulty are removed (election_algorithm and the full credits are kept in /shelved). The opening screens (title, introduction, credits) hide the sidebar and centre the panel; the header shows only the title, centred above the Library / Save / Options links. Credits name only the base game and its author.

## Dev build changes (28 October)
- Save import and export removed from the Save/Load screen.
- Trust no longer blocks anything. Entering the Saxon cabinet with trust under 50 costs 15 trust (Moscow is furious); with 50 or more it gains 5. Listening to Moscow still raises trust.
- The October readiness mechanic is gone. The Chemnitz event stays, without numbers. The general strike holds if at least two joint actions with the SPD left were taken (y23_unity >= 2). Interim rule, to be revisited.
- Dev site: a "Dev" sidebar tab shows the numbers behind the game, and every choice shows its numeric effects after " · dev: " in its subtitle. `python3 tools/dev_effects.py` refreshes those suffixes after any edit, and `--strip` removes them for a release.

## Three factions (28 October)
The Moscow apparatus is no longer a faction. The party has Right (45 strength, 5 dissent), Centre (25, 5) and Left (30, 20). Moscow acts through trust, the balance of power and the penalty tiers. A letter or a cut subsidy now strengthens the faction Moscow favours. Stalin alone favours the Centre. Radek counts as Right and Eberlein as Centre. Shelved content still mentions the apparatus and must be adapted when it returns.

## Head of party and faction advisers (28 October, replaces the seats model)
- **Head of the Party** card (leader of the faction holding the line; Brandler for the Right, the only line in 1923): 4 choices, one use every 3 months (`head_timer`), and while the Right leads the campaign multiplier is ×1.1 (`head_mult`). Left (Fischer) and Centre (Meyer) heads are not written yet, because the line cannot change in 1923.
- **One adviser card per faction** (Right, Centre, Left), shown while the faction has strength. Each has 4 options, one per person, each with a 3-month timer: Right Thalheimer, Walcher, Radek, Heckert; Centre Meyer, Zetkin, Pieck, Eberlein; Left Fischer, Maslow, Thälmann, Scholem. Heckert and Scholem are new.
- Neglect: each use stamps `adv_<faction>_last`; a faction with strength 20 or more that has not been consulted for 6 months gains 1 dissent a month. Seats, `n_advisors` and the Reshape the Leadership card are gone.
- Demands now come from any faction with dissent 30 or more (event `kpd_demand`): grant (dissent −15, faction effect) or refuse (dissent +5, cooldown 4). Refusing at 50 or more makes the faction's spokesman (Thalheimer, Meyer or Fischer) walk out: his option is closed for 6 months and the faction loses 5 strength.
- Five cards keep an option from a named person (Defence units, Strikes, Moscow delegation, Campaigning, Fundraising); the `<name>_advisor` flags are always 1.
- Party names (KPD, SPD, USPD, DNVP, DVP, DDP, NSDAP, BVP, Zentrum, Centre Party) are coloured in all text by `colourParties` in game.js, with light and dark variants in game.css.
- Portraits (28 October): the head of the party's portrait sits alone in a banded strip at the top of the hand page; the card itself is the click target (`arrangeLeadership` in game.js). Faction adviser cards have a frame and caption in a muted faction colour (Right orange, Centre grey, Left red). Card images are expected at `img/portraits/<name>`; brandler.png is in the repo, the others (thalheimer, meyer, fischer) are not, and a missing image shows a frame with initials.
- The Party Line card is shelved (`shelved/kpd_party_line.scene.dry`), since the line cannot change in 1923.
- Shuffling the leadership is proposed for congresses only; there is no congress in 1923, so it is not built.
- Colours (28 October): parties SPD red, KPD dark red, Zentrum black, BVP baby blue, DDP light yellow, DVP dark yellow, DNVP blue, NSDAP brown (lighter variants in dark mode). Factions Left red, Centre grey, Right orange, also on the faction words in the Politics tab. Adviser cards appear in the order Left, Centre, Right with the spokesman's full name as caption and no faction label. The head portrait is a larger plain black frame with the full name underneath.
- DDP-mod styling (28 October): party colours taken from the DDP mod (KPD #700000, SPD #c00000, Zentrum #000, BVP #95ccc7, DDP #D3C24D, DVP #D5AC27, DNVP #3E88B3, NSDAP #7A3C00; no USPD, it does not exist in 1923). The head of the party is shown as the DDP mod's leader card: "Kommunistische Partei Deutschlands (KPD)", the portrait, name and role "Parteivorsitzender". The portrait card is clickable (own handler, because the engine's click handler only covers cards inside the pinned list).
- Fixes (28 October): the game now starts by running post_event, so the Ruhr event is the first screen instead of appearing after the first button press (the January intro paragraph under the hand is gone; the opening screen carries that text). Zentrum's "Z" in the sidebar is coloured black. game.css and game.js are loaded with a `?v=` query in index.html: bump it whenever either changes, or browsers keep showing old styling against new scripts.
- January in weeks (28 October): `jan_week` runs 1 to 4; each action moves one week and the monthly tick (income, drift, timers) happens after week 4, then `jan_week` is 0. Events: Essen conference (week 1, new, 6-7 Jan; verified: Fondation Gabriel Peri (appeal of 7 January 1923, seven communist parties and red unions, addressed to workers of France, Belgium, England, Germany, Czechoslovakia and Italy), Revolutionary History vol. 5 no. 2, Rosmer's Moscou sous Lenine (French delegates), Carr via Die Rote Fahne of 9 January 1923; the options are our own invention), the Ruhr occupation (week 2, now mentions the 9 January default), the Leipzig congress (week 4, moved from February), the Nazis meet in Munich (week 4, new, 27-28 Jan). No income arrives during weeks 1 to 3, so the starting 3 resources must last the month.

## Lenin's Testament chain (28 October)
Events `y23_testament` (April; the notes and the decision are one screen) and `y23_testament_plenum` (4 July, the date of a real plenum; the only follow-up and the only confirmation screen). The plenum fires only if the notes were passed on or published; declining or holding them back ends the chain with no plenum and leaves Moscow's balance alone. The June retaliation (trust −8/−8/−10, Centre +4) is folded into the plenum. Left path: balance −8 now (the leader must not change before the plenum), −10 at the plenum, floor of −55, drift becomes −0.3, Stalin removed (`y23_stalin_removed`). Right path: −6 now, −8 at the plenum, plenum floor of +5, drift 0, Stalin removed, and Moscow leads as "Bukharin-Rykov" (line `nep_united_front`, favours the Right) while the balance is under 25 and above −30. Publishing: −8 now, −5 at the plenum, floor −20, trust −20/−10/−10, Stalin is cornered (`y23_stalin_cornered`) but stays. Visible conditions only, no dice. The September "Moscow decides" and the December post-mortem have paragraphs for each outcome.
Unverified, check before release: Zetkin as the channel (our invention; she knew Lenin's circle, not confirmed to have known of the notes); the wording of the paraphrased notes (Lenin's Collected Works vol. 36, Letter to the Congress of 23-26 Dec 1922 with the 4 Jan 1923 postscript, and the Georgian notes of 30-31 Dec 1922); that the notes were with Krupskaya in April 1923; the July plenum (the real plenum was 4 July 1923; the removal of Stalin there is invented); that Bukharin, Rykov and Tomsky would have used them (our reading); the role of Radek.

Verification pass (28 October, against marxists.org Collected Works texts, Broué, Wikipedia): confirmed dates (23-26 Dec 1922, postscript 4 Jan 1923), the wording on Stalin, Trotsky, Bukharin ("with great reserve"), Pyatakov, the 50-100 enlargement, and Lenin's 5 Mar 1923 letter to Stalin (demands apology or severance, copies to Kamenev and Zinoviev). Corrected: Lenin said the October 1917 stand was no accident but could not be used against them personally. Still unverified: the Georgian CC resignation date and the name of the man Ordzhonikidze struck (Wikipedia gives November 1922, unnamed). The May 1924 handling is told two ways: Broué has a Central Committee session of 22 May with old Bolsheviks voting about 30 to 10 to share it only with heads of delegations; Wikipedia has Kamenev reading it to the Council of Elders and then to each delegation separately. A Stalin resignation offer is widely reported but appears in neither source. Authenticity is accepted by most historians (Carr, Deutscher, Volkogonov, Khlevniuk) and doubted by Kotkin, Sakharov and Zhukov.

## Year 1 rebuild: Lands, front page, votes (29 October)
Follows the 1923 to 1933 design doc (https://claude.ai/artifact/5ECdBo23oGZHyHN5MZDHJg). Rules live in `out/html/kpd.js` (window.KPD), drawing in `out/html/kpd_ui.js` (KPD.UI). Scenes leave `<div class="kpd-insert" data-insert="...">` placeholders that the UI fills after every screen. `./build.sh` builds with a timeout (dendrynexus hangs on parse errors).

- **Turns**: one card or one action is a turn. January 1923 has four weekly turns, the rest of 1923 two half-month turns (`Q.sub`), later years monthly (`KPD.turnsIn`). Month effects run when the last turn of a month ends.
- **The Lands** (pinned card): a map shows only the Lands where the party can act now. Prussia is one Land with three party districts (Berlin, Rhine and Ruhr, Central Germany); Saxony, Thuringia, Hamburg and Bavaria are one district each. Each district has organisation (shown as a number) and pressure from the state (shown as words). Actions: organise, struggle, joint action with SPD workers (costs 1 resource), Hundreds, price control committees (March to September), underground when banned or under heavy pressure; Bavaria has May Day in Munich (April) and the border watch (October and November). One action per district per turn. Scenes are generated by `python3 tools/gen_lands.py`; rerun it after changing actions.
- **Dues**: every 150 points of organisation across the districts pay one resource a month.
- **Workers' mood** is hidden and scripted for 1923 (`KPD.MOOD_1923`); it multiplies organising.
- **Moscow's directives**: three in 1923 (joint actions by June, Hundreds in three districts by September, Saxony at 60 with two units by October). Met: trust +6, missed: trust −6, shown in a "Moscow's verdict" event.
- **The German October**: from August the Main tab shows three conditions: Saxony strong (organisation 60), a broad united front (6 actions), and one of Central Germany, Thuringia or Berlin strong (60). The Chemnitz general strike holds only if all three are met (replaces `y23_unity >= 2`). Chemnitz now falls in late October. The rising stays greyed out.
- **Votes**: factory council elections (March), Zeigner's election in the Saxon Landtag (March; refusing means no Saxon workers' government in October), the Enabling Act (October), Stresemann's confidence vote (November). Shown as hemicycles with the count.
- **Party paper**: Die Rote Fahne in its own column on the right, as in the DDP mod: the last event is the headline, earlier headlines with their dates below, and news from abroad (`KPD.WORLD_1923`).
- **Sidebar tabs** (Maarten, 29 October: keep them close to the base game): Main (status, factions, Moscow, directive, October conditions, the class), Politics (government, Reichstag, every party's stance and relation to us, the Lands), Defense, Polls (all parties, by class), Dev. Plain lines with words, as in the base game; no bars or tick symbols.
- **Relations**: `<party>_relation` for SPD, Z, BVP, DDP, DVP, DNVP and the völkisch right, shown as words on the base game's scale. United front actions, Zeigner, the Enabling Act and the Saxon cabinet move them.
- **Card art**: public-domain images only (Maarten's rule), credited in credits_images.txt, plus four cards drawn for the mod (The Lands, The Hundreds, Reichstag, The Line). The Brandler portrait has no recorded source yet.
- `tools/dev_effects.py` no longer doubles the "dev:" numbers on choices that had no subtitle of their own.

Playtests (headless, scripted): a player who builds Saxony and Central Germany and makes joint actions gets the strike to hold; a player who only plays cards fails at Chemnitz. Both reach the end of the act in January 1924.

To verify:
- Reichstag group sizes in 1923 (SPD 173, KPD 15, DVFP 3 and the rest are estimates).
- Buck's fall in January 1923 with KPD votes, and Zeigner's election on 21 March with 50 votes.
- The Enabling Act vote of 13 October 1923 and the confidence vote of 23 November 1923 (in game the counts use all seats, so they differ from the real tallies).
- Factory council election timing in 1923.
- District starting organisation values are design numbers, not membership figures.

## Words instead of numbers (29 October, Maarten)
The player sees words, not numbers; numbers stay in the Dev tab and in the " · dev:" suffixes. Scales: organisation scattered <15, weak <30, thin <45, solid <60, strong <75, a fortress; united front not yet begun, first steps (1), growing (3), broad (6), a mass movement (9); Hundreds none, one unit, several units (2), many units (4); Moscow's trust hostile <15, angry <30, displeased <40, doubtful <50, satisfied <60, confident <75, full confidence. Action thresholds follow the words (struggle and Hundreds need thin, the united front weak, price control solid). Every script and stylesheet in index.html carries a version tag (?v=...), core.js included; bump it on every release so browsers do not mix old and new files. `KPD.migrate` repairs saves from before the rebuild.

## Sidebar tabs (Main, Party, Politics, Defense, Polls)

Main shows status, government, the Reichstag as a list from left to right, and Economy (not built yet). Party holds the factions, the party organs, Moscow, the German October and the class. Names with more to say open a hover card (`KPD.UI.hoverHTML`); the cards for people show initials until we have fully free portraits.

Facts in the hover cards and tabs that still need checking:
- Strength and arms of the leagues (SA, Oberland, Reichsflagge, Stahlhelm, Black Reichswehr, Wiking) are estimates in words, by month.
- Factions in 1923: only Right (Brandler's majority, with Meyer, Zetkin, Pieck, Eberlein) and Left. The Centre ("Mittelgruppe") formed only after October 1923; it is dormant in code (kf_centre_on, adv_centre) until an event adds it.
- Organs of 1923: Zentrale with a political bureau, Zentralausschuss, M-Apparat, Radek as Comintern representative.
- Chairman: Brandler all of 1923 (checked: chairman Feb-Aug 1921, Meyer Aug 1921-Aug 1922, Brandler again from Aug 1922 to Apr 1924; Wikipedia). Sidebar and chairman card share `KPD.chair(Q)`.
- Zentrale (checked): Jena (Aug 1921) elected 14, none from the Left. Leipzig (Jan 1923) enlarged it to 21: 14 re-elected (Böttcher, Brandler, Eberlein, Frölich, Heckert, Hoernle, Koenen, Pieck, Remmele, Schmidt, Stoecker, Thalheimer, Walcher, Zetkin), new Becker, Schumann, Ulbricht, Kleine (EKKI), and three moderate leftists on Radek's proposal (Ewert, Lindau, Pfeiffer), none from the Fischer-Maslow group. The Moscow compromise (conference 27 Apr to 4 May 1923) gave the opposition four seats; the Zentralausschuss elected Fischer, Geschke, König and Thälmann on 17 May. Source: H. Jentsch, "Die KPD 1919 bis 1924", Z. Zeitschrift marxistische Erneuerung; Wikipedia member lists. The sidebar shows members and Left seats only.
- Proletarian Hundreds: Prussian ban by Severing in May 1923 (checked, de.wikipedia; no exact day), Saxon ban 13 October 1923 by General Müller (checked, LeMO). Members 50,000-60,000.
- Zentralausschuss: 36 members (Jena) and 38 (Leipzig) per en and de Wikipedia, but the Leipzig list names only 37, so the 38th is unconfirmed. It had no formal factions. Six known Left leaders sit on both lists (Fischer, Maslow, Thälmann, Urbahns, Geschke, Eppstein); the Left districts (Berlin, Hamburg, Ruhr) sent more whose alignment is not documented. The game uses an estimated Left share of about a third (as among the Leipzig delegates: 12 of 36, 13 of 38) and shows it in words. Alternative Leipzig choices (16 or 20 of 38) are invented. Rule: supporting Zeigner (either option) and calling off the Chemnitz strike need its backing; Left +3 dissent at about a third, +6 as a strong minority (40%+), blocked if the Left holds the majority.
- BVP leader corrected to Karl Speck, party president 1918-1929 (checked). Cabinet parties checked against LeMO (Cuno: Z, DDP, DVP, BVP; Stresemann I and II: DVP, SPD, Z, DDP, SPD out in November; Marx I: Z, DDP, DVP, BVP).
- Checked: communist finance minister in Saxony in October 1923 (LeMO; Böttcher); working-time decree 23 December 1923 (LeMO); Fischer ordered into the Zentrale by the Comintern in April 1923, elected by the Zentralausschuss on 17 May.
- Still estimates: 1923 Reichstag group sizes (the 1920 result is checked; the shifts after the USPD split and reunion are not), the alignment of most Zentralausschuss members, league strengths in words.
- Hover texts are written as of the current date: birth years only, and events appear only once they have happened.
