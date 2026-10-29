// KPD: drawing. Scenes leave placeholders (<div class="kpd-insert" data-insert="...">) and the
// sidebar tabs leave theirs; these functions fill them with the newspaper, the map, parliaments,
// bars and tables that Dendry's text markup cannot build on its own. Loaded after kpd.js.
(function() {
  var KPD = window.KPD;
  var UI = KPD.UI = {};

  var esc = function(s) {
    return String(s === undefined || s === null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };
  var round = function(x) { return Math.round(x); };
  var Qnow = function() { return window.dendryUI.dendryEngine.state.qualities; };

  var PARTY = {
    kpd: ['KPD', 'Communist Party of Germany'], spd: ['SPD', 'Social Democratic Party of Germany'],
    z: ['Z', 'Centre Party'], bvp: ['BVP', 'Bavarian People\'s Party'], ddp: ['DDP', 'German Democratic Party'],
    dvp: ['DVP', 'German People\'s Party'], dnvp: ['DNVP', 'German National People\'s Party'],
    nsdap: ['Völkisch', 'The völkisch right: the DVFP in the Reichstag, the NSDAP in Bavaria'],
    agr: ['Agrarians', 'Farmers\' and rural leagues'], other: ['Others', 'Smaller parties']
  };
  var SEAT_ORDER = ['kpd', 'spd', 'ddp', 'z', 'bvp', 'agr', 'dvp', 'other', 'dnvp', 'nsdap'];
  var FACTION = {right: ['Right', 'Brandler, Thalheimer, Walcher'], centre: ['Centre', 'Meyer, Zetkin, Pieck, Eberlein'],
                 left: ['Left', 'Fischer, Maslow, Thälmann, Scholem']};

  // ---- Small pieces ------------------------------------------------------------
  UI.partyName = function(p) {
    var n = PARTY[p] || [p.toUpperCase(), ''];
    return '<span class="party p-' + (p == 'z' ? 'zentrum' : p) + '" title="' + esc(n[1]) + '">' + esc(n[0]) + '</span>';
  };

  // A parliament as a hemicycle: seats in rows, filled from the left (seats: {party: n}).
  UI.hemicycle = function(seats, opts) {
    opts = opts || {};
    var order = (opts.order || SEAT_ORDER).filter(function(p) { return seats[p] > 0; });
    var n = 0;
    order.forEach(function(p) { n += seats[p]; });
    if (!n) { return ''; }
    var rows = Math.max(3, Math.min(12, Math.round(Math.sqrt(n / 4))));
    var r0 = 0.38, r1 = 1, radii = [], total = 0, i;
    for (i = 0; i < rows; i++) { var r = r0 + (r1 - r0) * i / (rows - 1); radii.push(r); total += r; }
    var pts = [];
    var left = n;
    for (i = 0; i < rows; i++) {
      var k = i == rows - 1 ? left : Math.round(n * radii[i] / total);
      left -= k;
      for (var j = 0; j < k; j++) {
        var ang = Math.PI * (k == 1 ? 0.5 : j / (k - 1));
        pts.push({x: -Math.cos(ang) * radii[i], y: Math.sin(ang) * radii[i], ang: ang});
      }
    }
    pts.sort(function(u, v) { return u.ang - v.ang || v.y - u.y; });
    var dot = Math.min(0.9 / rows * 0.42, 0.06);
    var svg = '<svg class="khemi" viewBox="-1.06 -1.06 2.12 1.12" role="img" aria-label="' + esc(opts.label || 'Seats') + '">';
    var idx = 0;
    order.forEach(function(p) {
      for (var s = 0; s < seats[p] && idx < pts.length; s++, idx++) {
        var pt = pts[idx];
        var cls = (opts.sides ? ' side-' + (opts.sides[p] || 'abstain') : '');
        svg += '<circle class="seat bgf-' + p + cls + '" cx="' + pt.x.toFixed(3) + '" cy="' + (-pt.y).toFixed(3) + '" r="' + dot.toFixed(3) + '"/>';
      }
    });
    if (opts.centre) {
      svg += '<text x="0" y="-0.08" class="khemi-n">' + esc(opts.centre) + '</text>';
    }
    return svg + '</svg>';
  };
  UI.seatLegend = function(seats, sides) {
    var total = 0, p;
    for (p in seats) { total += seats[p]; }
    var out = '<table class="ktable">';
    SEAT_ORDER.forEach(function(p) {
      if (!seats[p]) { return; }
      out += '<tr><td><span class="kswatch bgf-' + p + '"></span>' + UI.partyName(p) + '</td><td class="knum">' + seats[p] +
        '</td><td class="knum kdim">' + (100 * seats[p] / total).toFixed(1) + '%</td>' +
        (sides ? '<td class="kside">' + ({yes: 'for', no: 'against', abstain: 'abstains'}[sides[p] || 'abstain']) + '</td>' : '') + '</tr>';
    });
    return out + '</table>';
  };

  // ---- The map -------------------------------------------------------------------
  // A plain silhouette of the Reich in 1923 (rough outline from capitals and borders, for orientation
  // only), with a disc for every district where the party can act now. Colour = organisation.
  var X = function(lon) { return (lon - 5.6) * 64; };
  var Y = function(lat) { return (55.4 - lat) * 100; };
  var REICH = [[7.2, 53.3], [8.0, 53.6], [8.7, 53.9], [8.9, 54.4], [8.6, 54.9], [9.9, 54.8], [10.2, 54.4], [10.9, 54.0],
    [12.1, 54.2], [13.1, 54.4], [13.6, 54.6], [14.2, 53.95], [15.5, 54.2], [16.5, 54.55], [17.4, 54.65], [17.6, 54.3],
    [17.3, 53.9], [16.9, 53.5], [16.6, 53.1], [15.9, 52.6], [15.7, 52.2], [16.0, 51.8], [16.9, 51.6], [17.8, 51.2],
    [18.4, 50.8], [18.6, 50.4], [18.4, 50.0], [17.8, 50.0], [17.2, 50.3], [16.6, 50.25], [16.0, 50.6], [15.3, 50.85],
    [14.8, 50.85], [14.4, 51.0], [13.5, 50.65], [12.4, 50.25], [12.5, 49.8], [13.4, 49.2], [13.8, 48.75], [13.45, 48.55],
    [13.0, 47.75], [12.2, 47.65], [11.0, 47.4], [10.2, 47.3], [9.6, 47.55], [8.6, 47.65], [7.6, 47.6], [7.6, 48.2],
    [8.2, 48.95], [7.4, 49.15], [7.0, 49.6], [6.4, 49.8], [6.2, 50.3], [6.1, 50.75], [5.95, 51.0], [6.1, 51.6],
    [6.8, 51.95], [7.0, 52.6], [7.2, 53.3]];
  var EAST = [[19.4, 54.3], [19.9, 54.45], [20.5, 54.7], [21.2, 54.95], [21.5, 55.2], [22.8, 54.95], [22.8, 54.4],
    [22.6, 53.95], [21.0, 53.55], [19.7, 53.45], [19.1, 53.75], [19.0, 54.15], [19.4, 54.3]];
  var poly = function(pts) {
    return pts.map(function(p, i) { return (i ? 'L' : 'M') + X(p[0]).toFixed(0) + ' ' + Y(p[1]).toFixed(0); }).join('') + 'Z';
  };

  UI.orgColour = function(org) {
    var a = 0.18 + 0.82 * Math.min(1, org / 80);
    return 'rgba(180, 20, 20, ' + a.toFixed(2) + ')';
  };

  UI.map = function(Q) {
    var svg = '<svg class="kmap" viewBox="-20 -10 1150 820" role="img" aria-label="Map of the Lands where the party can act">';
    svg += '<path class="kmap-reich" d="' + poly(REICH) + '"/><path class="kmap-reich" d="' + poly(EAST) + '"/>';
    svg += '<text class="kmap-sea" x="' + X(6.8) + '" y="' + Y(54.6) + '">North Sea</text>';
    svg += '<text class="kmap-sea" x="' + X(15.2) + '" y="' + Y(55.0) + '">Baltic</text>';
    svg += '<text class="kmap-faint" x="' + X(20.4) + '" y="' + Y(53.2) + '">East Prussia</text>';
    // the Prussian districts are joined by a dashed line to show they are one Land
    var pr = KPD.LANDS.prussia.districts.filter(function(d) { return Q['x_' + d]; });
    if (pr.length > 1) {
      var path = pr.map(function(d, i) { var D = KPD.DISTRICTS[d]; return (i ? 'L' : 'M') + X(D.lon) + ' ' + Y(D.lat); }).join('');
      svg += '<path class="kmap-prussia" d="' + path + '"/>';
    }
    KPD.LAND_ORDER.forEach(function(l) {
      if (!Q['x_' + l]) { return; }
      KPD.LANDS[l].districts.forEach(function(d) {
        if (!Q['x_' + d]) { return; }
        var D = KPD.DISTRICTS[d], cx = X(D.lon), cy = Y(D.lat), org = Q['d_' + d + '_org'];
        var target = (l == 'prussia') ? 'district_' + d : 'land_' + l;
        var prussian = l == 'prussia';
        svg += '<a class="kmap-tile" href="#" onclick="window.KPD.UI.go(\'' + target + '\');return false;">' +
          '<title>' + esc(D.name + (prussian ? ' (Prussia)' : '') + ': organisation ' + round(org) + ', ' + KPD.pressureWord(Q['d_' + d + '_pres'])) + '</title>' +
          (prussian ? '<circle cx="' + cx + '" cy="' + cy + '" r="59" class="kmap-ring"/>' : '') +
          '<circle cx="' + cx + '" cy="' + cy + '" r="52" fill="' + UI.orgColour(org) + '" class="kmap-disc"/>' +
          '<text x="' + cx + '" y="' + (cy - 10) + '" class="kmap-org">' + round(org) + '</text>' +
          '<text x="' + cx + '" y="' + (cy + 11) + '" class="kmap-name">' + esc(D.short || D.name.replace('Rhine and ', '').replace('Central Germany', 'Central')) + '</text>' +
          '<text x="' + cx + '" y="' + (cy + 31) + '" class="kmap-pres">' + esc(KPD.pressureWord(Q['d_' + d + '_pres'])) + '</text>' +
          (Q['d_' + d + '_h'] > 0 ? '<text x="' + (cx + 36) + '" y="' + (cy - 36) + '" class="kmap-badge">' + Q['d_' + d + '_h'] + 'H</text>' : '') +
          '</a>';
      });
    });
    svg += '</svg>';
    var legend = '<div class="kmap-legend"><span class="kmap-key"><span class="kswatch" style="background:' + UI.orgColour(15) + '"></span>' +
      '<span class="kswatch" style="background:' + UI.orgColour(45) + '"></span><span class="kswatch" style="background:' + UI.orgColour(75) + '"></span> organisation</span>' +
      '<span class="kmap-key"><span class="kmap-key-ring"></span> districts of Prussia</span>' +
      '<span class="kmap-key"><b>H</b> units of the Hundreds</span></div>';
    return '<div class="kmap-wrap">' + svg + legend + '<p class="kmap-note">Only the Lands where the party can act this turn are shown. Click a district to work there; each action takes the turn. The workers\' mood is <b>' + esc(KPD.moodWord(Q.mood)) + '</b>.</p></div>';
  };

  UI.go = function(scene) {
    window.dendryUI.dendryEngine.goToScene(scene);
  };

  // ---- Land and district panels -----------------------------------------------------
  UI.land = function(Q, l) {
    var L = KPD.LANDS[l];
    var html = '<div class="kpanel"><div class="kpanel-row"><div class="kpanel-col">' +
      '<p class="klabel">Government</p><p>' + esc(KPD.landGov(Q, l)) + '</p>' +
      '<p class="klabel">Capital</p><p>' + esc(L.capital) + '</p>' +
      '<p class="kdim">' + esc(L.note) + '</p></div>' +
      '<div class="kpanel-col kpanel-chart"><p class="klabel">Landtag, elected ' + esc(L.elected) + '</p>' +
      UI.hemicycle(L.seats, {label: 'Landtag of ' + L.name}) + UI.seatLegend(L.seats) + '</div></div>';
    if (L.districts.length > 1) {
      html += '<p class="klabel">Party districts in ' + esc(L.name) + '</p><table class="ktable">';
      L.districts.forEach(function(d) {
        html += '<tr><td><b>' + esc(KPD.DISTRICTS[d].name) + '</b></td><td>organisation <b>' + round(Q['d_' + d + '_org']) + '</b> (' +
          esc(KPD.orgWord(Q['d_' + d + '_org'])) + ')</td><td class="kdim">' + esc(KPD.pressureWord(Q['d_' + d + '_pres'])) + '</td></tr>';
      });
      html += '</table>';
    }
    return html + '</div>';
  };

  UI.district = function(Q, d) {
    var D = KPD.DISTRICTS[d];
    var org = Q['d_' + d + '_org'], pres = Q['d_' + d + '_pres'];
    return '<div class="kpanel kdistrict">' +
      '<p class="klabel">Party district: ' + esc(D.name) + '</p>' +
      '<p>Organisation: <b>' + round(org) + '</b> (' + esc(KPD.orgWord(org)) + ')<br>' +
      'Pressure from the state: <b>' + esc(KPD.pressureWord(pres)) + '</b><br>' +
      'Proletarian Hundreds: ' + (Q['d_' + d + '_h'] || 0) + ' units<br>' +
      'United front actions here: ' + (Q['d_' + d + '_front'] || 0) +
      (Q['d_' + d + '_council'] ? '<br>Factory councils: ' + Q['d_' + d + '_council'] + '% of the vote' : '') + '</p>' +
      '<p class="kdim">' + esc(D.note) + ' Heavy pressure costs organisation every month.</p></div>';
  };

  var met = function(ok) { return ok ? '<span class="kmet">met</span>' : '<span class="kdim">not yet</span>'; };

  UI.october = function(Q) {
    return '<p>The Chemnitz call can hold if:</p><ul class="kchecks">' +
      '<li>Saxony at organisation 60 (now ' + round(Q.d_saxony_org) + '): ' + met(Q.oct_c1) + '</li>' +
      '<li>Six united front actions (now ' + Q.y23_unity + '): ' + met(Q.oct_c2) + '</li>' +
      '<li>One more district at 55, Central Germany, Thuringia or Berlin: ' + met(Q.oct_c3) +
      (Q.oct_c3 ? ' (' + esc(Q.oct_second) + ')' : '') + '</li></ul>';
  };

  // ---- The party paper, in its own column on the right -------------------------------------
  UI.news = function(Q) {
    var html = '<div class="rf-mast">Die Rote Fahne</div>' +
      '<div class="rf-sub">Central organ of the KPD<br>' + esc(Q.date_label) + '</div>';
    var head = Q.news_head || 'The year 1923 begins';
    var sub = Q.news_head ? Q.news_sub : 'The mark is falling and the French stand at the Ruhr. The party meets the year divided.';
    html += '<h1>' + esc(head) + '</h1>' + (sub ? '<p>' + esc(sub) + '</p>' : '');
    var log = (Q.news_log || []).slice(1, 4);
    log.forEach(function(n) {
      html += '<hr><p><span class="rf-date">' + esc(n.d || '') + '</span> ' + esc(n.t || n) + '</p>';
    });
    var world = KPD.worldNews(Q).slice(0, 2);
    if (world.length) {
      html += '<p class="rf-section">Abroad</p>';
      world.forEach(function(w) { html += '<p><span class="rf-date">' + esc(w[0]) + '</span> ' + esc(w[1]) + '</p>'; });
    }
    html += '<hr><p class="rf-foot">Dollar: ' + esc(Q.usd_rate) + ' marks</p>';
    return html;
  };
  KPD.hundreds = function(Q) {
    var n = 0;
    for (var d in KPD.DISTRICTS) { n += Q['d_' + d + '_h'] || 0; }
    return n;
  };

  // ---- Votes ---------------------------------------------------------------------------
  UI.vote = function(Q, id) {
    var V = KPD.VOTES[id];
    if (!V) { return ''; }
    var seats = KPD.voteSeats(Q, id), sides = V.sides(Q), t = KPD.tally(seats, sides, V.need);
    return '<div class="kpanel kvote"><p class="klabel">' + esc(V.house) + ': ' + esc(V.question) + '</p>' +
      '<div class="kpanel-row"><div class="kpanel-chart">' + UI.hemicycle(seats, {sides: sides, label: V.question}) + '</div>' +
      '<div class="kpanel-col">' + UI.seatLegend(seats, sides) +
      '<p><b>' + t.yes + '</b> for, <b>' + t.no + '</b> against, ' + t.abstain + ' abstaining. ' +
      (V.need == 'two_thirds' ? 'Two thirds of those voting: ' : 'A majority: ') + '<b>' + t.need + '</b>.</p></div></div>' +
      (V.note ? '<p class="kdim">' + esc(V.note) + '</p>' : '') + '</div>';
  };

  UI.councils = function(Q) {
    var out = '<div class="kpanel"><p class="klabel">Factory council elections, spring 1923: our share</p><table class="ktable">';
    for (var d in KPD.DISTRICTS) {
      if (d == 'bavaria') { continue; }
      var s = Q['d_' + d + '_council'];
      out += '<tr><td>' + esc(KPD.DISTRICTS[d].name) + '</td><td class="knum">' + s + '%</td><td>' + (s >= 30 ? '<span class="kmet">majority in the big works</span>' : '<span class="kdim">minority</span>') + '</td></tr>';
    }
    return out + '</table><p class="kdim">At 30% or more the councils of a district give us a majority in the big works there (organisation +2).</p></div>';
  };

  // ---- The sidebar tabs, laid out like the base game's ----------------------------------------
  var tip = function(text, title) { return '<span class="tooltip-text" title="' + esc(title) + '">' + text + '</span>'; };
  var line = function(s) { return '<p>' + s + '</p>'; };

  UI.sidebarMain = function(Q) {
    var html = '<h1>Status</h1>' + line(esc(Q.date_label)) +
      line('Resources available: ' + Q.resources) +
      line(tip('Income', 'Every 150 points of organisation in the districts pay one resource a month in dues') + ': ' + KPD.duesEstimate(Q) + ' a month' + (Q.soviet_subsidy ? ', and Moscow\'s subsidy every quarter' : '')) +
      line('KPD position: ' + (Q.kpd_banned ? 'banned' : 'legal opposition') + (Q.y23_saxony ? ', in the Saxon government' : '')) +
      line('Party line: ' + FACTION[Q.party_line][0]) +
      line('Internal dissent: ' + KPD.dissentWord(Q.kf_dissent_percent));
    html += '<h1>Factions</h1>';
    Q.kpd_factions.forEach(function(f) {
      html += line(tip('<span class="faction-word fw-' + f + '">' + FACTION[f][0] + '</span>', FACTION[f][1]) + ' strength: ' + KPD.strengthWord(Q['kf_' + f + '_strength']) +
        ' (' + round(Q['kf_' + f + '_strength']) + '%), dissent: ' + KPD.dissentWord(Q['kf_' + f + '_dissent']));
    });
    html += '<h1>Moscow</h1>' +
      line('Leadership: ' + esc(Q.moscow_leader.replace(/-/g, ', ')) + ', favouring the <span class="faction-word fw-' + Q.moscow_favored + '">' + FACTION[Q.moscow_favored][0] + '</span>') +
      line(tip('Trust', 'Under 50 Moscow writes letters, under 40 it cuts the subsidy, under 30 it writes an open letter, under 15 it sends emissaries') + ': ' + round(Q.comintern_trust));
    if (Q.dir_active) {
      html += line('Directive: ' + esc(Q.dir_target) + ' (' + esc(Q.dir_progress) + '), ' + met(Q.dir_ok) + '. Judged by ' + esc(Q.dir_by) + '.');
    }
    if (Q.oct_show) { html += '<h1>The German October</h1>' + UI.october(Q); }
    html += '<h1>The class</h1>' +
      line('Workers\' mood: ' + esc(KPD.moodWord(Q.mood))) +
      line(tip('United front actions', 'Joint actions with the workers of the SPD, the free unions and the factory councils') + ': ' + Q.y23_unity) +
      line('Strikes led: ' + Q.y23_strikes) +
      line('Organisation in the districts: ' + Object.keys(KPD.DISTRICTS).map(function(d) { return esc(KPD.DISTRICTS[d].short || KPD.DISTRICTS[d].name) + ' ' + round(Q['d_' + d + '_org']); }).join(', '));
    return html;
  };

  var STANCE = {
    spd: 'The largest workers\' party. Its leaders govern with the bourgeoisie; its members are the workers we must win.',
    z: 'The Catholic party of every class, from the Rhineland works to the bishops. Governs with whoever guards the Church.',
    bvp: 'Bavaria\'s Catholic right. Its government shelters the armed leagues.',
    ddp: 'Liberal bankers, professors and officials: the Republic\'s loyal and shrinking middle.',
    dvp: 'The party of heavy industry. Stinnes wants the eight-hour day gone.',
    dnvp: 'Junkers, generals and anti-Semites. Wants the Republic overthrown and the KPD banned.',
    nsdap: 'The völkisch racists: the DVFP in the Reichstag, Hitler\'s NSDAP in Munich. Fascism in its first form.'
  };
  UI.sidebarPolitics = function(Q) {
    var html = '<h1>Government</h1>' +
      line('President: ' + esc(Q.president) + ' (' + UI.partyName('spd') + ')') +
      line('Chancellor: ' + esc(Q.chancellor) + ' (' + (Q.chancellor_party == 'I' ? 'independent' : UI.partyName(String(Q.chancellor_party).toLowerCase())) + ')') +
      line('Reichstag composition (elected June 1920, groups as of 1923):') +
      UI.hemicycle(Q.rt_seats, {label: 'Reichstag'}) + UI.seatLegend(Q.rt_seats) +
      line('Next election: ' + KPD.MONTHS[Q.next_election_month - 1] + ' ' + Q.next_election_year);
    html += '<h1>The parties</h1>';
    ['spd', 'z', 'bvp', 'ddp', 'dvp', 'dnvp', 'nsdap'].forEach(function(p) {
      html += line(UI.partyName(p) + ': ' + esc(KPD.relationWord(Q[p + '_relation'])) + '. <span class="kdim">' + esc(STANCE[p]) + '</span>');
    });
    html += '<h1>The Lands</h1>';
    KPD.LAND_ORDER.forEach(function(l) {
      html += line(esc(KPD.LANDS[l].name) + ': ' + esc(KPD.landGov(Q, l)));
    });
    return html;
  };

  UI.sidebarDefense = function(Q) {
    var html = '<h1>Paramilitaries</h1>' +
      line(tip('Proletarian Hundreds', 'The KPD\'s workers\' defence units of 1923') + ': ' + KPD.hundreds(Q) + ' units formed, about ' + round(Q.rfb_strength) + ' thousand members');
    for (var d in KPD.DISTRICTS) {
      if (Q['d_' + d + '_h'] > 0) { html += line('&nbsp;&nbsp;' + esc(KPD.DISTRICTS[d].name) + ': ' + Q['d_' + d + '_h'] + ' units'); }
    }
    html += line(tip('Bavarian leagues', 'Bund Oberland, Reichsflagge, the SA and the other armed leagues') + ': arming openly under the Bavarian government') +
      line(tip('Black Reichswehr', 'Illegal reserve units hidden inside the army') + ': in the barracks of Prussia, out of sight') +
      '<h1>Official military</h1>' +
      line('Reichswehr: 100 thousand troops, the limit set at Versailles') +
      line('Prussian police: the strongest force in Germany, under the Social Democrat Severing');
    return html;
  };

  UI.sidebarPolls = function(Q) {
    var order = ['kpd', 'spd', 'z', 'ddp', 'dvp', 'dnvp', 'nsdap', 'other'];
    var html = '<h1>Projected election results</h1>' + line('(if the election were to be held now):');
    order.forEach(function(p) { html += line(UI.partyName(p) + ': ' + (Q[p + '_votes'] || 0) + '%'); });
    html += line('<b>Detailed results for each demographic</b>');
    var names = {workers: 'Workers', unemployed: 'Unemployed', new_middle: 'New Middle Class', old_middle: 'Old Middle Class', rural: 'Rural', catholics: 'Catholics'};
    Q.classes.forEach(function(c) {
      html += line(names[c] + ': ' + order.map(function(p) { return UI.partyName(p) + ' ' + (Q[c + '_' + p + '_display'] || 0) + '%'; }).join(', '));
    });
    return html + line('<span class="kdim">Z includes the BVP.</span>');
  };

  // ---- Filling the placeholders -----------------------------------------------------------
  UI.renderInserts = function(root) {
    var Q = Qnow();
    var els = (root || document).querySelectorAll('.kpd-insert');
    Array.prototype.forEach.call(els, function(el) {
      var kind = el.getAttribute('data-insert'), arg = el.getAttribute('data-arg');
      var html = '';
      try {
        if (kind == 'map') { html = UI.map(Q); }
        else if (kind == 'land') { html = UI.land(Q, arg); }
        else if (kind == 'district') { html = UI.district(Q, arg); }
        else if (kind == 'news') { html = UI.news(Q); }
        else if (kind == 'vote') { html = UI.vote(Q, arg); }
        else if (kind == 'councils') { html = UI.councils(Q); }
        else if (kind == 'october') { html = '<div class="kpanel"><p class="klabel">The German October</p>' + UI.october(Q) + '</div>'; }
        else if (kind == 'sb_main') { html = UI.sidebarMain(Q); }
        else if (kind == 'sb_politics') { html = UI.sidebarPolitics(Q); }
        else if (kind == 'sb_defense') { html = UI.sidebarDefense(Q); }
        else if (kind == 'sb_polls') { html = UI.sidebarPolls(Q); }
      } catch (e) { html = '<p class="kdim">(' + esc(e.message) + ')</p>'; console.error(e); }
      el.innerHTML = html;
      el.classList.remove('kpd-insert');
      el.classList.add('kpd-filled');
    });
  };
}());
