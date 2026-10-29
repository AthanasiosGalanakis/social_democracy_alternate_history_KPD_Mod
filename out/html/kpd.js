// KPD: shared rules. The scenes call these through window.KPD with the
// quality object Q, so the logic lives in one place instead of being spread
// over scene files. Nothing here is random: every outcome follows from the
// numbers the player can see (or, for hidden modifiers, read as words).
(function() {
  var KPD = window.KPD = {};

  KPD.MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
                'August', 'September', 'October', 'November', 'December'];

  // ---- The clock -----------------------------------------------------------
  // A turn is one card. The length of a turn follows history: January 1923
  // runs in weeks, the rest of 1923 in half-months, quiet years in months.
  // Later years add their crisis months here.
  KPD.turnsIn = function(year, month) {
    if (year == 1923 && month == 1) { return 4; }
    if (year == 1923) { return 2; }
    return 1;
  };

  KPD.shortDate = function(Q) {
    var m = KPD.MONTHS[Q.month - 1].slice(0, 3), n = KPD.turnsIn(Q.year, Q.month);
    if (n == 4) { return m + ', week ' + Q.sub; }
    if (n == 2) { return (Q.sub == 1 ? 'early ' : 'late ') + m; }
    return m + ' ' + Q.year;
  };
  KPD.dateLabel = function(Q) {
    var n = KPD.turnsIn(Q.year, Q.month), m = KPD.MONTHS[Q.month - 1];
    if (n == 4) { return 'Week ' + Q.sub + ' of ' + m + ' ' + Q.year; }
    if (n == 2) { return (Q.sub == 1 ? 'Early ' : 'Late ') + m + ' ' + Q.year; }
    return m + ' ' + Q.year;
  };

  // ---- A new game ----------------------------------------------------------
  KPD.newGame = function(Q) {
    Q.started = 1;
    Q.kpd_mode = 1;
    // time counts months from January 1923 (= 1); sub is the turn within the month
    Q.time = 1; Q.year = 1923; Q.month = 1; Q.sub = 1; Q.turn = 1;
    Q.jan_week = 1;
    Q.month_actions = 0;
    // the act ends when time reaches act_end (January 1924 = 13)
    Q.act_end = 13;

    // difficulty: only medium is playable (set again by the start scene)
    Q.difficulty = -1; Q.historical_mode = 0; Q.old_demographics = 0;
    Q.annual_income = 0; Q.discard_disabled = 1; Q.hand_size = 4;

    // party resources and dues
    Q.resources = 3; Q.dues = 2;

    // KPD factions. party_line is the faction whose line runs the party; Brandler's Right holds it in 1923.
    Q.kpd_factions = ['right', 'centre', 'left'];
    Q.party_line = 'right';
    Q.kf_right_strength = 45; Q.kf_right_dissent = 5;
    Q.kf_left_strength = 30; Q.kf_left_dissent = 20;
    Q.kf_centre_strength = 25; Q.kf_centre_dissent = 5;
    Q.kf_dissent = 0.095; Q.kf_dissent_percent = 9.5;
    Q.party_line_months = 0; Q.zigzag = 0; Q.holder_dissent = 5;
    Q.campaign_mult = 0.905; Q.head_mult = 1;
    Q.line_action_timer = 0;
    // factions that appear later (set by events)
    Q.kf_conciliators_strength = 0; Q.kf_conciliators_dissent = 0;

    // Moscow: who leads, what line they expect, how far they trust us. Visible and deterministic.
    Q.moscow_leader = 'Zinoviev-Kamenev-Stalin';
    Q.comintern_line = 'workers_government';
    Q.comintern_trust = 60;
    Q.soviet_subsidy = 1; Q.subsidy_granted = 1;
    Q.moscow_tier = 0; Q.moscow_tier_pending = 0;
    // balance between the Kremlin groups: -100 (Left Opposition) to +100 (Stalin); drifts towards Stalin
    Q.moscow_balance = 0; Q.moscow_balance_r = 0; Q.moscow_drift = 0.8;
    Q.moscow_change_pending = 0; Q.moscow_action_timer = 0;
    Q.moscow_favored = 'right';

    // 1923 campaign state
    Q.hyper_script = 1; Q.usd_rate = 'about 18,000';
    Q.kpd_banned = 0; Q.kpd_ban_end = 0;
    Q.kpd_in_government = 0; Q.kpd_tolerating = 0;
    Q.state_saxony = 0; Q.state_thuringia = 0; Q.state_prussia = 0; Q.state_intervention = 0;
    Q.gv_line_ok_now = 1;
    Q.y23_unity = 0; Q.y23_hundreds = 0; Q.y23_strikes = 0;
    Q.y23_saxony = 0; Q.y23_thuringia = 0;
    Q.y23_outcome = 'none'; Q.y23_hamburg_pending = 0; Q.y23_failed = 0;
    Q.saxony_survives = 0;
    Q.civil_war = 0; Q.cw_month = 0; Q.cw_last_time = -1; Q.cw_red = 0; Q.cw_white = 0; Q.cw_context = 'october';
    Q.kpd_ending = 'none';
    // Lenin's Testament chain (April to August 1923)
    Q.test_stage = 0; Q.testament_path = 0; Q.y23_stalin_cornered = 0; Q.y23_stalin_removed = 0;
    ['essen', 'ruhr', 'leipzig', 'nsdap_munich', 'prices', 'ruhr_strike', 'schlageter', 'antifa', 'cuno', 'moscow',
     'emergency', 'saxony', 'thuringia', 'chemnitz', 'exec', 'hamburg', 'beerhall', 'rentenmark', 'ban', 'blame',
     'cw_start', 'testament_plenum', 'councils', 'zeigner', 'enabling', 'confidence'].forEach(function(f) { Q['y23_' + f + '_done'] = 0; });

    // forces. The Proletarian Hundreds in 1923 (the variable keeps its later name, the RFB, founded in 1924).
    Q.rfb_strength = 130; Q.rfb_militancy = 0.5; Q.rfb_banned = 0;
    Q.reichswehr_strength = 100;

    // opinion (used by a few events)
    Q.nationalism = 60; Q.socialism = 40; Q.pro_republic = 59;

    // the electorate by class (shares) and each class's vote (weights, normalised every turn).
    // Tuned so that a game without campaigns gives roughly the May 1924 result. Estimates, not survey data.
    Q.workers = 48; Q.old_middle = 13; Q.new_middle = 14; Q.rural = 25; Q.unemployed = 8.6; Q.catholics = 30;
    Q.inflation = 3; Q.economic_growth = 0;
    Q.classes = ['workers', 'old_middle', 'new_middle', 'rural', 'unemployed', 'catholics'];
    Q.parties = ['spd', 'kpd', 'z', 'ddp', 'dvp', 'dnvp', 'nsdap', 'other'];
    var support = {
      workers:    {spd: 46, kpd: 28, z: 5,  ddp: 0,  dvp: 0,  dnvp: 7,  nsdap: 4,  other: 10},
      old_middle: {spd: 4,  kpd: 0,  z: 5,  ddp: 12, dvp: 24, dnvp: 32, nsdap: 16, other: 7},
      new_middle: {spd: 7,  kpd: 2,  z: 10, ddp: 28, dvp: 24, dnvp: 14, nsdap: 8,  other: 7},
      rural:      {spd: 7,  kpd: 0,  z: 5,  ddp: 5,  dvp: 13, dnvp: 52, nsdap: 10, other: 8},
      unemployed: {spd: 24, kpd: 52, z: 1,  ddp: 0,  dvp: 0,  dnvp: 7,  nsdap: 7,  other: 9},
      catholics:  {spd: 12, kpd: 2,  z: 56, ddp: 0,  dvp: 6,  dnvp: 7,  nsdap: 1,  other: 16}
    };
    for (var c in support) {
      for (var p in support[c]) { Q[c + '_' + p] = support[c][p]; }
    }

    // The Reichstag elected in June 1920, by group as of January 1923: the USPD rump rejoined the SPD in
    // September 1922, and three DNVP deputies left to found the völkisch DVFP in December 1922.
    // Approximate seats (459 in all), still to be checked against a seat list.
    Q.rt_seats = {spd: 173, kpd: 15, z: 64, bvp: 21, ddp: 39, dvp: 65, dnvp: 68, nsdap: 3, other: 11};
    KPD.reichstagShares(Q);
    Q.ddp_name = 'DDP';
    Q.election_records = []; Q.party_support_records = []; Q.economic_records = [];
    Q.president = 'Ebert'; Q.chancellor = 'Cuno'; Q.chancellor_party = 'I';
    Q.spd_in_government = 0;
    Q.next_election_year = 1924; Q.next_election_month = 5; Q.next_election_time = 17; Q.in_election = 1;

    // advisers: the head of the party plus one adviser card per faction (four people each)
    ['brandler', 'thalheimer', 'walcher', 'heckert', 'fischer', 'maslow', 'thaelmann', 'scholem',
     'meyer', 'zetkin', 'pieck', 'radek', 'eberlein'].forEach(function(a) { Q[a + '_advisor'] = 1; Q[a + '_timer'] = 0; });
    Q.head_timer = 0;
    Q.demand_f = 'none';
    Q.demand_right_timer = 0; Q.demand_centre_timer = 0; Q.demand_left_timer = 0;
    Q.adv_right_last = 0; Q.adv_centre_last = 0; Q.adv_left_last = 0;
    Q.fundraising_timer = 0;
    // every card cooldown, in months
    Q.timers = ['head', 'brandler', 'thalheimer', 'walcher', 'radek', 'heckert', 'pieck', 'meyer', 'zetkin', 'eberlein',
                'fischer', 'maslow', 'thaelmann', 'scholem', 'demand_right', 'demand_centre', 'demand_left', 'fundraising',
                'line_action', 'moscow_action', 'mass_strikes', 'mass_unemployed', 'mass_relief', 'mass_press',
                'mass_defence', 'mass_parliament', 'mass_underground'];
    Q.timers.forEach(function(t) { if (Q[t + '_timer'] === undefined) { Q[t + '_timer'] = 0; } });

    KPD.newDistricts(Q);
    KPD.newDirectives(Q);
    // how each party stands toward us (words in the Politics tab, same scale as the base game)
    Q.spd_relation = 25; Q.z_relation = 10; Q.bvp_relation = 3; Q.ddp_relation = 8; Q.dvp_relation = 3;
    Q.dnvp_relation = 0; Q.nsdap_relation = 0;
    Q.zeigner = 0; Q.zeigner_kpd = ''; Q.conf_kpd = ''; Q.councils_won = 0;
    Q.news_head = ''; Q.news_sub = ''; Q.news_log = [];
    Q.date_label = KPD.dateLabel(Q);
    KPD.refresh(Q);
  };

  // Reichstag shares in percent from the seats, in the variables the status page and elections use.
  KPD.reichstagShares = function(Q) {
    var s = Q.rt_seats, total = 0;
    for (var p in s) { total += s[p]; }
    Q.rt_total = total;
    Q.spd_r = Math.round(100 * s.spd / total);
    Q.kpd_r = Math.round(100 * s.kpd / total);
    Q.z_r = Math.round(100 * (s.z + s.bvp) / total);
    Q.ddp_r = Math.round(100 * s.ddp / total);
    Q.dvp_r = Math.round(100 * s.dvp / total);
    Q.dnvp_r = Math.round(100 * s.dnvp / total);
    Q.nsdap_r = Math.round(100 * s.nsdap / total);
    Q.other_r = Math.round(100 * s.other / total);
  };

  // ---- Every turn ----------------------------------------------------------
  // Party support: each class's vote normalised, then weighted by the size of the class.
  KPD.recomputeSupport = function(Q) {
    var c, p;
    for (c of Q.classes) {
      var votes = 0;
      for (p of Q.parties) {
        if (Q[c + '_' + p] < 0) { Q[c + '_' + p] = 0; }
        votes += Q[c + '_' + p];
      }
      for (p of Q.parties) {
        Q[c + '_' + p + '_normalized'] = 100 * Q[c + '_' + p] / votes;
        Q[c + '_' + p + '_display'] = Math.round(100 * Q[c + '_' + p] / votes);
      }
    }
    var total = 0;
    for (p of Q.parties) {
      var sup = 0;
      for (c of Q.classes) { sup += Q[c] * Q[c + '_' + p + '_normalized']; }
      Q[p + '_support'] = sup;
      total += sup;
    }
    for (p of Q.parties) {
      Q[p + '_normalized'] = Q[p + '_support'] / total;
      Q[p + '_votes'] = Math.round(Q[p + '_normalized'] * 100);
      Q[p + '_votes_display'] = Q[p + '_votes'];
    }
  };

  // Factions: normalise strength, strength-weighted dissent, and the campaign multiplier m that scales
  // every gain in support: (1 - dissent) x zigzag x ban x Moscow's displeasure x the head of the party.
  KPD.recomputeFactions = function(Q) {
    var f, total = 0;
    for (f of Q.kpd_factions) {
      Q['kf_' + f + '_strength'] = Math.max(0, Q['kf_' + f + '_strength']);
      Q['kf_' + f + '_dissent'] = Math.max(0, Math.min(99, Q['kf_' + f + '_dissent']));
      total += Q['kf_' + f + '_strength'];
    }
    var weighted = 0;
    for (f of Q.kpd_factions) {
      if (total > 0) { Q['kf_' + f + '_strength'] = 100 * Q['kf_' + f + '_strength'] / total; }
      weighted += Q['kf_' + f + '_strength'] * Q['kf_' + f + '_dissent'];
    }
    Q.kf_dissent_percent = total > 0 ? weighted / 100 : 0;
    Q.kf_dissent = Math.min(0.95, Q.kf_dissent_percent / 100);
    Q.holder_dissent = Q['kf_' + Q.party_line + '_dissent'];
    var m = (1 - Q.kf_dissent) * (1 - 0.04 * Q.zigzag);
    if (Q.kpd_banned) { m = m / 2; }
    if (Q.moscow_tier >= 4) { m = m * 0.8; } else if (Q.moscow_tier >= 3) { m = m * 0.9; }
    Q.head_mult = (Q.party_line == 'right') ? 1.1 : 1;
    Q.campaign_mult = m * Q.head_mult;
  };

  // After every event and card: recompute, then move the clock if an action was taken.
  KPD.postEvent = function(Q) {
    KPD.migrate(Q);
    Q.comintern_trust = Math.max(0, Math.min(100, Q.comintern_trust));
    Q.pro_republic = Math.max(0, Math.min(99, Math.round(Q.pro_republic)));
    Q.unemployed = Math.max(1, Q.unemployed);
    KPD.recomputeSupport(Q);
    KPD.recomputeFactions(Q);
    if (Q.month_actions >= 1) {
      Q.month_actions = 0;
      Q.turn = (Q.turn || 1) + 1;
      Q.sub = (Q.sub || 1) + 1;
      KPD.turnDistricts(Q);
      if (Q.sub > KPD.turnsIn(Q.year, Q.month)) {
        Q.sub = 1;
        KPD.monthly(Q);
      }
    }
    Q.jan_week = KPD.turnsIn(Q.year, Q.month) == 4 ? Q.sub : 0;
    Q.date_label = KPD.dateLabel(Q);
    KPD.refresh(Q);
  };

  // ---- Every month ---------------------------------------------------------
  KPD.monthly = function(Q) {
    Q.time += 1;
    Q.month += 1;
    if (Q.month >= 13) { Q.month = 1; Q.year += 1; }
    Q.party_line_months += 1;
    if (Q.kpd_banned && Q.time >= Q.kpd_ban_end) { Q.kpd_banned = 0; }
    if (Q.zigzag > 0 && Q.time % 6 == 0) { Q.zigzag -= 1; }
    KPD.monthlyMoscow(Q);
    // Land governments with KPD ministers pay a resource a quarter and cost the Left patience;
    // the Reich removes the Saxon and Thuringian cabinets if the armed units grow past 250.
    if (Q.time % 3 == 0) {
      var n = (Q.state_saxony == 2 ? 1 : 0) + (Q.state_thuringia == 2 ? 1 : 0) + (Q.state_prussia == 2 ? 1 : 0);
      Q.resources += n;
      Q.kf_left_dissent += n;
    }
    if (Q.rfb_strength > 250 && (Q.state_saxony == 2 || Q.state_thuringia == 2)) {
      Q.state_saxony = 0; Q.state_thuringia = 0;
      Q.kf_right_dissent += 5; Q.workers_kpd -= 2; Q.rfb_strength = 200; Q.state_intervention = 1;
    }
    // cooldowns
    for (var t of Q.timers) {
      if (Q[t + '_timer'] > 0) { Q[t + '_timer'] -= 1; }
    }
    // a strong faction that has not been consulted for 6 months grows angry
    for (var f of Q.kpd_factions) {
      if (Q['kf_' + f + '_strength'] >= 20 && Q.time - Q['adv_' + f + '_last'] >= 6) {
        Q['kf_' + f + '_dissent'] += 1;
      }
    }
    // a faction whose dissent reaches 30 makes a demand
    Q.demand_f = 'none';
    for (f of ['left', 'right', 'centre']) {
      if (Q.demand_f == 'none' && Q['kf_' + f + '_strength'] > 0 && Q['kf_' + f + '_dissent'] >= 30 && Q['demand_' + f + '_timer'] <= 0) {
        Q.demand_f = f;
      }
    }
    // records for the charts
    var rec = {date: new Date(Q.year, Q.month - 1)};
    for (var p of Q.parties) { rec[p] = Q[p + '_normalized'] * 100; }
    Q.party_support_records.push(rec);
    KPD.monthlyEconomy(Q);
    KPD.monthlyDistricts(Q);
    KPD.monthlyDirectives(Q);
    Q.economic_records.push({date: new Date(Q.year, Q.month - 1), inflation: Q.inflation, unemployment: Q.unemployed});
  };

  // Moscow: the balance drifts towards Stalin; visible thresholds decide who leads (no dice).
  KPD.monthlyMoscow = function(Q) {
    Q.moscow_balance = Math.max(-100, Math.min(100, Q.moscow_balance + Q.moscow_drift));
    Q.moscow_balance_r = Math.round(Q.moscow_balance);
    var leader, line, fav;
    if (Q.moscow_balance <= -30) { leader = 'Trotsky-Radek'; line = 'world_revolution'; fav = 'left'; }
    else if (Q.moscow_balance < 25) { leader = 'Zinoviev-Kamenev-Stalin'; line = 'workers_government'; fav = 'right'; }
    else if (Q.moscow_balance < 60) { leader = 'Stalin-Bukharin'; line = 'socialism_in_one_country'; fav = 'centre'; }
    else { leader = 'Stalin'; line = 'third_period'; fav = 'centre'; }
    // where the Right Opposition carried the plenum on Lenin's Testament, Bukharin and Rykov lead instead of the troika
    if (Q.testament_path == 2 && Q.y23_stalin_removed == 1 && leader == 'Zinoviev-Kamenev-Stalin') {
      leader = 'Bukharin-Rykov'; line = 'nep_united_front'; fav = 'right';
    }
    // after a failed October the troika blames the Right and turns to bolshevisation, which favours the Left
    if (leader == 'Zinoviev-Kamenev-Stalin' && Q.y23_failed == 1) { line = 'bolshevisation'; fav = 'left'; }
    Q.comintern_line = line;
    Q.moscow_favored = fav;
    if (leader != Q.moscow_leader) {
      Q.moscow_leader_old = Q.moscow_leader;
      Q.moscow_leader = leader;
      Q.moscow_change_pending = 1;
    }
    // the favoured faction's line earns trust, any other line loses it; displeasure follows from trust
    Q.comintern_trust += (Q.party_line == Q.moscow_favored) ? 1 : -1;
    Q.comintern_trust = Math.max(0, Math.min(100, Q.comintern_trust));
    var tier = 0;
    if (Q.comintern_trust < 15) { tier = 4; }
    else if (Q.comintern_trust < 30) { tier = 3; }
    else if (Q.comintern_trust < 40) { tier = 2; }
    else if (Q.comintern_trust < 50) { tier = 1; }
    if (tier > Q.moscow_tier) { Q.moscow_tier_pending = tier; }
    Q.moscow_tier = tier;
    // the subsidy is cut while trust is under 40, and pays one resource a quarter while it lasts
    Q.soviet_subsidy = (Q.subsidy_granted == 1 && tier < 2) ? 1 : 0;
    if (Q.soviet_subsidy == 1 && Q.time % 3 == 0) { Q.resources += 1; }
    Q.gv_line_ok_now = (Q.party_line == 'right' || Q.party_line == 'centre') ? 1 : 0;
  };

  // 1923: the hyperinflation is a scripted timeline (dollar rate in paper marks, approximate monthly values).
  KPD.monthlyEconomy = function(Q) {
    if (!Q.hyper_script) { return; }
    var rates = {1: 'about 18,000', 2: 'about 28,000', 3: 'about 21,000', 4: 'about 24,000', 5: 'about 47,000',
                 6: 'about 110,000', 7: 'about 350,000', 8: 'about 4.6 million', 9: 'about 100 million',
                 10: 'about 25 billion', 11: 'about 4.2 trillion', 12: '4.2 (Rentenmark)'};
    var infl = {1: 3, 2: 3, 3: 3, 4: 3, 5: 5, 6: 8, 7: 10, 8: 12, 9: 12, 10: 12, 11: 12, 12: 3};
    Q.usd_rate = rates[Q.month];
    Q.inflation = infl[Q.month];
    if (Q.year >= 1924) { Q.hyper_script = 0; Q.inflation = 1; }
  };

  // ---- Lands and districts ---------------------------------------------------
  // The map shows only the Lands where the party can act right now. Each Land has a state level
  // (its government, police and Landtag, which set the pressure) and a party level: the KPD
  // district, where the player acts. Prussia is one Land with several districts; every other
  // Land is one district. A district has two numbers: organisation (visible, 0 to 100: members,
  // cells, factory groups) and pressure (shown as words: police, courts, employers, the leagues).
  // Starting values are design estimates for play, not measurements.
  // Landtag seats follow Die Rote Fahne's rf_states.js (the USPD counted with the SPD).
  KPD.LANDS = {
    prussia: {name: 'Prussia', capital: 'Berlin', districts: ['berlin', 'ruhr', 'central'],
      gov: 'Grand coalition of the SPD, Centre, DDP and DVP under Otto Braun (SPD); Carl Severing (SPD) commands the police',
      elected: 'February 1921', seats: {kpd: 31, spd: 142, ddp: 26, z: 81, dvp: 58, other: 15, dnvp: 75},
      note: 'Three fifths of the Reich, and most of the party with it. Its police is the strongest in Germany, and it answers to a Social Democrat.'},
    saxony: {name: 'Saxony', capital: 'Dresden', districts: ['saxony'],
      gov: 'SPD minority government that needs Communist votes',
      elected: 'November 1922', seats: {kpd: 10, spd: 40, ddp: 8, dvp: 19, dnvp: 19},
      note: 'Red Saxony: the most industrial Land, where the left of the SPD is strongest. Without our ten seats there is no workers\' majority.'},
    thuringia: {name: 'Thuringia', capital: 'Weimar', districts: ['thuringia'],
      gov: 'Socialist minority government under August Frölich (SPD), tolerated by the KPD',
      elected: 'September 1921', seats: {kpd: 6, spd: 22, ddp: 3, agr: 10, dvp: 9, dnvp: 4},
      note: 'Small towns, glassworks and cottage industry. The socialist government lives on our six votes.'},
    hamburg: {name: 'Hamburg', capital: 'Hamburg', districts: ['hamburg'],
      gov: 'Senate of the SPD and DDP',
      elected: 'February 1921', seats: {kpd: 18, spd: 69, ddp: 23, dvp: 23, other: 9, dnvp: 18},
      note: 'The port and the shipyards. Thälmann\'s city, and a stronghold of the Left.'},
    bavaria: {name: 'Bavaria', capital: 'Munich', districts: ['bavaria'],
      gov: 'Right-wing coalition under Eugen von Knilling (BVP)',
      elected: 'June 1920', seats: {kpd: 2, spd: 45, ddp: 12, bvp: 65, agr: 12, dnvp: 19},
      note: 'A "cell of order" since the Soviet Republic was crushed in 1919. The völkisch leagues drill openly; Communists are watched, searched and arrested.'}
  };
  KPD.LAND_ORDER = ['prussia', 'saxony', 'thuringia', 'hamburg', 'bavaria'];

  // lean: which faction the district's delegates favour at a congress
  // who governs a Land changes with the year's events
  KPD.landGov = function(Q, l) {
    if (l == 'saxony') {
      if (Q.y23_exec_done == 1) { return 'Removed by the Reichsexekution: a Reich commissioner, then an SPD and DDP cabinet'; }
      if (Q.y23_saxony == 1) { return 'Workers\' government of the SPD and KPD under Erich Zeigner (SPD)'; }
      if (Q.y23_zeigner_done == 1 && Q.zeigner == 1) { return 'SPD government under Erich Zeigner, elected with our votes'; }
      if (Q.y23_zeigner_done == 1) { return 'Caretaker cabinet: Zeigner was not elected'; }
      if (Q.month >= 2 || Q.year > 1923) { return 'Caretaker cabinet: Buck\'s government fell to our votes in January'; }
    }
    if (l == 'thuringia') {
      if (Q.y23_exec_done == 1) { return 'The Reichswehr occupies the Land; the SPD and KPD ministers are gone'; }
      if (Q.y23_thuringia == 1) { return 'Workers\' government of the SPD and KPD under August Frölich (SPD)'; }
    }
    if (l == 'bavaria' && Q.year == 1923 && Q.month >= 10) {
      return 'Gustav von Kahr, General State Commissioner with dictatorial powers since 26 September';
    }
    return KPD.LANDS[l].gov;
  };

  KPD.DISTRICTS = {
    berlin:    {name: 'Berlin', land: 'prussia', org: 40, pres: 30, lean: 'left', lon: 13.4, lat: 52.5,
                note: 'The Zentrale sits here, and so does the Left opposition: Fischer and Maslow run the district.'},
    ruhr:      {name: 'Rhine and Ruhr', land: 'prussia', org: 35, pres: 45, lean: 'left', lon: 7.1, lat: 51.45,
                note: 'Coal and steel, under French bayonets and German mine owners at once.'},
    central:   {name: 'Central Germany', land: 'prussia', org: 45, pres: 30, lean: 'centre', lon: 11.9, lat: 51.75,
                note: 'Halle and Merseburg: the Leuna works, the potash and lignite pits. The party\'s strongest base since 1921.'},
    saxony:    {name: 'Saxony', land: 'saxony', org: 45, pres: 15, lean: 'right', lon: 13.35, lat: 50.95,
                note: 'Chemnitz, Leipzig, Dresden: textile mills and machine works, and Brandler\'s home ground.'},
    thuringia: {name: 'Thuringia', land: 'thuringia', org: 35, pres: 15, lean: 'right', lon: 10.75, lat: 50.75,
                note: 'Gera, Jena, Suhl: small works spread over many towns.'},
    hamburg:   {name: 'Hamburg', land: 'hamburg', org: 40, pres: 30, lean: 'left', lon: 10.0, lat: 53.55,
                note: 'The docks and the yards. Thälmann\'s district.'},
    bavaria:   {name: 'Bavaria', land: 'bavaria', org: 10, pres: 80, lean: 'centre', lon: 11.58, lat: 48.6,
                note: 'Munich, Nuremberg, Augsburg. The party works half underground.'}
  };

  KPD.newDistricts = function(Q) {
    for (var d in KPD.DISTRICTS) {
      Q['d_' + d + '_org'] = KPD.DISTRICTS[d].org;
      Q['d_' + d + '_pres'] = KPD.DISTRICTS[d].pres;
      Q['d_' + d + '_h'] = 0;       // units of the Proletarian Hundreds
      Q['d_' + d + '_front'] = 0;   // joint actions with the SPD here
      Q['d_' + d + '_cd'] = 0;      // turns before the district can act again
      Q['d_' + d + '_council'] = 0; // our share in the last factory council elections
    }
    Q.mood = 55;
    Q.land_view = 'prussia';
    Q.district_view = 'berlin';
  };

  // The workers' mood (hidden, shown as words): it follows the inflation in 1923 and decides how
  // quickly work in the districts bears fruit.
  KPD.MOOD_1923 = {1: 55, 2: 60, 3: 60, 4: 62, 5: 70, 6: 75, 7: 85, 8: 90, 9: 85, 10: 80, 11: 60, 12: 45};
  KPD.moodWord = function(m) {
    return m >= 85 ? 'seething' : m >= 70 ? 'bitter' : m >= 55 ? 'restless' : m >= 40 ? 'tired' : 'resigned';
  };
  KPD.pressureWord = function(p) {
    return p >= 80 ? 'persecution' : p >= 60 ? 'raids and arrests' : p >= 40 ? 'watchful police' : p >= 20 ? 'tolerated' : 'free to work';
  };
  KPD.orgWord = function(o) {
    return o >= 75 ? 'a fortress' : o >= 60 ? 'strong' : o >= 45 ? 'solid' : o >= 30 ? 'thin' : o >= 15 ? 'weak' : 'scattered';
  };
  // the united front, the Hundreds and Moscow's trust, in words
  KPD.unityWord = function(u) {
    return u >= 9 ? 'a mass movement' : u >= 6 ? 'broad' : u >= 3 ? 'growing' : u >= 1 ? 'first steps' : 'not yet begun';
  };
  KPD.unitsWord = function(n) {
    return n >= 4 ? 'many units' : n >= 2 ? 'several units' : n == 1 ? 'one unit' : 'none';
  };
  KPD.trustWord = function(t) {
    return t >= 75 ? 'full confidence' : t >= 60 ? 'confident' : t >= 50 ? 'satisfied' : t >= 40 ? 'doubtful' : t >= 30 ? 'displeased' : t >= 15 ? 'angry' : 'hostile';
  };
  KPD.moodFactor = function(Q) { return 0.6 + Q.mood / 125; };

  // The actions a district offers. when(): the action exists now (the Land shows on the map only
  // while one of its actions exists); can(): it can be chosen; why: the reason when it cannot.
  // Every action is one turn. Gains scale with the campaign multiplier m and the workers' mood.
  KPD.ACTIONS = {
    organise: {title: 'Build factory cells and recruit',
      cost: 1, when: function(Q, d) { return !KPD.illegalIn(Q, d); },
      can: function(Q, d) { return Q.resources >= 1; }, why: 'Needs 1 resource.',
      effect: function(Q, d) { KPD.addOrg(Q, d, 5); KPD.addPres(Q, d, 1); },
      sum: 'Builds organisation. Costs 1 resource.'},
    struggle: {title: 'Lead a strike or an unemployed march',
      cost: 0, when: function(Q, d) { return !KPD.illegalIn(Q, d) && d != 'bavaria'; },
      can: function(Q, d) { return Q['d_' + d + '_org'] >= 30; }, why: 'Needs at least a thin organisation here.',
      effect: function(Q, d) { KPD.addOrg(Q, d, 2); KPD.addPres(Q, d, 6); Q.y23_strikes += 1;
        Q.workers_kpd += 1 * Q.campaign_mult; Q.kf_left_strength += 1; },
      sum: 'Some organisation; the police take note. The Left gains.'},
    front: {title: 'Build the united front with SPD and union workers',
      cost: 1, when: function(Q, d) { return d != 'bavaria' && !KPD.illegalIn(Q, d); },
      can: function(Q, d) { return Q.resources >= 1 && Q['d_' + d + '_org'] >= 15; }, why: 'Needs 1 resource and at least a weak organisation here.',
      effect: function(Q, d) { Q.y23_unity += 1; Q['d_' + d + '_front'] += 1; KPD.addOrg(Q, d, 1); Q.spd_relation += 1;
        Q.kf_right_strength += 1; Q.kf_left_dissent += 2; },
      sum: 'Widens the united front. Costs 1 resource. The Right gains, the Left grumbles.'},
    defence: {title: 'Form a unit of the Proletarian Hundreds',
      cost: 1, when: function(Q, d) { return Q.year == 1923 && !(Q.month == 1); },
      can: function(Q, d) { return Q.resources >= 1 && Q['d_' + d + '_org'] >= 30; },
      why: 'Needs 1 resource and at least a thin organisation here.',
      effect: function(Q, d) { Q['d_' + d + '_h'] += 1; Q.y23_hundreds += 1; Q.rfb_strength += 10; KPD.addPres(Q, d, 7);
        Q.kf_left_strength += 1; },
      sum: 'A new unit here. The state answers. Costs 1 resource.'},
    underground: {title: 'Move the work underground',
      cost: 1, when: function(Q, d) { return KPD.illegalIn(Q, d) || Q['d_' + d + '_pres'] >= 60; },
      can: function(Q, d) { return Q.resources >= 1; }, why: 'Needs 1 resource.',
      effect: function(Q, d) { KPD.addPres(Q, d, -12); KPD.addOrg(Q, d, 1); },
      sum: 'Eases the pressure. Costs 1 resource.'},
    // Saxony: control committees against the profiteers, spring and summer 1923
    control: {title: 'Set up price control committees', only: ['saxony', 'thuringia', 'central', 'berlin'],
      cost: 0, when: function(Q, d) { return Q.year == 1923 && Q.month >= 3 && Q.month <= 9; },
      can: function(Q, d) { return Q['d_' + d + '_org'] >= 45; }, why: 'Needs at least a solid organisation here.',
      effect: function(Q, d) { KPD.addOrg(Q, d, 3); Q.unemployed_kpd += 1 * Q.campaign_mult; Q.workers_kpd += 1 * Q.campaign_mult;
        KPD.addPres(Q, d, 3); },
      sum: 'Builds organisation; housewives and the unemployed come to us.'},
    // Bavaria: the 1 May 1923 counter-demonstration in Munich, and the autumn border defence
    mayday: {title: 'Hold May Day in Munich against the leagues', only: ['bavaria'],
      cost: 0, when: function(Q, d) { return Q.year == 1923 && Q.month == 4; },
      can: function(Q, d) { return true; }, why: '',
      effect: function(Q, d) { KPD.addOrg(Q, d, 4); KPD.addPres(Q, d, 5); Q.y23_unity += 1; Q.kf_centre_strength += 1; },
      sum: 'Builds organisation and the united front.'},
    border: {title: 'Watch the Bavarian border with the Thuringian Hundreds', only: ['bavaria'],
      cost: 1, when: function(Q, d) { return Q.year == 1923 && Q.month >= 10 && Q.month <= 11; },
      can: function(Q, d) { return Q.resources >= 1 && Q.d_thuringia_org >= 30; },
      why: 'Needs 1 resource and at least a thin organisation in Thuringia.',
      effect: function(Q, d) { Q.d_thuringia_h += 1; Q.y23_hundreds += 1; Q.y23_unity += 1; KPD.addPres(Q, 'thuringia', 4); },
      sum: 'A new unit in Thuringia, and the united front grows. Costs 1 resource.'}
  };
  KPD.ACTION_ORDER = ['organise', 'struggle', 'front', 'defence', 'control', 'mayday', 'border', 'underground'];

  KPD.illegalIn = function(Q, d) { return Q.kpd_banned == 1; };
  KPD.addOrg = function(Q, d, x) {
    var k = 'd_' + d + '_org';
    var gain = x > 0 ? x * Q.campaign_mult * KPD.moodFactor(Q) : x;
    Q[k] = Math.max(0, Math.min(100, Math.round((Q[k] + gain) * 10) / 10));
  };
  KPD.addPres = function(Q, d, x) {
    var k = 'd_' + d + '_pres';
    Q[k] = Math.max(0, Math.min(100, Q[k] + x));
  };

  KPD.actionExists = function(Q, d, a) {
    var A = KPD.ACTIONS[a];
    if (A.only && A.only.indexOf(d) < 0) { return false; }
    // Bavaria is not a field for ordinary work in 1923: only its own actions and the underground show there
    if (d == 'bavaria' && !A.only && a != 'underground') { return false; }
    return A.when(Q, d);
  };

  // A district action, chosen on the map: one turn.
  KPD.act = function(Q, d, a) {
    var A = KPD.ACTIONS[a];
    Q.resources -= A.cost;
    A.effect(Q, d);
    Q['d_' + d + '_cd'] = 1;
    Q.month_actions += 1;
    Q.last_action = A.title + ' (' + KPD.DISTRICTS[d].name + ')';
  };

  // Every turn: district cooldowns run down.
  KPD.turnDistricts = function(Q) {
    for (var d in KPD.DISTRICTS) {
      if (Q['d_' + d + '_cd'] > 0) { Q['d_' + d + '_cd'] -= 1; }
    }
  };

  // Every month: the mood follows the year, pressure eases a little, and heavy pressure costs organisation.
  KPD.monthlyDistricts = function(Q) {
    if (Q.year == 1923) { Q.mood = KPD.MOOD_1923[Q.month]; }
    for (var d in KPD.DISTRICTS) {
      var p = Q['d_' + d + '_pres'];
      if (p >= 80) { KPD.addOrg(Q, d, -3); }
      else if (p >= 60) { KPD.addOrg(Q, d, -1.5); }
      KPD.addPres(Q, d, -2);
    }
    // the party's dues come in through the districts: every 150 points of organisation pay one resource a month
    var org = 0;
    for (d in KPD.DISTRICTS) { org += Q['d_' + d + '_org']; }
    Q.org_total = Math.round(org);
    Q.dues_income = Math.floor(org / 150);
    Q.resources += Q.dues_income;
  };
  KPD.duesEstimate = function(Q) {
    var org = 0;
    for (var d in KPD.DISTRICTS) { org += Q['d_' + d + '_org']; }
    return Math.floor(org / 150);
  };

  // The flags the scenes read (dendry conditions cannot call functions): which Lands and actions
  // show, which can be chosen, and the words for the sidebar and the map.
  // games saved before the year-1 rebuild lack the district state: fill in what is missing
  KPD.migrate = function(Q) {
    if (!Q || Q.d_berlin_org !== undefined || Q.year === undefined) { return; }
    KPD.newDistricts(Q);
    KPD.newDirectives(Q);
    if (Q.sub === undefined) { Q.sub = 1; }
    if (Q.turn === undefined) { Q.turn = 1; }
    if (Q.spd_relation === undefined) {
      Q.spd_relation = 25; Q.z_relation = 10; Q.bvp_relation = 3; Q.ddp_relation = 8; Q.dvp_relation = 3; Q.dnvp_relation = 0; Q.nsdap_relation = 0;
    }
    if (!Q.news_log) { Q.news_head = ''; Q.news_sub = ''; Q.news_log = []; }
    if (!Q.rt_seats) { Q.rt_seats = {spd: 173, kpd: 15, z: 64, bvp: 21, ddp: 39, dvp: 65, dnvp: 68, nsdap: 3, other: 11}; }
    Q.date_label = KPD.dateLabel(Q);
    KPD.refresh(Q);
  };
  KPD.refresh = function(Q) {
    Q.mood_word = KPD.moodWord(Q.mood);
    for (var l of KPD.LAND_ORDER) {
      var any = 0;
      for (var d of KPD.LANDS[l].districts) {
        var dn = 0;
        for (var a of KPD.ACTION_ORDER) {
          var ex = KPD.actionExists(Q, d, a) ? 1 : 0;
          Q['x_' + d + '_' + a] = ex;
          Q['c_' + d + '_' + a] = (ex && Q['d_' + d + '_cd'] <= 0 && KPD.ACTIONS[a].can(Q, d)) ? 1 : 0;
          dn += ex;
        }
        Q['x_' + d] = dn > 0 ? 1 : 0;
        Q['w_' + d + '_org'] = KPD.orgWord(Q['d_' + d + '_org']);
        Q['w_' + d + '_pres'] = KPD.pressureWord(Q['d_' + d + '_pres']);
        Q['r_' + d + '_org'] = Math.round(Q['d_' + d + '_org']);
        any += dn;
      }
      Q['x_' + l] = any > 0 ? 1 : 0;
    }
    KPD.refreshDirective(Q);
    KPD.refreshOctober(Q);
  };

  // ---- Moscow's directives -----------------------------------------------------
  // Each plenum sets a directive with a target that is judged when the next one comes due:
  // meeting it raises trust by 6, missing it costs 6. (time counts months, January 1923 = 1)
  KPD.DIRECTIVES = [
    {id: 'unitedfront', due: 6, by: 'the enlarged Executive in June',
      text: 'Win the majority of the working class: the united front from below and from above.',
      target: 'A growing united front',
      check: function(Q) { return Q.y23_unity >= 3; },
      progress: function(Q) { return 'the united front: ' + KPD.unityWord(Q.y23_unity); }},
    {id: 'defence', due: 9, by: 'the Politburo\'s decision in September',
      text: 'Defend the working class against the fascist leagues and the Black Reichswehr.',
      target: 'Units of the Hundreds in three districts',
      check: function(Q) { return KPD.districtsWith(Q, '_h', 1) >= 3; },
      progress: function(Q) { var n = KPD.districtsWith(Q, '_h', 1); return n ? 'units in ' + ['one', 'two', 'three', 'four', 'five', 'six', 'seven'][Math.min(n, 7) - 1] + (n == 1 ? ' district' : ' districts') : 'no units yet'; }},
    {id: 'october', due: 10, by: 'the Chemnitz conference in October',
      text: 'Prepare the German October.',
      target: 'A strong organisation in Saxony, with several units of the Hundreds',
      check: function(Q) { return Q.d_saxony_org >= 60 && Q.d_saxony_h >= 2; },
      progress: function(Q) { return 'Saxony ' + KPD.orgWord(Q.d_saxony_org) + ', ' + KPD.unitsWord(Q.d_saxony_h); }}
  ];
  KPD.districtsWith = function(Q, suffix, min) {
    var n = 0;
    for (var d in KPD.DISTRICTS) { if (Q['d_' + d + suffix] >= min) { n += 1; } }
    return n;
  };
  KPD.newDirectives = function(Q) {
    Q.dir_idx = 0; Q.dir_verdict_pending = 0; Q.dir_met = 0; Q.dir_verdict = ''; Q.dir_record = '';
  };
  KPD.refreshDirective = function(Q) {
    var D = KPD.DIRECTIVES[Q.dir_idx];
    Q.dir_active = D ? 1 : 0;
    if (!D) { return; }
    Q.dir_text = D.text; Q.dir_target = D.target; Q.dir_by = D.by; Q.dir_progress = D.progress(Q);
    Q.dir_ok = D.check(Q) ? 1 : 0;
    Q.dir_due_label = KPD.MONTHS[(D.due - 1) % 12];
  };
  KPD.monthlyDirectives = function(Q) {
    var D = KPD.DIRECTIVES[Q.dir_idx];
    if (!D || Q.time < D.due) { return; }
    Q.dir_met = D.check(Q) ? 1 : 0;
    Q.comintern_trust += Q.dir_met ? 6 : -6;
    Q.dir_verdict = D.target;
    Q.dir_record += (Q.dir_met ? 'M' : 'X');
    Q.dir_verdict_pending = 1;
    Q.dir_idx += 1;
  };

  // ---- The German October ------------------------------------------------------
  // From August the paper shows what the Chemnitz call needs. The general strike holds if
  // Saxony is strong, the SPD workers have learned to act with us, and one more district can follow.
  KPD.refreshOctober = function(Q) {
    Q.oct_show = (Q.year == 1923 && Q.month >= 8 && Q.y23_chemnitz_done == 0) ? 1 : 0;
    Q.oct_c1 = Q.d_saxony_org >= 60 ? 1 : 0;
    Q.oct_c2 = Q.y23_unity >= 6 ? 1 : 0;
    Q.oct_second = 'none';
    for (var d of ['central', 'thuringia', 'berlin']) {
      if (Q.oct_second == 'none' && Q['d_' + d + '_org'] >= 60) { Q.oct_second = KPD.DISTRICTS[d].name; }
    }
    Q.oct_c3 = Q.oct_second != 'none' ? 1 : 0;
    Q.oct_ok = (Q.oct_c1 && Q.oct_c2 && Q.oct_c3) ? 1 : 0;
  };

  // ---- Votes ---------------------------------------------------------------------
  // Factory council elections (spring): our share in each district follows our vote among the
  // workers and our organisation there.
  KPD.councilElections = function(Q) {
    var won = 0, rows = [];
    for (var d in KPD.DISTRICTS) {
      if (d == 'bavaria') { continue; }
      var share = Math.round(Q.workers_kpd_normalized * (0.5 + Q['d_' + d + '_org'] / 80));
      Q['d_' + d + '_council'] = share;
      if (share >= 30) { won += 1; KPD.addOrg(Q, d, 2); }
      rows.push(d);
    }
    Q.councils_won = won;
    return won;
  };

  // A vote in a parliament: seats for, against, abstaining, with the majority needed.
  KPD.tally = function(seats, sides, need) {
    var r = {yes: 0, no: 0, abstain: 0, total: 0};
    for (var p in seats) {
      r.total += seats[p];
      r[sides[p] || 'abstain'] += seats[p];
    }
    r.need = need == 'two_thirds' ? Math.ceil((r.yes + r.no) * 2 / 3) : Math.floor(r.total / 2) + 1;
    r.passed = need == 'two_thirds' ? r.yes >= r.need : r.yes >= r.need;
    return r;
  };
  // The Saxon Landtag elected in November 1922 (96 seats) and two Reichstag votes of the autumn.
  KPD.SAXONY_SEATS = {spd: 40, kpd: 10, ddp: 8, dvp: 19, dnvp: 19};
  KPD.VOTES = {
    zeigner: {house: 'Saxon Landtag, 21 March 1923', question: 'Erich Zeigner (SPD) for Minister-President',
      seats: KPD.SAXONY_SEATS, need: 'majority',
      sides: function(Q) { return {spd: 'yes', kpd: Q.zeigner_kpd || 'abstain', ddp: 'no', dvp: 'no', dnvp: 'no'}; },
      note: 'The SPD has 40 seats of the 49 it needs. Without our ten there is no workers\' majority in Dresden.'},
    enabling: {house: 'Reichstag, 13 October 1923', question: 'An Enabling Act for Stresemann\'s cabinet',
      seats: null, need: 'two_thirds',
      sides: function(Q) { return {spd: 'yes', z: 'yes', bvp: 'yes', ddp: 'yes', dvp: 'yes', kpd: 'no', dnvp: 'no', nsdap: 'no', other: 'abstain'}; },
      note: 'The cabinet may now rule by decree on "financial, economic and social" matters. The eight-hour day is the first thing on its list.'},
    confidence: {house: 'Reichstag, 23 November 1923', question: 'Confidence in Stresemann\'s cabinet',
      seats: null, need: 'majority',
      sides: function(Q) { return {spd: 'no', kpd: Q.conf_kpd || 'no', dnvp: 'no', nsdap: 'no', z: 'yes', bvp: 'yes', ddp: 'yes', dvp: 'yes', other: 'abstain'}; },
      note: 'The SPD votes against the man who sent the Reichswehr into Saxony and left Bavaria alone. It had kept him in office until the work was done.'}
  };
  KPD.voteSeats = function(Q, id) { return KPD.VOTES[id].seats || Q.rt_seats; };

  // The front page: an event's title becomes the headline, its subtitle the line beneath.
  KPD.headline = function(Q, scene) {
    if (!scene.title || Q.news_head == scene.title) { return; }
    var sub = (scene.subtitle || '').split(' · dev:')[0];
    if (sub.indexOf('dev:') == 0) { sub = ''; }
    Q.news_head = scene.title;
    Q.news_sub = sub;
    Q.news_log = [{t: scene.title, d: KPD.shortDate(Q)}].concat(Q.news_log || []).slice(0, 8);
  };
  // words for numbers, on the base game's scales (source/qdisplays)
  var scale = function(x, steps) {
    for (var i = 0; i < steps.length; i++) { if (x < steps[i][0]) { return steps[i][1]; } }
    return steps[steps.length - 1][1];
  };
  // The Reich cabinet, from the chancellor and the date (the SPD left Stresemann's coalition
  // on 2 November 1923, after the Reich execution against Saxony).
  KPD.cabinet = function(Q) {
    if (Q.chancellor == 'Marx') {
      return {short: 'Marx\'s minority cabinet', name: 'First Marx cabinet', since: 'from 30 November 1923', parties: ['z', 'bvp', 'ddp', 'dvp'], tolerated: ['spd'], experts: false,
        note: 'The bourgeois middle governs alone, with the SPD voting through its Enabling Act. The stabilisation will be paid for by the workers.'};
    }
    if (Q.chancellor == 'Stresemann') {
      if (Q.year > 1923 || Q.month >= 11) {
        return {short: 'Stresemann\'s rump cabinet', name: 'Second Stresemann cabinet, without the SPD', since: 'from 3 November 1923', parties: ['ddp', 'z', 'dvp'], tolerated: [], experts: false,
          note: 'The Social Democrats walked out after the army deposed the Saxon government, and kept their ministers out of the way of Bavaria. The cabinet lives on until the next vote of confidence.'};
      }
      return {short: 'The Great Coalition', name: 'Stresemann\'s Great Coalition', since: 'from 13 August 1923', parties: ['spd', 'ddp', 'z', 'dvp'], tolerated: [], experts: false,
        note: 'Social Democrats in a cabinet led by the party of heavy industry. It ends passive resistance in the Ruhr and prepares the new currency.'};
    }
    return {short: 'Cuno\'s business cabinet', name: 'The Cuno cabinet, "cabinet of business"', since: 'from 22 November 1922', parties: ['ddp', 'z', 'bvp', 'dvp'], tolerated: ['spd'], experts: true,
      note: 'Shipping and banking men with the bourgeois parties behind them, kept in office by the SPD. Its answer to the Ruhr occupation is passive resistance and the printing press.'};
  };
  KPD.dissentWord = function(x) { return scale(x, [[5, 'very low'], [15, 'low'], [31, 'medium'], [50, 'high'], [1e9, 'very high']]); };
  KPD.strengthWord = function(x) { return scale(x, [[10, 'weak'], [25, 'moderate'], [40, 'strong'], [60, 'very strong'], [1e9, 'dominant']]); };
  KPD.relationWord = function(x) {
    return scale(x || 0, [[5, 'hostile'], [15, 'frigid'], [30, 'cold'], [40, 'cool'], [55, 'neutral'], [65, 'warm'], [75, 'friendly'], [1e9, 'very friendly']]);
  };

  // news from abroad for the paper's column, by month of 1923 (newest first)
  KPD.WORLD_1923 = [
    [1, 'January', 'Lithuanian irregulars seize the Memel territory from its Allied administrators.'],
    [3, 'March', 'Lenin suffers a third stroke and can no longer speak.'],
    [4, 'April', 'The Russian party holds its Twelfth Congress without Lenin.'],
    [5, 'May', 'Stanley Baldwin becomes Prime Minister of Britain.'],
    [6, 'June', 'In Bulgaria officers overthrow Stamboliyski\'s peasant government; the Bulgarian communists stand aside.'],
    [7, 'July', 'The Treaty of Lausanne settles the borders of the new Turkey.'],
    [8, 'August', 'President Harding dies; Calvin Coolidge takes office in Washington.'],
    [9, 'September', 'An earthquake destroys Tokyo and Yokohama. In Spain General Primo de Rivera seizes power. In Bulgaria the communists rise too late and are crushed.'],
    [10, 'October', 'The Republic of Turkey is proclaimed, with Mustafa Kemal as president.'],
    [12, 'December', 'A British election leaves no party a majority; Labour may form a government.']
  ];
  KPD.worldNews = function(Q) {
    if (Q.year != 1923) { return []; }
    return KPD.WORLD_1923.filter(function(w) { return w[0] <= Q.month; }).reverse().map(function(w) { return [w[1], w[2]]; });
  };
}());
