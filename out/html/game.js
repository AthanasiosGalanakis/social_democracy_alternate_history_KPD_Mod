(function() {
  var game;
  var ui;

  var DateOptions = {hour: 'numeric',
                 minute: 'numeric',
                 second: 'numeric',
                 year: 'numeric',
                 month: 'short',
                 day: 'numeric' };

  var main = function(dendryUI) {
    ui = dendryUI;
    game = ui.game;

    // Add your custom code here.
  };

  var TITLE = "Social Democracy: An Alternate History" + '_' + "Autumn Chen";

  // the url is a link to game.json
  // test url: https://aucchen.github.io/social_democracy_mods/v0.1.json
  // TODO; 
  window.loadMod = function(url) {
      ui.loadGame(url);
  };

  window.updateSaveButtons = function() {
      if (window.dendryUI.language && window.dendryUI.language == "de") {
          for (var element of document.getElementsByClassName("save_button")) {
              if (element.textContent == "Save") {
                  element.textContent = "Speichern";
              } else if (element.textContent == "Load") {
                  element.textContent = "Laden";
              }
          } 
      }
      else {
          for (var element of document.getElementsByClassName("save_button")) {
              if (element.textContent == "Speichern") {
                  element.textContent = "Save";
              } else if (element.textContent == "Laden") {
                  element.textContent = "Load";
              }
          }
      }
  };

  window.onSave = function() {
      window.updateSaveButtons();
  };

  window.onPopulateSaveSlots = function() {
      window.updateSaveButtons();
  };

  window.showStats = function() {
    if (window.dendryUI.dendryEngine.state.sceneId.startsWith('library')) {
        window.dendryUI.dendryEngine.goToScene('backSpecialScene');
    } else {
        window.dendryUI.dendryEngine.goToScene('library');
    }
  };

  window.showMods = function() {
    window.hideOptions();
    if (window.dendryUI.dendryEngine.state.sceneId.startsWith('mod_loader')) {
        window.dendryUI.dendryEngine.goToScene('backSpecialScene');
    } else {
        window.dendryUI.dendryEngine.goToScene('mod_loader');
    }
  };

  // TODO: update audio displays
  window.updateAudio = function(song) {
      var now_playing = document.getElementById('currently_playing');
      if (!now_playing) { return; }
      if (song) {
          var a = song.split('/');
          now_playing.textContent = a[a.length-1];
      } else {
          var s = window.dendryUI.currentAudioURL;
          var a = s.split('/');
          now_playing.textContent = a[a.length-1];
      }
  };

  // sets the volume
  window.setVolume = function(volume) {
      if (window.dendryUI.currentAudio) {
          window.dendryUI.volume = volume/100;
          window.dendryUI.currentAudio.volume = volume/100;
      }
  };

  // go to the next song - this just sets the time to 9999 lol.
  window.shuffle = function() {
      if (window.dendryUI.currentAudio) {
          window.dendryUI.currentAudio.currentTime = 9999;
      }
  };

  // toggles pause or play of music
  window.togglePausePlay = function() {
      if (window.dendryUI.currentAudio) {
          if (window.dendryUI.currentAudio.paused) {
            window.dendryUI.currentAudio.play();
            document.getElementById('pause-button-image').style.display = "inline";
            document.getElementById('play-button-image').style.display = "none";
            document.getElementById('pause-button');
            document.getElementById('pause-button-text').textContent = "Pause";
          } else {
            window.dendryUI.currentAudio.pause();
            document.getElementById('play-button-image').style.display = "inline";
            document.getElementById('pause-button-image').style.display = "none";
            document.getElementById('pause-button-text').textContent = "Play";
          }
      }
  };
  
  window.showOptions = function() {
      var save_element = document.getElementById('options');
      window.populateOptions();
      save_element.style.display = "block";
      if (!save_element.onclick) {
          save_element.onclick = function(evt) {
              var target = evt.target;
              var save_element = document.getElementById('options');
              if (target == save_element) {
                  window.hideOptions();
              }
          };
      }
  };

  window.hideOptions = function() {
      var save_element = document.getElementById('options');
      save_element.style.display = "none";
  };

  window.disableBg = function() {
      window.dendryUI.disable_bg = true;
      document.body.style.backgroundImage = 'none';
      window.dendryUI.saveSettings();
  };

  window.enableBg = function() {
      window.dendryUI.disable_bg = false;
      window.dendryUI.setBg(window.dendryUI.dendryEngine.state.bg);
      window.dendryUI.saveSettings();
  };

  window.disableAnimate = function() {
      window.dendryUI.animate = false;
      window.dendryUI.saveSettings();
  };

  window.enableAnimate = function() {
      window.dendryUI.animate = true;
      window.dendryUI.saveSettings();
  };

  window.disableAnimateBg = function() {
      window.dendryUI.animate_bg = false;
      window.dendryUI.saveSettings();
  };

  window.enableAnimateBg = function() {
      window.dendryUI.animate_bg = true;
      window.dendryUI.saveSettings();
  };

  window.disableAudio = function() {
      window.dendryUI.toggle_audio(false);
      window.dendryUI.saveSettings();
  };

  window.enableAudio = function() {
      window.dendryUI.toggle_audio(true);
      window.dendryUI.saveSettings();
  };

  window.enableImages = function() {
      window.dendryUI.show_portraits = true;
      window.dendryUI.saveSettings();
  };

  window.disableImages = function() {
      window.dendryUI.show_portraits = false;
      window.dendryUI.saveSettings();
  };

  window.enableLightMode = function() {
      window.dendryUI.dark_mode = false;
      document.body.classList.remove('dark-mode');
      window.dendryUI.saveSettings();
  };
  window.enableDarkMode = function() {
      window.dendryUI.dark_mode = true;
      document.body.classList.add('dark-mode');
      window.dendryUI.saveSettings();
  };

  // populates the checkboxes in the options view
  window.populateOptions = function() {
    var disable_bg = window.dendryUI.disable_bg;
    var animate = window.dendryUI.animate;
    var disable_audio = window.dendryUI.disable_audio;
    var show_portraits = window.dendryUI.show_portraits;
    if (disable_bg) {
        $('#backgrounds_no')[0].checked = true;
    } else {
        $('#backgrounds_yes')[0].checked = true;
    }
    if (animate) {
        $('#animate_yes')[0].checked = true;
    } else {
        $('#animate_no')[0].checked = true;
    }
    if (disable_audio) {
        $('#audio_no')[0].checked = true;
    } else {
        $('#audio_yes')[0].checked = true;
    }
    if (show_portraits) {
        $('#images_yes')[0].checked = true;
    } else {
        $('#images_no')[0].checked = true;
    }
    if (window.dendryUI.dark_mode) {
        $('#dark_mode')[0].checked = true;
    } else {
        $('#light_mode')[0].checked = true;
    }
    $(window.devMode() ? '#dev_yes' : '#dev_no')[0].checked = true;
  };

  // The dev toggle shows the Dev tab beside the other sidebar tabs and the "dev:" notes in option
  // subtitles. Off by default; remembered in this browser.
  window.devMode = function() {
      try { return window.localStorage.getItem('kpd_dev') == '1'; } catch (e) { return false; }
  };
  window.setDevMode = function(on) {
      try { window.localStorage.setItem('kpd_dev', on ? '1' : '0'); } catch (e) {}
      document.body.classList.toggle('dev-on', !!on);
      if (!on && window.statusTab == 'status.dev') { window.changeTab('status', 'main_tab'); }
  };
  // wrap the "dev: ..." tail of every option subtitle so the toggle can hide it
  // "13 January. Cuno asks..." becomes the date on its own line, then the text
  var dateRegex = /^(\s*)(\d{1,2}(?:\s*(?:and|to|–|-)\s*\d{1,2})? (?:January|February|March|April|May|June|July|August|September|October|November|December)(?: \d{4})?)\.\s+/;
  window.splitDates = function(root) {
      $(root || document).find('.subtitle, .choice-subtitle, .card-subtitle').each(function() {
          if (this.dataset.dateSplit) { return; }
          this.dataset.dateSplit = '1';
          var m = dateRegex.exec(this.innerHTML);
          if (!m) { return; }
          this.innerHTML = m[1] + '<span class="kdate">' + m[2] + '</span>' + this.innerHTML.slice(m[0].length);
      });
  };
  window.markDevNotes = function(root) {
      $(root || document).find('.subtitle, .choice-subtitle').each(function() {
          if (this.dataset.devMarked) { return; }
          this.dataset.devMarked = '1';
          var html = this.innerHTML, i = html.indexOf('dev:');
          if (i < 0) { return; }
          var j = html.lastIndexOf('·', i);
          var start = (j >= 0 && i - j < 4) ? j : i;
          this.innerHTML = html.slice(0, start) + '<span class="kdev">' + html.slice(start) + '</span>';
      });
  };

  
  // This function allows you to modify the text before it's displayed.
  // E.g. wrapping chat-like messages in spans.
  window.displayText = function(text) {
      return text;
  };

  // This function allows you to do something in response to signals.
  window.handleSignal = function(signal, event, scene_id) {
  };
  
  // This function runs on a new page. Right now, this auto-saves.
  window.onNewPage = function() {
    var scene = window.dendryUI.dendryEngine.state.sceneId;
    if (scene != 'root' && !window.justLoaded) {
        window.dendryUI.autosave();
    }
    if (window.justLoaded) {
        window.justLoaded = false;
    }
  };

  // TODO: have some code for tabbed sidebar browsing.
  window.updateSidebar = function() {
      $('#qualities').empty();
      var scene = dendryUI.game.scenes[window.statusTab];
      dendryUI.dendryEngine._runActions(scene.onArrival);
      var displayContent = dendryUI.dendryEngine._makeDisplayContent(scene.content, true);
      $('#qualities').append(dendryUI.contentToHTML.convert(displayContent));
      window.KPD.UI.renderInserts(document.getElementById('qualities'));
      // the party paper in the right-hand column
      $('#news').html(window.KPD.UI.news(dendryUI.dendryEngine.state.qualities));
  };

  window.changeTab = function(newTab, tabId) {
      if (tabId == 'poll_tab' && dendryUI.dendryEngine.state.qualities.historical_mode) {
          window.alert('Polls are not available in historical mode.');
          return;
      }
      var tabButton = document.getElementById(tabId);
      var tabButtons = document.getElementsByClassName('tab_button');
      for (i = 0; i < tabButtons.length; i++) {
        tabButtons[i].className = tabButtons[i].className.replace(' active', '');
      }
      tabButton.className += ' active';
      window.statusTab = newTab;
      window.updateSidebar();
  };


  /* party names in their own colours, in the story text and the sidebar */
  var partyClasses = {'KPD': 'p-kpd', 'SPD': 'p-spd', 'DNVP': 'p-dnvp', 'DVP': 'p-dvp', 'DDP': 'p-ddp',
                      'NSDAP': 'p-nsdap', 'DVFP': 'p-nsdap', 'Nazis': 'p-nsdap', 'Nazi': 'p-nsdap', 'BVP': 'p-bvp', 'Zentrum': 'p-zentrum',
                      'Centre Party': 'p-zentrum', 'Z': 'p-zentrum', 'Center Party': 'p-zentrum'};
  var partyRegex = /\b(KPD|SPD|DNVP|DVP|DDP|NSDAP|DVFP|BVP|Zentrum|Centre Party|Center Party|Nazis|Nazi)\b|\b(Z)(?= \+|:)/g;
  var factionRegex = /^(\s*)(Right|Left|Centre)(?= strength)/;
  var colouring = false;
  window.colourParties = function() {
      if (colouring) { return; }
      colouring = true;
      try {
          ['content', 'sidebar', 'qualities', 'tools_wrapper'].forEach(function(id) {
              var root = document.getElementById(id);
              if (!root) { return; }
              var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
              var nodes = [];
              while (walker.nextNode()) { nodes.push(walker.currentNode); }
              nodes.forEach(function(node) {
                  var parent = node.parentNode;
                  var fm = (id == 'qualities' || id == 'sidebar' || id == 'tools_wrapper') && parent && !/\bfaction-word\b/.test(parent.className || '') ? factionRegex.exec(node.nodeValue) : null;
                  if (fm) {
                      var fspan = document.createElement('span');
                      fspan.className = 'faction-word fw-' + fm[2].toLowerCase();
                      fspan.textContent = fm[2];
                      var rest = document.createTextNode(node.nodeValue.slice(fm[0].length));
                      parent.insertBefore(document.createTextNode(fm[1]), node);
                      parent.insertBefore(fspan, node);
                      parent.replaceChild(rest, node);
                      return;
                  }
                  if (!parent || /^(SCRIPT|STYLE|TEXTAREA)$/.test(parent.nodeName) || (parent.className && /\bp-(kpd|spd|uspd|dnvp|dvp|ddp|nsdap|bvp|zentrum)\b/.test(parent.className))) { return; }
                  partyRegex.lastIndex = 0;
                  if (!partyRegex.test(node.nodeValue)) { return; }
                  partyRegex.lastIndex = 0;
                  var frag = document.createDocumentFragment();
                  var text = node.nodeValue, last = 0, m;
                  while ((m = partyRegex.exec(text)) !== null) {
                      frag.appendChild(document.createTextNode(text.slice(last, m.index)));
                      var span = document.createElement('span');
                      var tok = m[1] || m[2];
                      span.className = 'party ' + partyClasses[tok];
                      span.textContent = tok;
                      frag.appendChild(span);
                      last = m.index + tok.length;
                  }
                  frag.appendChild(document.createTextNode(text.slice(last)));
                  parent.replaceChild(frag, node);
              });
          });
      } finally { colouring = false; }
  };
  document.addEventListener('DOMContentLoaded', function() {
      new MutationObserver(function() {
          if (!document.getElementById('leadership_bar') && document.querySelector('#content ul.pinned-cards') && !document.body.classList.contains('opening')) { window.arrangeLeadership(); }
          window.colourParties();
      }).observe(document.body, {childList: true, subtree: true, characterData: true});
  });


  /* leadership bar: the head of the party's portrait, alone in its own panel above the page, clickable;
     faction adviser cards get a frame and caption in their faction's colour */
  var factionOfCard = {'adv_right': 'right', 'adv_centre': 'centre', 'adv_left': 'left'};
  window.arrangeLeadership = function() {
      var pinned = document.querySelector('#content ul.pinned-cards');
      var old = document.getElementById('leadership_bar');
      if (old) { old.parentNode.removeChild(old); }
      if (!pinned) { return; }
      var items = pinned.querySelectorAll('li.pinned-card');
      var head = null;
      Array.prototype.forEach.call(items, function(li) {
          var a = li.querySelector('a.card');
          var id = a ? a.getAttribute('card-id') : '';
          if (factionOfCard[id]) { li.classList.add('faction-' + factionOfCard[id]); }
          if (id == 'head') { head = li; }
      });
      var order = {'adv_left': 0, 'adv_centre': 1, 'adv_right': 2};
      var lis = Array.prototype.slice.call(pinned.querySelectorAll('li.pinned-card'));
      lis.sort(function(x, y) {
          var ix = order[x.querySelector('a.card').getAttribute('card-id')], iy = order[y.querySelector('a.card').getAttribute('card-id')];
          return (ix === undefined ? 9 : ix) - (iy === undefined ? 9 : iy);
      }).forEach(function(li) { pinned.appendChild(li); });
      if (!head) { return; }
      // the head of the party: party title, portrait (the card itself), name and role, as in the DDP mod
      var card = head.querySelector('a.card');
      var title = card.getAttribute('title');
      var bar = document.createElement('div');
      bar.id = 'leadership_bar';
      bar.className = 'leader-card';
      var party = document.createElement('h2');
      party.className = 'leader-party';
      party.appendChild(document.createTextNode('Kommunistische Partei Deutschlands ('));
      var abbr = document.createElement('span');
      abbr.className = 'leader-abbr p-kpd';
      abbr.textContent = 'KPD';
      party.appendChild(abbr);
      party.appendChild(document.createTextNode(')'));
      bar.appendChild(party);
      card.classList.add('leader-portrait');
      card.onclick = function(e) {
          e.preventDefault();
          window.dendryUI.dendryEngine.playPinnedCard(card.getAttribute('card-id'));
          return false;
      };
      bar.appendChild(card);
      var name = document.createElement('p');
      name.className = 'leader-name';
      name.textContent = title;
      bar.appendChild(name);
      var role = document.createElement('p');
      role.className = 'leader-role';
      role.textContent = 'Chairman';
      bar.appendChild(role);
      pinned.removeChild(head);
      var content = document.getElementById('content');
      content.insertBefore(bar, content.firstChild);
  };

  /* a portrait that is missing is replaced by a plain frame with initials */
  document.addEventListener('error', function(e) {
      var img = e.target;
      if (!img || img.tagName != 'IMG' || !/card-img/.test(img.className)) { return; }
      var a = img.closest('a.card');
      var title = a ? (a.getAttribute('title') || '') : '';
      var initials = title.split(/[\s:]+/).filter(function(w) { return /^[A-ZÄÖÜ]/.test(w); }).map(function(w) { return w[0]; }).slice(-2).join('');
      var ph = document.createElement('div');
      ph.className = 'card-img card-placeholder';
      ph.textContent = initials;
      img.parentNode.replaceChild(ph, img);
  }, true);

  // the opening screens (title, introduction, credits) have no sidebar
  window.onDisplayContent = function() {
      var sceneId = window.dendryUI.dendryEngine.state.sceneId;
      var opening = sceneId == 'root' || sceneId.startsWith('root.start') || sceneId == 'credits';
      document.getElementById('tools_wrapper').style.display = opening ? 'none' : '';
      document.body.classList.toggle('opening', opening);
      if (!opening) { window.arrangeLeadership(); }
      // maps, votes and charts are drawn into their placeholders
      window.KPD.UI.renderInserts(document.getElementById('content'));
      window.markDevNotes(document.getElementById('content'));
      window.splitDates(document.getElementById('content'));
      window.colourParties();
      if (!opening) {
          window.updateSidebar();
      }
  };

  /*
   * This function copied from the code for Infinite Space Battle Simulator
   *
   * quality - a number between max and min
   * qualityName - the name of the quality
   * max and min - numbers
   * colors - if true/1, will use some color scheme - green to yellow to red for high to low
   * */
  window.generateBar = function(quality, qualityName, max, min, colors) {
      var bar = document.createElement('div');
      bar.className = 'bar';
      var value = document.createElement('div');
      value.className = 'barValue';
      var width = (quality - min)/(max - min);
      if (width > 1) {
          width = 1;
      } else if (width < 0) {
          width = 0;
      }
      value.style.width = Math.round(width*100) + '%';
      if (colors) {
          value.style.backgroundColor = window.probToColor(width*100);
      }
      bar.textContent = qualityName + ': ' + quality;
      if (colors) {
          bar.textContent += '/' + max;
      }
      bar.appendChild(value);
      return bar;
  };


  window.justLoaded = true;
  window.statusTab = "status";
  window.dendryModifyUI = main;
  console.log("Modifying stats: see dendryUI.dendryEngine.state.qualities");

  window.increaseFontSize = function() {
        window.dendryUI.font_size += 0.1;
        var fs = window.dendryUI.font_size;
        var sidebar_fs = fs - 0.1;
        document.getElementById("content").setAttribute("style", "font-size: " + fs + "em;");
        document.getElementById("stats_sidebar").setAttribute("style", "font-size: " + sidebar_fs + "em;");
        document.getElementById('font_size_value').textContent = window.dendryUI.font_size.toFixed(1) + "em";
        window.dendryUI.saveSettings();
  }

  window.decreaseFontSize = function() {
        window.dendryUI.font_size -= 0.1;
        var fs = window.dendryUI.font_size;
        var sidebar_fs = fs - 0.1;
        document.getElementById("content").setAttribute("style", "font-size: " + fs + "em;");
        document.getElementById("stats_sidebar").setAttribute("style", "font-size: " + sidebar_fs + "em;");
        document.getElementById('font_size_value').textContent = window.dendryUI.font_size.toFixed(1) + "em";
        window.dendryUI.saveSettings();
  }

  window.onload = function() {
    window.dendryUI.loadSettings({show_portraits: false});
    if (window.dendryUI.dark_mode) {
        document.body.classList.add('dark-mode');
    }
    window.dendryUI.font_size = 1.1;
    document.body.classList.toggle('dev-on', window.devMode());
    // choices are drawn after the page text, so watch the content for new subtitles
    var content = document.getElementById('content');
    if (content && window.MutationObserver) {
        new MutationObserver(function() { window.markDevNotes(content); window.splitDates(content); }).observe(content, {childList: true, subtree: true});
    }
    window.pinnedCardsDescription = "Advisor cards - actions are only usable once per 6 months.";
  };

}());
