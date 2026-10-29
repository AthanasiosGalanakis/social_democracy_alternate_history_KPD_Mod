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
          '<title>' + esc(D.name + (prussian ? ' (Prussia)' : '') + ': organisation ' + KPD.orgWord(org) + ', ' + KPD.pressureWord(Q['d_' + d + '_pres'])) + '</title>' +
          (prussian ? '<circle cx="' + cx + '" cy="' + cy + '" r="63" class="kmap-ring"/>' : '') +
          '<circle cx="' + cx + '" cy="' + cy + '" r="57" fill="' + UI.orgColour(org) + '" class="kmap-disc"/>' +
          '<text x="' + cx + '" y="' + (cy - 4) + '" class="kmap-name">' + esc(D.short || D.name.replace('Rhine and ', '').replace('Central Germany', 'Central')) + '</text>' +
          '<text x="' + cx + '" y="' + (cy + 22) + '" class="kmap-org">' + esc(KPD.orgWord(org)) + '</text>' +
          (Q['d_' + d + '_pres'] >= 40 ? '<text x="' + cx + '" y="' + (cy + 88) + '" class="kmap-pres">' + esc(KPD.pressureWord(Q['d_' + d + '_pres'])) + '</text>' : '') +
          (Q['d_' + d + '_h'] > 0 ? '<text x="' + (cx + 42) + '" y="' + (cy - 40) + '" class="kmap-badge">H</text>' : '') +
          '</a>';
      });
    });
    svg += '</svg>';
    var legend = '<div class="kmap-legend"><span class="kmap-key"><span class="kswatch" style="background:' + UI.orgColour(15) + '"></span>' +
      '<span class="kswatch" style="background:' + UI.orgColour(45) + '"></span><span class="kswatch" style="background:' + UI.orgColour(75) + '"></span> darker means a stronger organisation</span>' +
      '<span class="kmap-key"><span class="kmap-key-ring"></span> districts of Prussia</span>' +
      '<span class="kmap-key"><b>H</b> the Proletarian Hundreds have formed here</span><span class="kmap-key"><i>Words under a district: police pressure</i></span></div>';
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
        html += '<tr><td><b>' + esc(KPD.DISTRICTS[d].name) + '</b></td><td>organisation ' + esc(KPD.orgWord(Q['d_' + d + '_org'])) +
          '</td><td class="kdim">' + esc(KPD.pressureWord(Q['d_' + d + '_pres'])) + '</td></tr>';
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
      '<p>Organisation: <b>' + esc(KPD.orgWord(org)) + '</b><br>' +
      'Pressure from the state: <b>' + esc(KPD.pressureWord(pres)) + '</b><br>' +
      'Proletarian Hundreds: ' + esc(KPD.unitsWord(Q['d_' + d + '_h'] || 0)) +
      (Q['d_' + d + '_council'] ? '<br>Factory councils: ' + esc(UI.councilWord(Q['d_' + d + '_council'])) : '') + '</p>' +
      '<p class="kdim">' + esc(D.note) + ' Heavy pressure costs organisation every month.</p></div>';
  };

  UI.councilWord = function(s) {
    return s >= 30 ? 'we lead the big works' : s >= 20 ? 'a strong minority' : s >= 10 ? 'a minority' : 'hardly present';
  };
  var met = function(ok) { return ok ? '<span class="kmet">met</span>' : '<span class="kdim">not yet</span>'; };

  UI.october = function(Q) {
    return '<p>The Chemnitz call can hold if:</p><ul class="kchecks">' +
      '<li>The party in Saxony is strong (now ' + esc(KPD.orgWord(Q.d_saxony_org)) + '): ' + met(Q.oct_c1) + '</li>' +
      '<li>The united front is broad (now ' + esc(KPD.unityWord(Q.y23_unity)) + '): ' + met(Q.oct_c2) + '</li>' +
      '<li>A second district is strong: Central Germany, Thuringia or Berlin: ' + met(Q.oct_c3) +
      (Q.oct_c3 ? ' (' + esc(Q.oct_second) + ')' : '') + '</li></ul>';
  };

  // ---- The party paper, in its own column on the right -------------------------------------
  UI.news = function(Q) {
    var html = '<div class="rf-mast">Die Rote Fahne</div>' + '<p class="rf-sub">' + esc(Q.date_label) + '</p>';
    var head = Q.news_head || 'The year 1923 begins';
    var sub = Q.news_head ? Q.news_sub : 'The mark is falling and the French stand at the Ruhr. The party meets the year divided.';
    html += '<p class="rf-lead"><b>' + esc(head) + '.</b> ' + (sub ? esc(sub) : '') + '</p>';
    var log = (Q.news_log || []).slice(1, 4);
    log.forEach(function(n) {
      html += '<hr><p><span class="rf-date">' + esc(n.d || '') + '</span> ' + esc(n.t || n) + '</p>';
    });
    var world = KPD.worldNews(Q).slice(0, 2);
    if (world.length) {
      html += '<hr>';
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
      out += '<tr><td>' + esc(KPD.DISTRICTS[d].name) + '</td><td>' + (s >= 30 ? '<span class="kmet">' + esc(UI.councilWord(s)) + '</span>' : '<span class="kdim">' + esc(UI.councilWord(s)) + '</span>') + '</td></tr>';
    }
    return out + '</table><p class="kdim">Where we lead the councils of the big works, the party grows there.</p></div>';
  };

  // ---- The sidebar tabs, laid out like the base game's ----------------------------------------
  // ---- Hover cards -----------------------------------------------------------------
  // Anything with data-hov="kind:key" (or plain data-tip text) opens one floating box, kept
  // inside the window, as in Die Rote Fahne. Works with the mouse, with focus and with a tap.
  var line = function(s) { return '<p>' + s + '</p>'; };
  var hov = UI.hov = function(label, key, cls) {
    return '<span class="khov' + (cls ? ' ' + cls : '') + '" tabindex="0" data-hov="' + esc(key) + '">' + label + '</span>';
  };
  var tip = function(text, title) { return '<span class="khov" tabindex="0" data-tip="' + esc(title) + '">' + text + '</span>'; };
  var pname = function(p) { return (PARTY[p] || [p])[0]; };
  var pspan = function(p, text) { return '<span class="party p-' + (p == 'z' ? 'zentrum' : p) + '">' + (text || esc(pname(p))) + '</span>'; };
  UI.partyName = function(p) { return hov(pspan(p), 'party:' + p); };

  // colour scales: level 0 is good for us (green), 4 is bad (dark red), after the DDP mod
  var sc = function(word, level) { return '<span class="ksc ksc-' + Math.max(0, Math.min(4, level)) + '">' + esc(word) + '</span>'; };
  var lvl = function(x, cuts) { var i = 0; while (i < cuts.length && x >= cuts[i]) { i++; } return i; };
  var fword = function(f, text) { return '<span class="faction-word fw-' + f + '">' + (text || FACTION[f][0]) + '</span>'; };

  var LEADER = {
    kpd: 'brandler', spd: 'wels', ddp: 'petersen', z: 'marx', bvp: 'speck', dvp: 'stresemann', dnvp: 'hergt', nsdap: 'graefe'
  };
  var IDEOLOGY = {
    kpd: ['Communism', 'Power to the working class through workers\' councils and a dictatorship of the proletariat. A section of the Communist International.'],
    spd: ['Social democracy', 'Socialism by the ballot and by reform. In practice: coalitions with the bourgeoisie and the defence of the Republic as it stands, generals and judges included.'],
    ddp: ['Social liberalism', 'Parliamentary democracy, free trade and the Weimar constitution, which its own Hugo Preuss drafted. A party of officials, professors and Jewish and liberal businessmen, losing voters every year.'],
    z: ['Political Catholicism', 'The defence of the Church, its schools and its unions, across every class. Will govern with the SPD or the DNVP, whichever the bishops can live with.'],
    bvp: ['Bavarian Catholic conservatism', 'Federalism, the Church and order in Bavaria. Broke with the Centre in 1920; its governments in Munich shelter the armed leagues.'],
    dvp: ['National liberalism', 'The party of heavy industry and the export trade: free enterprise, the end of the eight-hour day and a cautious peace with the Republic.'],
    dnvp: ['National conservatism', 'The monarchy, the Junker estates, the officer corps and anti-Semitism. Wants Versailles torn up and the Republic overthrown.'],
    nsdap: ['Völkisch nationalism', 'Race hatred, the "stab in the back" and the armed street league: fascism in its first German form. The DVFP sits in the Reichstag; Hitler\'s NSDAP marches in Munich.'],
    other: ['Various', 'Regional, agrarian and single-issue groups.']
  };
  // People: [name, years, party, faction or '', text]. No portraits yet: we only use fully free
  // pictures, and we have none of these men; the hover card draws initials instead.
  var PEOPLE = {
    brandler: ['Heinrich Brandler', 'born 1881', 'kpd', 'right', 'Bricklayer from Bohemia and union organiser in Chemnitz. Chairman in 1921 during the March Action and jailed for it; back from the Comintern Executive in Moscow in August 1922 and chairman again since. Practical and patient: he believes in the united front and doubts that the party is ready for power.'],
    meyer: ['Ernst Meyer', 'born 1887', 'kpd', 'right', 'Spartacist from the first day, journalist and former editor of Die Rote Fahne. Chairman from August 1921 to August 1922, when Moscow returned the post to Brandler. He steered the party back to the united front after the March Action.'],
    ebert: ['Friedrich Ebert', 'born 1871', 'spd', '', 'Saddler, party secretary, Reich President since 1919. He made the pact with the generals in November 1918 and let the Freikorps drown the revolution. Rules now by emergency decree under Article 48.'],
    cuno: ['Wilhelm Cuno', 'born 1876', 'other', '', 'Director-general of the Hapag shipping line, without a party but close to the DVP. Answers the occupation of the Ruhr with passive resistance, paid for by printing money.'],
    stresemann: ['Gustav Stresemann', 'born 1878', 'dvp', '', 'Chairman of the DVP. An annexationist in the war, a "republican by reason" since. Speaks for industry that has learned it can rule through the Republic.'],
    marx: ['Wilhelm Marx', 'born 1863', 'z', '', 'Judge from Cologne and chairman of the Centre Party. A careful Catholic who will serve any coalition that leaves the Church its schools.'],
    wels: ['Otto Wels', 'born 1873', 'spd', '', 'One of the SPD\'s chairmen, with Hermann Müller and Arthur Crispien. Commanded Berlin for the government in December 1918. The apparatus man of German social democracy.'],
    petersen: ['Carl Petersen', 'born 1868', 'ddp', '', 'Hamburg lawyer and senator, chairman of the DDP. Liberal, patrician and loyal to every coalition the DDP can still find.'],
    hergt: ['Oskar Hergt', 'born 1869', 'dnvp', '', 'Former Prussian finance minister of the Kaiser, chairman of the DNVP. Leads a party of Junkers and generals that waits for the Republic to fall.'],
    speck: ['Karl Speck', 'born 1862', 'bvp', '', 'From Speyer. A Centre deputy in the Reichstag from 1898 to 1914, president of the BVP since it broke away in 1918. His party governs Bavaria and shelters the armed leagues.'],
    graefe: ['Albrecht von Graefe', 'born 1868', 'nsdap', '', 'Mecklenburg landowner who left the DNVP in 1922 to found the German Völkisch Freedom Party with Wulle and Henning. In Munich, Hitler leads the NSDAP.'],
    seeckt: ['Hans von Seeckt', 'born 1866', 'other', '', 'Chief of the Army Command. Keeps the Reichswehr "above politics", which means loyal to itself: it marches against the Left and will not march against the Right.'],
    severing: ['Carl Severing', 'born 1875', 'spd', '', 'Social Democratic interior minister of Prussia. Commands the strongest police in Germany and uses it against the Hundreds as readily as against the völkisch leagues.']
  };
  var FACTION_INFO = {
    right: ['Brandler, Thalheimer, Walcher', 'Saxony, Thuringia, Württemberg', 'United front from above and below: joint action with the SPD\'s leaders where possible, workers\' governments with the left Social Democrats, patient work in the free unions. Meyer, Zetkin, Pieck and Eberlein stand with this majority.'],
    centre: ['Meyer, Zetkin, Pieck, Eberlein', 'the apparatus, scattered', 'United front, with sharper criticism of the SPD leaders. Holds the Zentrale together between Right and Left.'],
    left: ['Fischer, Maslow, Thälmann, Scholem', 'Berlin, Hamburg, the Ruhr', 'United front from below only: no deals with the SPD leaders, workers\' government as a slogan for agitation, strike towards the seizure of power.']
  };
  var TACTIC = {right: 'united front from above, free unions', centre: 'united front, sharp with the SPD', left: 'united front from below only'};

  var portrait = function(id) {
    var p = PEOPLE[id], ini = p[0].split(' ').filter(function(w) { return w != 'von'; }).map(function(w) { return w[0]; });
    var cls = p[3] ? 'kport-f-' + p[3] : 'kport-p-' + p[2];
    return '<div class="kport ' + cls + '">' + esc(ini[0] + ini[ini.length - 1]) + '</div>';
  };
  var last = function(id) { return PEOPLE[id][0].split(' ').slice(-1)[0]; };
  UI.person = function(id) { var p = PEOPLE[id]; return hov(p[3] ? fword(p[3], esc(last(id))) : esc(last(id)), 'person:' + id); };

  UI.hoverHTML = function(key, Q) {
    var k = key.split(':'), kind = k[0], id = k[1];
    var head = function(title, sub) { return '<div class="khv-title">' + title + '</div>' + (sub ? '<div class="khv-sub">' + sub + '</div>' : ''); };
    var row = function(a, b) { return '<div class="khv-row"><span>' + a + '</span><b>' + b + '</b></div>'; };
    var seats = Q.rt_seats || {}, total = 0, p;
    for (p in seats) { total += seats[p]; }
    if (kind == 'person') {
      var pp = PEOPLE[id];
      return '<div class="khv-head">' + portrait(id) + '<div>' + head(esc(pp[0]), esc(pp[1]) + ' · ' + pspan(pp[2]) + (pp[3] ? ', ' + fword(pp[3]) : '')) + '</div></div>' +
        '<div class="khv-body">' + esc(pp[4]) + '</div>';
    }
    if (kind == 'party') {
      var cab = KPD.cabinet(Q), role = cab.parties.indexOf(id) >= 0 ? 'in government' : cab.tolerated.indexOf(id) >= 0 ? 'tolerates the cabinet' : 'opposition';
      if (id == 'kpd' && Q.kpd_banned) { role = 'banned'; }
      return head(pspan(id, esc(PARTY[id][1])), esc(PARTY[id][0])) + '<div class="khv-body">' +
        (LEADER[id] ? row('Leader', esc(PEOPLE[LEADER[id]][0])) : '') +
        (IDEOLOGY[id] ? row('Ideology', esc(IDEOLOGY[id][0])) : '') +
        (seats[id] ? row('Reichstag', seats[id] + ' seats, ' + (100 * seats[id] / total).toFixed(1) + '%') : '') +
        row('Position', role) +
        (STANCE[id] ? '<p>' + esc(STANCE[id]) + '</p>' : '') + '</div>';
    }
    if (kind == 'ideology') { return head(esc(IDEOLOGY[id][0]), pspan(id)) + '<div class="khv-body">' + esc(IDEOLOGY[id][1]) + '</div>'; }
    if (kind == 'cabinet') {
      var c = KPD.cabinet(Q), n = 0;
      c.parties.forEach(function(q) { n += seats[q] || 0; });
      var need = Math.floor(total / 2) + 1;
      return head(esc(c.name), esc(c.since)) + '<div class="khv-body">' +
        row('Parties', c.parties.map(function(q) { return pspan(q); }).join(', ') + (c.experts ? ' and experts' : '')) +
        row('Seats', n + ' of ' + total) +
        row('Majority', n >= need ? sc('majority of ' + (2 * n - total), 0) : sc('minority, ' + (need - n) + ' short', 3)) +
        (c.tolerated.length ? row('Tolerated by', c.tolerated.map(function(q) { return pspan(q); }).join(', ')) : '') +
        '<p>' + esc(c.note) + '</p></div>';
    }
    if (kind == 'faction') {
      var fi = FACTION_INFO[id];
      return head(fword(id, esc(FACTION[id][0])), esc(fi[0])) + '<div class="khv-body">' + row('Strongholds', esc(fi[1])) + '<p>' + esc(fi[2]) + '</p></div>';
    }
    if (kind == 'force') {
      var fo = UI.forces(Q).filter(function(x) { return x.id == id; })[0];
      return head(fo.party ? pspan(fo.party, esc(fo.name)) : esc(fo.name), esc(fo.sub)) + '<div class="khv-body">' + esc(fo.text) + '</div>';
    }
    if (kind == 'organ') {
      var o = UI.organs(Q).filter(function(x) { return x.id == id; })[0];
      return head(esc(o.name), esc(o.sub)) + '<div class="khv-body">' + esc(o.text) + '</div>';
    }
    return '';
  };

  UI.initHover = function() {
    if (UI.hoverReady) { return; }
    UI.hoverReady = true;
    var box = document.createElement('div');
    box.id = 'kpd-hov';
    box.setAttribute('role', 'tooltip');
    document.body.appendChild(box);
    var cur = null;
    var show = function(el) {
      var html = el.hasAttribute('data-hov') ? UI.hoverHTML(el.getAttribute('data-hov'), Qnow()) : '<div class="khv-body">' + esc(el.getAttribute('data-tip')) + '</div>';
      if (!html) { return; }
      cur = el;
      box.innerHTML = html;
      box.style.display = 'block';
      var r = el.getBoundingClientRect(), w = box.offsetWidth, h = box.offsetHeight;
      var x = r.right + 10 + w < window.innerWidth ? r.right + 10 : Math.max(8, r.left - 10 - w);
      if (x + w > window.innerWidth - 8) { x = Math.max(8, window.innerWidth - 8 - w); }
      var y = Math.min(Math.max(8, r.top - 6), window.innerHeight - 8 - h);
      box.style.left = x + 'px';
      box.style.top = Math.max(8, y) + 'px';
    };
    var hide = function() { cur = null; box.style.display = 'none'; };
    var find = function(t) { return t && t.closest ? t.closest('[data-hov], [data-tip]') : null; };
    document.addEventListener('mouseover', function(e) { var el = find(e.target); if (el && el !== cur) { show(el); } else if (!el && cur) { hide(); } });
    document.addEventListener('focusin', function(e) { var el = find(e.target); if (el) { show(el); } });
    document.addEventListener('focusout', hide);
    document.addEventListener('click', function(e) { var el = find(e.target); if (el && el !== cur) { show(el); } else if (!el) { hide(); } });
    window.addEventListener('scroll', hide, true);
  };

  // ---- The government ---------------------------------------------------------------
  var STANCE = {
    kpd: 'The party of the revolutionary working class, and ours. Strong in the factories of Saxony, Berlin, Hamburg and the Ruhr.',
    spd: 'The largest workers\' party. Its leaders govern with the bourgeoisie; its members are the workers we must win.',
    z: 'The Catholic party of every class, from the Rhineland works to the bishops. Governs with whoever guards the Church.',
    bvp: 'Bavaria\'s Catholic right. Its government shelters the armed leagues.',
    ddp: 'Liberal bankers, professors and officials: the Republic\'s loyal and shrinking middle.',
    dvp: 'The party of heavy industry. Stinnes wants the eight-hour day gone.',
    dnvp: 'Junkers, generals and anti-Semites. Wants the Republic overthrown and the KPD banned.',
    nsdap: 'The völkisch racists: the DVFP in the Reichstag, Hitler\'s NSDAP in Munich. Fascism in its first form.',
    other: 'Regional lists, the Bavarian Peasants\' League and others.'
  };
  var CHANCELLOR = {Cuno: 'cuno', Stresemann: 'stresemann', Marx: 'marx'};
  var LEFT_RIGHT = ['kpd', 'spd', 'ddp', 'z', 'bvp', 'agr', 'dvp', 'dnvp', 'nsdap', 'other'];

  UI.sidebarMain = function(Q) {
    var lead = Q.party_line || 'right';
    var pos = Q.kpd_banned ? 'banned' : Q.y23_saxony ? 'in the Saxon government' : 'legal opposition';
    var html = '<h1>Status</h1>' + line(esc(Q.date_label)) +
      line('Resources: ' + Q.resources) +
      line(hov(pspan('kpd', '<span class="p-kpd-lead fw-' + lead + '">KPD</span>'), 'party:kpd') + ' position: ' + esc(pos)) +
      line('Chairman: ' + UI.person(KPD.chair(Q)));
    var cab = KPD.cabinet(Q), ch = CHANCELLOR[Q.chancellor];
    var cp = String(Q.chancellor_party).toLowerCase();
    html += '<h1>Government</h1>' +
      line('President: ' + UI.person('ebert') + ' (' + UI.partyName('spd') + ')') +
      line('Chancellor: ' + (ch ? UI.person(ch) : esc(Q.chancellor)) + ' (' +
        (cp == 'i' ? tip('<b>I</b>', 'Independent: belongs to no party') : UI.partyName(cp)) + ')') +
      line('Cabinet: ' + hov(esc(cab.short), 'cabinet:now'));
    html += '<h1>Reichstag composition</h1>' + UI.seatList(Q.rt_seats) +
      line('<span class="kdim">Elected June 1920.</span>') + line('<span class="kdim">Next election: ' + KPD.MONTHS[Q.next_election_month - 1] + ' ' + Q.next_election_year + '</span>');
    html += '<h1>Economy</h1>' + '<p class="kwip">In progress</p>';
    return html;
  };
  UI.seatList = function(seats) {
    var total = 0, p;
    for (p in seats) { total += seats[p]; }
    var out = '<table class="ktable kseats">';
    LEFT_RIGHT.forEach(function(q) {
      if (!seats[q]) { return; }
      out += '<tr class="khov-row" tabindex="0" data-hov="party:' + q + '"><td><span class="kswatch bgf-' + q + '"></span>' + pspan(q) + '</td><td class="knum">' + seats[q] +
        '</td><td class="knum">' + (100 * seats[q] / total).toFixed(1) + '%</td></tr>';
    });
    return out + '</table>';
  };
  // kept for the vote drawings in the story panel
  UI.seatLegend = function(seats, sides) {
    var total = 0, p;
    for (p in seats) { total += seats[p]; }
    var out = '<table class="ktable">';
    LEFT_RIGHT.forEach(function(q) {
      if (!seats[q]) { return; }
      out += '<tr><td><span class="kswatch bgf-' + q + '"></span>' + UI.partyName(q) + '</td><td class="knum">' + seats[q] +
        '</td><td class="knum kdim">' + (100 * seats[q] / total).toFixed(1) + '%</td>' +
        (sides ? '<td class="kside">' + ({yes: 'for', no: 'against', abstain: 'abstains'}[sides[q] || 'abstain']) + '</td>' : '') + '</tr>';
    });
    return out + '</table>';
  };

  // ---- The party ----------------------------------------------------------------------
  UI.organs = function(Q) {
    var line_f = Q.party_line || 'right';
    var mapp = Q.y23_hundreds >= 6 || Q.oct_ok ? ['ready to command', 0] : Q.oct_show ? ['being built in haste', 2] : ['on paper', 3];
    return [
      {id: 'zentrale', name: 'Zentrale', sub: 'the leadership elected by the congress', word: fword(line_f, 'held by the ' + FACTION[line_f][0]),
        text: (Q.y23_leipzig_done ? '21 members elected by the Leipzig congress, which enlarged it from 14. ' + (Q.y23_compromise ? 'In May the Zentralausschuss brought the Left up to four seats, under the compromise Moscow imposed. ' : '') : '14 members, elected at Jena in August 1921; the next congress meets in Leipzig at the end of January. ') + 'The party\'s day-to-day leadership: it sets the line, runs the press and the apparatus, appoints the district secretaries and deals with Moscow.'},
      {id: 'za', name: 'Zentralausschuss', sub: 'the districts\' council', word: '',
        text: (Q.y23_leipzig_done ? '38 members, elected by the Leipzig congress. ' : '36 members, elected at Jena. ') + 'The larger council of party leaders from the districts, which meets with the Zentrale between congresses and can check it. It has no formal factions; the Left count is its known leaders who sit here, among them Fischer, Maslow and Thälmann.'},
      {id: 'fraktion', name: 'Reichstag Fraktion', sub: 'our deputies', word: (Q.rt_seats.kpd || 0) + ' deputies',
        text: 'The party\'s deputies in the Reichstag. Their speeches reach millions through the press; their votes rarely decide anything, and the party distrusts its own parliamentarians.'},
      {id: 'press', name: 'Die Rote Fahne', sub: 'the central organ', word: Q.kpd_banned ? sc('banned', 4) : sc('legal, daily', 0),
        text: 'The party\'s daily paper in Berlin, founded by Luxemburg and Liebknecht in 1918, with district papers in every region. Banned more than once since 1919.'},
      {id: 'mapp', name: 'M-Apparat', sub: 'the military-political apparatus', word: sc(mapp[0], mapp[1]),
        text: 'The party\'s secret apparatus, set up on the Comintern\'s orders after 1920 and paid by it: departments for military affairs (M), intelligence (N) and subversion in the army and police (Z).' + (Q.month >= 3 || Q.year > 1923 ? ' Woldemar Rose leads it.' : '') + (Q.month >= 10 || Q.year > 1923 ? ' Moscow has sent Unszlicht to build it into the staff of a rising. Its weapons lists are longer than its weapons.' : '')},
      {id: 'ecci', name: 'Comintern representative', sub: 'Moscow\'s eyes in Berlin', word: 'Radek',
        text: 'The Executive of the Communist International sends its representatives to sit with the Zentrale. Now that is Karl Radek, the Executive\'s man for Germany, who backs Brandler and the united front.'}
    ];
  };
  UI.sidebarParty = function(Q) {
    var html = '<h1>Factions</h1>' + line('Party line: ' + hov(fword(Q.party_line), 'faction:' + Q.party_line)) + line('Internal dissent: ' +
      sc(KPD.dissentWord(Q.kf_dissent_percent), lvl(Q.kf_dissent_percent, [5, 15, 31, 50])));
    ['left', 'centre', 'right'].forEach(function(f) {
      if (Q.kpd_factions.indexOf(f) < 0) { return; }
      var s = Q['kf_' + f + '_strength'], d = Q['kf_' + f + '_dissent'];
      html += '<div class="kfaction kfaction-' + f + '">' +
        '<p class="kfaction-name">' + hov(fword(f, esc(FACTION[f][0]) + ' wing'), 'faction:' + f) + '</p>' +
        line('Strength: ' + sc(KPD.strengthWord(s), 4 - lvl(s, [10, 25, 40, 60]))) +
        line('Dissent: ' + sc(KPD.dissentWord(d), lvl(d, [5, 15, 31, 50]))) +
        line('Tactic: ' + esc(TACTIC[f])) + '</div>';
    });
    html += '<h1>Organs</h1>';
    // members, and how many of them are Left (see MOD_NOTES); set by the party congress
    var seats = function(k, n, l) {
      var v = function(f, d) { var x = Q[k + '_' + f]; return x === undefined ? d : x; };
      return line('Members: ' + v('n', n)) + line(fword('left') + ': ' + v('l', l));
    };
    UI.organs(Q).forEach(function(o) {
      if (o.id == 'zentrale' || o.id == 'za') {
        html += '<div class="kfaction"><p class="kfaction-name">' + hov(esc(o.name), 'organ:' + o.id) + '</p>' +
          (o.id == 'zentrale' ? seats('zentrale', 14, 0) : seats('za', 36, 6)) + '</div>';
      } else {
        html += line(hov(esc(o.name), 'organ:' + o.id) + ': ' + o.word);
      }
    });
    var t = Q.comintern_trust;
    html += '<h1>Moscow</h1>' +
      line('Leadership: ' + esc(Q.moscow_leader.replace(/-/g, ', ')) + ', favouring the ' + fword(Q.moscow_favored)) +
      line(tip('Trust in us', 'Below satisfied Moscow writes letters; if displeased it cuts the subsidy and writes open letters; if angry it sends emissaries') + ': ' +
        sc(KPD.trustWord(t), 4 - lvl(t, [30, 40, 50, 60]))) +
      (Q.soviet_subsidy ? line('Subsidy: paid') : '');
    if (Q.dir_active) {
      html += line('Directive: ' + esc(Q.dir_target) + ' (' + esc(Q.dir_progress) + '), ' + met(Q.dir_ok) + '. Judged by ' + esc(Q.dir_by) + '.');
    }
    if (Q.oct_show) { html += '<h1>The German October</h1>' + UI.october(Q); }
    var dues = KPD.duesEstimate(Q);
    html += '<h1>The class</h1>' +
      line('Workers\' mood: ' + sc(KPD.moodWord(Q.mood), 4 - lvl(Q.mood, [40, 55, 70, 85]))) +
      line(tip('United front', 'Joint action with the workers of the SPD, the free unions and the factory councils') + ': ' + sc(KPD.unityWord(Q.y23_unity), 4 - lvl(Q.y23_unity, [1, 3, 6, 9]))) +
      line(tip('Dues', 'Members in the districts pay dues every month; a stronger organisation pays more') + ': ' +
        sc(dues >= 3 ? 'plentiful' : dues == 2 ? 'steady' : dues == 1 ? 'thin' : 'barely trickling', [4, 3, 1, 0][Math.min(3, dues)])) +
      line('Organisation: ' + Object.keys(KPD.DISTRICTS).map(function(d) {
        var o = Q['d_' + d + '_org'];
        return esc(KPD.DISTRICTS[d].short || KPD.DISTRICTS[d].name) + ' ' + sc(KPD.orgWord(o), 4 - lvl(o, [15, 30, 45, 60]));
      }).join(', '));
    return html;
  };

  // ---- Politics -------------------------------------------------------------------------
  UI.sidebarPolitics = function(Q) {
    var html = '<h1>Inter-party relations</h1>';
    ['spd', 'ddp', 'z', 'bvp', 'dvp', 'dnvp', 'nsdap'].forEach(function(p) {
      var r = Q[p + '_relation'] || 0;
      html += line(UI.partyName(p) + ': ' + sc(KPD.relationWord(r), 4 - lvl(r, [15, 30, 40, 55])));
    });
    html += '<h1>Party leadership</h1><table class="ktable kleaders">';
    LEFT_RIGHT.forEach(function(p) {
      if (!LEADER[p]) { return; }
      html += '<tr><td>' + UI.partyName(p) + '</td><td>' + hov(esc(PEOPLE[LEADER[p]][0].split(' ').slice(-1)[0]), 'person:' + LEADER[p]) +
        '</td><td>' + hov(esc(IDEOLOGY[p][0]), 'ideology:' + p) + '</td></tr>';
    });
    html += '</table>';
    html += '<h1>The Lands</h1>';
    KPD.LAND_ORDER.forEach(function(l) { html += line(esc(KPD.LANDS[l].name) + ': ' + esc(KPD.landGov(Q, l))); });
    return html;
  };

  // ---- Defense ----------------------------------------------------------------------------
  // Official bodies and armed leagues in 1923. Most follow the calendar and the year's events;
  // the Hundreds follow the player.
  UI.forces = function(Q) {
    var after = function(m) { return Q.year > 1923 || Q.month >= m; };
    var putsch = Q.y23_beerhall_done == 1;
    var h = KPD.hundreds(Q), mil = Q.rfb_militancy || 0;
    return [
      {id: 'reichswehr', kind: 'official', name: 'Reichswehr', party: '', sub: 'the army, under General von Seeckt', str: ['large', 4], loyal: after(10) ? ['conditional', 3] : ['conditional', 2],
        text: 'The hundred thousand men Versailles allows, officered by the old army. Loyal to the government against the Left; "Reichswehr does not fire on Reichswehr" against the Right.' + (after(10) ? ' Its Bavarian division has sworn itself to Munich.' : '')},
      {id: 'prupol', kind: 'official', name: 'Prussian police', party: 'spd', sub: 'Schutzpolizei, under Severing', str: ['large', 4], loyal: ['loyal', 0],
        text: 'Barracked, armed with rifles and armoured cars, commanded by a Social Democrat. The Republic\'s best force.' + (after(5) ? ' In May it banned our Hundreds in Prussia.' : '')},
      {id: 'baypol', kind: 'official', name: 'Bavarian police', party: 'bvp', sub: 'Landespolizei', str: ['sizeable', 3], loyal: after(9) && !putsch ? ['defiant', 4] : ['unreliable', 3],
        text: 'Obeys Munich, not Berlin.' + (putsch ? ' On 9 November it fired on Hitler\'s march; Hitler is under arrest.' : after(9) ? ' Since September it answers to Kahr as general state commissioner, who defies the Reich.' : ' Watches the armed leagues and does nothing.')},
      {id: 'hundreds', kind: 'para', name: 'Proletarian Hundreds', party: 'kpd', sub: 'our workers\' defence', ours: true,
        str: [KPD.unitsWord(h), h >= 4 ? 0 : h >= 2 ? 1 : h >= 1 ? 2 : 4], arms: [mil >= 2 ? 'armed' : mil >= 1 ? 'lightly armed' : 'barely armed', mil >= 2 ? 1 : mil >= 1 ? 2 : 3],
        text: 'Defence units formed in the factories by the KPD with left Social Democrats and non-party workers, to guard meetings and strikes; the core of any rising.' + (after(5) ? ' Banned in Prussia.' : '') + (after(11) ? ' Banned in Saxony since 13 October by General Müller.' : '')},
      {id: 'sa', kind: 'para', name: 'SA', party: 'nsdap', sub: 'the NSDAP\'s storm troops', str: putsch ? ['banned, scattered', 1] : after(9) ? ['large', 3] : ['growing', 2],
        arms: putsch ? ['hidden arms', 2] : ['armed', 3], text: 'Hitler\'s street army in Bavaria, trained by Röhm and officers of the Reichswehr, ' + (after(9) ? 'now joined with Bund Oberland and the Reichsflagge in the Kampfbund.' : 'marching beside Bund Oberland and Röhm\'s Reichsflagge.') + (putsch ? ' Broken up after the putsch, not destroyed.' : '')},
      {id: 'stahlhelm', kind: 'para', name: 'Stahlhelm', party: 'dnvp', sub: 'League of Front Soldiers', str: ['large', 3], arms: ['lightly armed', 2],
        text: 'The largest veterans\' league, monarchist and close to the DNVP. Strongest in Prussia\'s east and in Central Germany.'},
      {id: 'black', kind: 'para', name: 'Black Reichswehr', party: 'dnvp', sub: 'illegal army reserve', str: after(10) ? ['dissolved', 1] : ['sizeable', 3], arms: ['heavily armed', 4],
        text: 'Labour battalions hidden in the barracks of Prussia, beyond what Versailles allows. ' + (after(10) ? 'Major Buchrucker\'s putsch at Küstrin on 1 October failed; the units are disbanded on paper.' : 'Major Buchrucker commands them and talks of marching on Berlin.')}
    ];
  };
  UI.sidebarDefense = function(Q) {
    var F = UI.forces(Q), name = function(f) { return hov(f.party ? pspan(f.party, esc(f.name)) : '<b>' + esc(f.name) + '</b>', 'force:' + f.id); };
    var html = '<h1>Official organisations</h1>';
    F.filter(function(f) { return f.kind == 'official'; }).forEach(function(f) {
      html += '<div class="kforce"><p class="kforce-name">' + name(f) + '</p>' +
        line('Strength: ' + sc(f.str[0], f.str[1])) + line('Loyalty: ' + sc(f.loyal[0], f.loyal[1])) + '</div>';
    });
    html += '<h1>Paramilitaries</h1>';
    F.filter(function(f) { return f.kind == 'para'; }).forEach(function(f) {
      // our own units: strong is good (green); the enemy's: strong is bad (red)
      html += '<div class="kforce">' + '<p class="kforce-name">' + name(f) + '</p>' +
        line('Strength: ' + sc(f.str[0], f.str[1])) + line('Militarization: ' + sc(f.arms[0], f.arms[1])) + '</div>';
    });
    var where = Object.keys(KPD.DISTRICTS).filter(function(d) { return Q['d_' + d + '_h'] > 0; }).map(function(d) { return esc(KPD.DISTRICTS[d].name); });
    if (where.length) { html += '<p class="kdim knote">Our Hundreds in: ' + where.join(', ') + '</p>'; }
    return html;
  };

  // ---- Polls ---------------------------------------------------------------------------------
  UI.sidebarPolls = function(Q) {
    var order = ['kpd', 'spd', 'ddp', 'z', 'dvp', 'dnvp', 'nsdap', 'other'];
    var html = '<h1>Projected results</h1>' + line('<span class="kdim">If the election were held now:</span>') + '<table class="ktable kseats">';
    order.forEach(function(p) {
      html += '<tr class="khov-row" tabindex="0" data-hov="party:' + p + '"><td><span class="kswatch bgf-' + p + '"></span>' + pspan(p, p == 'z' ? 'Z + BVP' : '') +
        '</td><td class="knum">' + (Q[p + '_votes'] || 0) + '%</td></tr>';
    });
    html += '</table><h1>Result per demographic</h1>';
    var names = {workers: 'Workers', unemployed: 'Unemployed', new_middle: 'New middle class', old_middle: 'Old middle class', rural: 'Rural', catholics: 'Catholics'};
    Q.classes.forEach(function(c) {
      html += '<p class="kdemo"><b>' + names[c] + '</b><br>' + order.filter(function(p) { return (Q[c + '_' + p + '_display'] || 0) >= 1; })
        .map(function(p) { return pspan(p, esc(pname(p)) + ' ' + Q[c + '_' + p + '_display'] + '%'); }).join(' · ') + '</p>';
    });
    return html + line('<span class="kdim">Z includes the BVP.</span>');
  };

  // ---- Filling the placeholders -----------------------------------------------------------
  UI.renderInserts = function(root) {
    var Q = Qnow();
    UI.initHover();
    KPD.migrate(Q);
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
        else if (kind == 'sb_party') { html = UI.sidebarParty(Q); }
        else if (kind == 'sb_defense') { html = UI.sidebarDefense(Q); }
        else if (kind == 'sb_polls') { html = UI.sidebarPolls(Q); }
      } catch (e) { html = '<p class="kdim">(' + esc(e.message) + ')</p>'; console.error(e); }
      el.innerHTML = html;
      el.classList.remove('kpd-insert');
      el.classList.add('kpd-filled');
    });
  };
}());
