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
  UI.bar = function(value, max, cls, marks) {
    var w = Math.max(0, Math.min(100, 100 * value / max));
    var m = (marks || []).map(function(x) {
      return '<span class="kbar-mark" style="left:' + (100 * x / max) + '%"></span>';
    }).join('');
    return '<span class="kbar ' + (cls || '') + '"><span class="kbar-fill" style="width:' + w + '%"></span>' + m + '</span>';
  };
  UI.tick = function(ok) { return ok ? '<span class="ktick ok">&#10003;</span>' : '<span class="ktick">&#9675;</span>'; };
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
      html += '<p class="klabel">Party districts in ' + esc(L.name) + '</p><table class="ktable kdistricts">';
      L.districts.forEach(function(d) {
        html += '<tr><td><b>' + esc(KPD.DISTRICTS[d].name) + '</b></td><td>' + UI.bar(Q['d_' + d + '_org'], 100, 'kbar-org') +
          ' ' + round(Q['d_' + d + '_org']) + '</td><td class="kdim">' + esc(KPD.pressureWord(Q['d_' + d + '_pres'])) + '</td></tr>';
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
      '<table class="ktable">' +
      '<tr><td>Organisation</td><td>' + UI.bar(org, 100, 'kbar-org', [25, 55]) + '</td><td class="knum">' + round(org) + '</td><td class="kdim">' + esc(KPD.orgWord(org)) + '</td></tr>' +
      '<tr><td>Pressure</td><td>' + UI.bar(pres, 100, 'kbar-pres', [60, 80]) + '</td><td></td><td class="kdim">' + esc(KPD.pressureWord(pres)) + '</td></tr>' +
      '<tr><td>Hundreds</td><td colspan="3">' + (Q['d_' + d + '_h'] || 0) + ' units</td></tr>' +
      '<tr><td>Joint actions</td><td colspan="3">' + (Q['d_' + d + '_front'] || 0) + ' here, ' + Q.y23_unity + ' in all</td></tr>' +
      (Q['d_' + d + '_council'] ? '<tr><td>Factory councils</td><td colspan="3">' + Q['d_' + d + '_council'] + '% of the vote</td></tr>' : '') +
      '</table><p class="kdim">' + esc(D.note) + ' Pressure over 60 costs organisation every month; over 80 it costs more.</p></div>';
  };

  // ---- The front page ------------------------------------------------------------------
  UI.coming = function(Q) {
    var items = [];
    if (Q.dir_active) { items.push(['Moscow judges the directive', Q.dir_due_label + ' ' + Q.year]); }
    if (Q.year == 1923 && Q.month <= 3 && !Q.y23_councils_done) { items.push(['Factory council elections', 'March 1923']); }
    if (Q.oct_show) { items.push(['The Chemnitz conference', 'October 1923']); }
    items.push(['Reichstag election', KPD.MONTHS[Q.next_election_month - 1] + ' ' + Q.next_election_year]);
    if (Q.year == 1923) { items.push(['End of the first act', 'January 1924']); }
    return items.map(function(i) { return '<li><span>' + esc(i[0]) + '</span><span class="kdim">' + esc(i[1]) + '</span></li>'; }).join('');
  };

  UI.october = function(Q) {
    return '<h4>The German October</h4><p class="kdim">The Chemnitz call can hold if:</p><ul class="kchecks">' +
      '<li>' + UI.tick(Q.oct_c1) + 'Saxony at organisation 60 <span class="kdim">(' + round(Q.d_saxony_org) + ')</span></li>' +
      '<li>' + UI.tick(Q.oct_c2) + 'Six joint actions with the SPD workers <span class="kdim">(' + Q.y23_unity + ')</span></li>' +
      '<li>' + UI.tick(Q.oct_c3) + 'One more district at 55: Central Germany, Thuringia or Berlin' +
      (Q.oct_c3 ? ' <span class="kdim">(' + esc(Q.oct_second) + ')</span>' : '') + '</li></ul>';
  };

  UI.front = function(Q) {
    var head = Q.news_head || 'The Ruhr is occupied; the mark is falling';
    var sub = Q.news_sub || 'The party meets the year with its factions divided and the workers waiting.';
    var html = '<div class="paper">' +
      '<div class="paper-top"><span>' + esc(Q.date_label) + '</span><span>Zentralorgan der KPD</span><span>Dollar: ' + esc(Q.usd_rate) + ' marks</span></div>' +
      '<div class="paper-mast">Die Rote Fahne</div>' +
      '<div class="paper-head">' + esc(head) + '</div>' +
      '<div class="paper-deck">' + esc(sub) + '</div>' +
      '<div class="paper-cols">';
    html += '<div class="paper-col"><h4>Moscow\'s directive</h4>' + (Q.dir_active ?
      '<p class="paper-quote">' + esc(Q.dir_text) + '</p><p>' + UI.tick(Q.dir_ok) + esc(Q.dir_target) + '</p><p class="kdim">Now: ' + esc(Q.dir_progress) + '. Judged by ' + esc(Q.dir_by) + '.</p>' :
      '<p class="kdim">No directive is waiting this year.</p>') + '</div>';
    html += '<div class="paper-col"><h4>Coming up</h4><ul class="paper-list">' + UI.coming(Q) + '</ul></div>';
    html += '<div class="paper-col">' + (Q.oct_show ? UI.october(Q) :
      '<h4>In the districts</h4><p>The workers\' mood is <b>' + esc(KPD.moodWord(Q.mood)) + '</b>.</p><p>Joint actions with the SPD workers: <b>' + Q.y23_unity + '</b>. Hundreds: <b>' + KPD.hundreds(Q) + '</b> units.</p>' +
      (Q.last_action ? '<p class="kdim">Last turn: ' + esc(Q.last_action) + '.</p>' : '')) + '</div>';
    html += '</div>';
    if (Q.news_log && Q.news_log.length > 1) {
      html += '<div class="paper-also"><b>Earlier:</b> ' + Q.news_log.slice(1, 4).map(function(n) { return esc(n); }).join(' · ') + '</div>';
    }
    return html + '</div>';
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
      out += '<tr><td>' + esc(KPD.DISTRICTS[d].name) + '</td><td>' + UI.bar(s, 60, 'kbar-org', [30]) + '</td><td class="knum">' + s + '%</td><td>' + UI.tick(s >= 30) + '</td></tr>';
    }
    return out + '</table><p class="kdim">At 30% or more the councils of a district give us a majority in the big works there (organisation +2).</p></div>';
  };

  // ---- The sidebar ----------------------------------------------------------------------
  UI.sidebarParty = function(Q) {
    var html = '<div class="ksb">';
    html += '<p class="ksb-date">' + esc(Q.date_label) + '</p>';
    html += '<div class="ksb-res"><span title="Resources: money and full-timers">&#9733; ' + Q.resources + ' resources</span>' +
      '<span class="kdim" title="Every month, from the members\' dues in the districts; every 150 points of organisation pay one">+' + KPD.duesEstimate(Q) + ' a month from dues' + (Q.soviet_subsidy ? ', +1 a quarter from Moscow' : '') + '</span></div>';
    // factions
    html += '<h3>The party</h3><div class="kstack">';
    Q.kpd_factions.forEach(function(f) {
      html += '<span class="kstack-seg f-' + f + '" style="width:' + Q['kf_' + f + '_strength'].toFixed(1) + '%" title="' + FACTION[f][0] + ': ' + round(Q['kf_' + f + '_strength']) + '%"></span>';
    });
    html += '</div><table class="ktable ksb-fac">';
    Q.kpd_factions.forEach(function(f) {
      var dis = Q['kf_' + f + '_dissent'];
      html += '<tr title="' + esc(FACTION[f][1]) + '"><td><span class="faction-word fw-' + f + '">' + FACTION[f][0] + '</span>' + (Q.party_line == f ? ' <span class="kchip">line</span>' : '') +
        '</td><td class="knum">' + round(Q['kf_' + f + '_strength']) + '%</td><td>' + UI.bar(dis, 50, 'kbar-dis', [30]) + '</td></tr>';
    });
    html += '</table><p class="kdim ksb-small">Bars: dissent. At 30 a faction makes a demand.</p>';
    // Moscow
    html += '<h3>Moscow</h3><p>' + esc(Q.moscow_leader.replace(/-/g, ', ')) + ' <span class="kdim">favour the</span> <span class="faction-word fw-' + Q.moscow_favored + '">' + FACTION[Q.moscow_favored][0] + '</span></p>' +
      '<p>Trust ' + UI.bar(Q.comintern_trust, 100, 'kbar-trust', [15, 30, 40, 50]) + ' <b>' + round(Q.comintern_trust) + '</b></p>' +
      (Q.dir_active ? '<p class="ksb-small">' + UI.tick(Q.dir_ok) + 'Directive: ' + esc(Q.dir_target) + ' <span class="kdim">(' + esc(Q.dir_progress) + ')</span></p>' : '');
    // the class
    html += '<h3>The class</h3><table class="ktable">' +
      '<tr><td>Joint actions with SPD workers</td><td class="knum">' + Q.y23_unity + '</td></tr>' +
      '<tr><td>Strikes led</td><td class="knum">' + Q.y23_strikes + '</td></tr>' +
      '<tr><td>Hundreds (units)</td><td class="knum">' + KPD.hundreds(Q) + '</td></tr>' +
      '<tr><td>Mood in the works</td><td class="knum">' + esc(KPD.moodWord(Q.mood)) + '</td></tr>' +
      '<tr><td>KPD if the Reich voted now</td><td class="knum">' + Q.kpd_votes + '%</td></tr></table>';
    if (Q.oct_show) { html += '<div class="ksb-oct">' + UI.october(Q) + '</div>'; }
    return html + '</div>';
  };

  UI.sidebarReich = function(Q) {
    return '<div class="ksb"><h3>The Reich</h3><table class="ktable">' +
      '<tr><td>President</td><td>' + esc(Q.president) + ' <span class="kdim">(SPD)</span></td></tr>' +
      '<tr><td>Chancellor</td><td>' + esc(Q.chancellor) + '</td></tr>' +
      '<tr><td>Dollar</td><td>' + esc(Q.usd_rate) + ' marks</td></tr>' +
      '<tr><td>Next election</td><td>' + KPD.MONTHS[Q.next_election_month - 1] + ' ' + Q.next_election_year + '</td></tr></table>' +
      '<h3>Reichstag</h3><p class="kdim ksb-small">Elected June 1920; groups as of 1923, approximate.</p>' +
      UI.hemicycle(Q.rt_seats, {label: 'Reichstag'}) + UI.seatLegend(Q.rt_seats) + '</div>';
  };

  UI.sidebarForces = function(Q) {
    var rows = '';
    for (var d in KPD.DISTRICTS) {
      if (Q['d_' + d + '_h'] > 0) { rows += '<tr><td>' + esc(KPD.DISTRICTS[d].name) + '</td><td class="knum">' + Q['d_' + d + '_h'] + '</td></tr>'; }
    }
    return '<div class="ksb"><h3>Our forces</h3><p>The Proletarian Hundreds: <b>' + KPD.hundreds(Q) + '</b> units formed.</p>' +
      (rows ? '<table class="ktable">' + rows + '</table>' : '<p class="kdim">No units formed yet. Form them in the Lands.</p>') +
      '<h3>The state and its allies</h3><table class="ktable">' +
      '<tr><td>Reichswehr</td><td>100,000 men, the limit set at Versailles, and the Black Reichswehr besides</td></tr>' +
      '<tr><td>Prussian police</td><td>The strongest in Germany, under the Social Democrat Severing</td></tr>' +
      '<tr><td>Bavarian leagues</td><td>Arming openly under the protection of the Bavarian government</td></tr>' +
      '</table></div>';
  };

  UI.sidebarPolls = function(Q) {
    var order = ['kpd', 'spd', 'z', 'ddp', 'dvp', 'dnvp', 'nsdap', 'other'], max = 0;
    order.forEach(function(p) { max = Math.max(max, Q[p + '_votes'] || 0); });
    var html = '<div class="ksb"><h3>If the Reich voted now</h3><table class="ktable kpoll">';
    order.forEach(function(p) {
      var v = Q[p + '_votes'] || 0;
      html += '<tr><td><span class="kswatch bgf-' + p + '"></span>' + UI.partyName(p) + '</td><td class="kpoll-bar"><span class="kpoll-fill bgf-' + p + '" style="width:' + (max ? 100 * v / max : 0).toFixed(1) + '%"></span></td><td class="knum">' + v + '%</td></tr>';
    });
    html += '</table><p class="kdim ksb-small">The last Reichstag election was in June 1920; the next is due by 1924. Z includes the BVP.</p>';
    var names = {workers: 'Workers', unemployed: 'Unemployed', new_middle: 'White-collar', old_middle: 'Small proprietors', rural: 'Rural', catholics: 'Catholics'};
    html += '<h3>Our vote by class</h3><table class="ktable"><tr class="kdim"><td></td><td class="knum">KPD</td><td class="knum">SPD</td></tr>';
    Q.classes.forEach(function(c) {
      html += '<tr><td>' + names[c] + '</td><td class="knum"><b>' + (Q[c + '_kpd_display'] || 0) + '%</b></td><td class="knum">' + (Q[c + '_spd_display'] || 0) + '%</td></tr>';
    });
    return html + '</table></div>';
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
        else if (kind == 'front') { html = UI.front(Q); }
        else if (kind == 'vote') { html = UI.vote(Q, arg); }
        else if (kind == 'councils') { html = UI.councils(Q); }
        else if (kind == 'october') { html = '<div class="kpanel">' + UI.october(Q) + '</div>'; }
        else if (kind == 'sb_party') { html = UI.sidebarParty(Q); }
        else if (kind == 'sb_reich') { html = UI.sidebarReich(Q); }
        else if (kind == 'sb_forces') { html = UI.sidebarForces(Q); }
        else if (kind == 'sb_polls') { html = UI.sidebarPolls(Q); }
      } catch (e) { html = '<p class="kdim">(' + esc(e.message) + ')</p>'; console.error(e); }
      el.innerHTML = html;
      el.classList.remove('kpd-insert');
      el.classList.add('kpd-filled');
    });
  };
}());
