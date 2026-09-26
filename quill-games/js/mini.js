/* The Mini Crossword. */
(function () {
  var SIZE = 5;
  var STATE_KEY = "mini-state";
  var STATS_KEY = "mini-stats";

  var day = Quill.puzzleNumber();
  var puzzle = window.MINI_PUZZLES[day % window.MINI_PUZZLES.length];

  // ---------- Build the puzzle model ----------
  var solution = puzzle.grid.map(function (row) { return row.toUpperCase().split(""); });
  function isBlock(r, c) { return solution[r][c] === "#"; }
  function idx(r, c) { return r * SIZE + c; }

  var numbers = {};   // idx -> clue number
  var words = [];     // {dir, num, cells:[[r,c]], answer, clue}
  var cellWords = {}; // idx -> {across: word, down: word}
  var n = 1;
  for (var r = 0; r < SIZE; r++) {
    for (var c = 0; c < SIZE; c++) {
      if (isBlock(r, c)) continue;
      var startsAcross = (c === 0 || isBlock(r, c - 1)) && c + 1 < SIZE && !isBlock(r, c + 1);
      var startsDown = (r === 0 || isBlock(r - 1, c)) && r + 1 < SIZE && !isBlock(r + 1, c);
      if (startsAcross || startsDown) numbers[idx(r, c)] = n++;
      if (startsAcross) addWord("across", r, c, 0, 1);
      if (startsDown) addWord("down", r, c, 1, 0);
    }
  }
  function addWord(dir, r, c, dr, dc) {
    var w = { dir: dir, num: numbers[idx(r, c)], cells: [], answer: "" };
    while (r < SIZE && c < SIZE && !isBlock(r, c)) {
      w.cells.push([r, c]);
      w.answer += solution[r][c];
      cellWords[idx(r, c)] = cellWords[idx(r, c)] || {};
      cellWords[idx(r, c)][dir] = w;
      r += dr; c += dc;
    }
    var entry = (puzzle[dir] || []).find(function (e) { return e[0].toUpperCase() === w.answer; });
    if (!entry) console.warn("Mini: no " + dir + " clue for " + w.answer + " (" + w.num + "-" + dir + ")");
    w.clue = entry ? entry[1] : "";
    words.push(w);
  }
  var across = words.filter(function (w) { return w.dir === "across"; });
  var down = words.filter(function (w) { return w.dir === "down"; });
  var ordered = across.concat(down);

  // ---------- State ----------
  var state = Quill.load(STATE_KEY, null);
  if (!state || state.day !== day) {
    state = {
      day: day, letters: new Array(SIZE * SIZE).fill(""), seconds: 0,
      started: false, done: false, revealed: [], wrong: [], helped: false,
    };
  }
  var stats = Quill.load(STATS_KEY, {
    solved: 0, streak: 0, maxStreak: 0, lastSolvedDay: null, best: null,
  });

  var sel = { r: 0, c: 0 };
  var dir = "across";
  var paused = false;
  var warnedFull = false;

  function save() { Quill.save(STATE_KEY, state); }
  function currentWord() {
    var cw = cellWords[idx(sel.r, sel.c)];
    return cw[dir] || cw[dir === "across" ? "down" : "across"];
  }

  // ---------- Render ----------
  var gridEl = document.getElementById("grid");
  var cellEls = [];
  for (var i = 0; i < SIZE * SIZE; i++) {
    var rr = Math.floor(i / SIZE), cc = i % SIZE;
    var el = document.createElement("div");
    el.className = "cell" + (isBlock(rr, cc) ? " block" : "");
    el.style.setProperty("--d", (rr + cc) * 0.07 + "s");
    if (!isBlock(rr, cc)) {
      el.innerHTML = (numbers[i] ? '<span class="n">' + numbers[i] + "</span>" : "") + '<span class="ch"></span>';
      el.addEventListener("click", onCellClick.bind(null, rr, cc));
      el.setAttribute("role", "button");
      el.setAttribute("aria-label", "Row " + (rr + 1) + ", column " + (cc + 1));
    }
    gridEl.appendChild(el);
    cellEls.push(el);
  }

  function renderClueList(listEl, list) {
    list.forEach(function (w) {
      var li = document.createElement("li");
      li.innerHTML = '<span class="num">' + w.num + '</span><span class="txt"></span>';
      li.querySelector(".txt").textContent = w.clue;
      li.addEventListener("click", function () { selectWord(w); });
      w.li = li;
      listEl.appendChild(li);
    });
  }
  renderClueList(document.getElementById("across-list"), across);
  renderClueList(document.getElementById("down-list"), down);

  function render() {
    var word = currentWord();
    var inWord = {};
    word.cells.forEach(function (p) { inWord[idx(p[0], p[1])] = true; });
    for (var i = 0; i < SIZE * SIZE; i++) {
      var el = cellEls[i];
      if (el.classList.contains("block")) continue;
      el.querySelector(".ch").textContent = state.letters[i];
      el.classList.toggle("active", !state.done && i === idx(sel.r, sel.c));
      el.classList.toggle("in-word", !state.done && !!inWord[i]);
      el.classList.toggle("wrong", state.wrong.indexOf(i) !== -1);
      el.classList.toggle("revealed", state.revealed.indexOf(i) !== -1);
    }
    gridEl.classList.toggle("solved", state.done);

    var cross = cellWords[idx(sel.r, sel.c)][dir === "across" ? "down" : "across"];
    words.forEach(function (w) {
      w.li.classList.toggle("current", w === word);
      w.li.classList.toggle("cross", w === cross);
      w.li.classList.toggle("filled", w.cells.every(function (p) { return state.letters[idx(p[0], p[1])]; }));
    });
    document.getElementById("bar-num").textContent = word.num + (word.dir === "across" ? "A" : "D");
    document.getElementById("bar-text").textContent = word.clue;
  }

  // ---------- Selection & movement ----------
  function onCellClick(r, c) {
    if (!state.started || paused) return;
    if (sel.r === r && sel.c === c) toggleDir();
    else {
      sel = { r: r, c: c };
      if (!cellWords[idx(r, c)][dir]) toggleDir();
    }
    render();
  }

  function toggleDir() {
    var other = dir === "across" ? "down" : "across";
    if (cellWords[idx(sel.r, sel.c)][other]) dir = other;
  }

  function firstEmpty(w) {
    return w.cells.find(function (p) { return !state.letters[idx(p[0], p[1])]; });
  }

  function selectWord(w, preferEmpty) {
    dir = w.dir;
    var target = (preferEmpty !== false && firstEmpty(w)) || w.cells[0];
    sel = { r: target[0], c: target[1] };
    render();
  }

  // Jump to the next (or previous) clue, preferring clues that still have
  // empty squares, like the NYT app does.
  function nextWord(step) {
    var start = ordered.indexOf(currentWord());
    for (var k = 1; k <= ordered.length; k++) {
      var w = ordered[(start + step * k + ordered.length * k) % ordered.length];
      if (firstEmpty(w)) return selectWord(w);
    }
    selectWord(ordered[(start + step + ordered.length) % ordered.length], false);
  }

  function advance() {
    var w = currentWord();
    var pos = w.cells.findIndex(function (p) { return p[0] === sel.r && p[1] === sel.c; });
    for (var k = pos + 1; k < w.cells.length; k++) {
      if (!state.letters[idx(w.cells[k][0], w.cells[k][1])]) {
        sel = { r: w.cells[k][0], c: w.cells[k][1] };
        return;
      }
    }
    if (firstEmpty(w)) {
      // Empty squares remain earlier in this word: step forward if we can,
      // otherwise wrap back to the first gap.
      var next = w.cells[pos + 1] || firstEmpty(w);
      sel = { r: next[0], c: next[1] };
      return;
    }
    nextWord(1);
  }

  function move(dr, dc) {
    var r = sel.r, c = sel.c;
    do {
      r += dr; c += dc;
      if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) return;
    } while (isBlock(r, c));
    sel = { r: r, c: c };
    if (!cellWords[idx(r, c)][dir]) toggleDir();
  }

  // ---------- Input ----------
  function onKey(key) {
    if (!state.started || paused || state.done) return;
    var i = idx(sel.r, sel.c);
    var locked = state.revealed.indexOf(i) !== -1;

    if (/^[a-z]$/.test(key)) {
      if (!locked) {
        state.letters[i] = key.toUpperCase();
        clearWrong(i);
      }
      advance();
      afterEdit();
    } else if (key === "backspace") {
      if (state.letters[i] && !locked) {
        state.letters[i] = "";
        clearWrong(i);
      } else {
        var w = currentWord();
        var pos = w.cells.findIndex(function (p) { return p[0] === sel.r && p[1] === sel.c; });
        if (pos > 0) {
          sel = { r: w.cells[pos - 1][0], c: w.cells[pos - 1][1] };
          var j = idx(sel.r, sel.c);
          if (state.revealed.indexOf(j) === -1) { state.letters[j] = ""; clearWrong(j); }
        }
      }
      warnedFull = false;
      save();
      render();
    }
  }

  function clearWrong(i) {
    var k = state.wrong.indexOf(i);
    if (k !== -1) state.wrong.splice(k, 1);
  }

  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (document.querySelector(".modal-backdrop.open")) return;
    if (!state.started || paused || state.done) return;
    var k = e.key;
    if (/^[a-zA-Z]$/.test(k)) onKey(k.toLowerCase());
    else if (k === "Backspace" || k === "Delete") onKey("backspace");
    else if (k === " ") { e.preventDefault(); toggleDir(); render(); }
    else if (k === "Tab" || k === "Enter") { e.preventDefault(); nextWord(e.shiftKey ? -1 : 1); }
    else if (k.indexOf("Arrow") === 0) {
      e.preventDefault();
      var horizontal = k === "ArrowLeft" || k === "ArrowRight";
      if ((horizontal && dir === "down") || (!horizontal && dir === "across")) {
        // First press of a perpendicular arrow just changes direction.
        toggleDir();
      } else {
        move(k === "ArrowUp" ? -1 : k === "ArrowDown" ? 1 : 0,
             k === "ArrowLeft" ? -1 : k === "ArrowRight" ? 1 : 0);
      }
      render();
    }
  });

  Quill.buildKeyboard(document.getElementById("keyboard"), onKey, false);
  document.getElementById("prev-clue").addEventListener("click", function () { nextWord(-1); });
  document.getElementById("next-clue").addEventListener("click", function () { nextWord(1); });

  // ---------- Check & reveal ----------
  function targetCells(scope) {
    if (scope === "cell") return [idx(sel.r, sel.c)];
    if (scope === "word") return currentWord().cells.map(function (p) { return idx(p[0], p[1]); });
    var all = [];
    for (var i = 0; i < SIZE * SIZE; i++) if (!isBlock(Math.floor(i / SIZE), i % SIZE)) all.push(i);
    return all;
  }
  function answerAt(i) { return solution[Math.floor(i / SIZE)][i % SIZE]; }

  document.querySelectorAll("[data-check]").forEach(function (b) {
    b.addEventListener("click", function () {
      closeMenus();
      if (!state.started || state.done) return;
      var bad = 0;
      targetCells(b.dataset.check).forEach(function (i) {
        if (state.letters[i] && state.letters[i] !== answerAt(i)) {
          if (state.wrong.indexOf(i) === -1) state.wrong.push(i);
          bad++;
        }
      });
      state.helped = true;
      if (!bad) Quill.toast("Looking good!");
      save();
      render();
    });
  });

  document.querySelectorAll("[data-reveal]").forEach(function (b) {
    b.addEventListener("click", function () {
      closeMenus();
      if (!state.started || state.done) return;
      targetCells(b.dataset.reveal).forEach(function (i) {
        if (state.letters[i] !== answerAt(i)) {
          state.letters[i] = answerAt(i);
          if (state.revealed.indexOf(i) === -1) state.revealed.push(i);
        }
        clearWrong(i);
      });
      state.helped = true;
      afterEdit();
    });
  });

  document.querySelector("[data-reset]").addEventListener("click", function () {
    closeMenus();
    if (!confirm("Clear the puzzle and restart the timer?")) return;
    state.letters = new Array(SIZE * SIZE).fill("");
    state.revealed = [];
    state.wrong = [];
    state.seconds = 0;
    state.done = false;
    state.helped = false;
    warnedFull = false;
    save();
    selectWord(ordered[0]);
    tick();
  });

  function closeMenus() {
    document.querySelectorAll(".menu.open").forEach(function (m) { m.classList.remove("open"); });
  }
  document.querySelectorAll(".menu > button").forEach(function (b) {
    b.addEventListener("click", function (e) {
      e.stopPropagation();
      var menu = b.parentElement;
      var wasOpen = menu.classList.contains("open");
      closeMenus();
      if (!wasOpen) menu.classList.add("open");
    });
  });
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".menu")) closeMenus();
  });

  // ---------- Completion ----------
  function afterEdit() {
    save();
    render();
    var full = state.letters.every(function (l, i) { return l || isBlock(Math.floor(i / SIZE), i % SIZE); });
    if (!full) { warnedFull = false; return; }
    var correct = state.letters.every(function (l, i) { return isBlock(Math.floor(i / SIZE), i % SIZE) || l === answerAt(i); });
    if (correct) return solved();
    if (!warnedFull) {
      warnedFull = true;
      Quill.toast("Not quite! Keep trying.", 2200);
    }
  }

  function solved() {
    state.done = true;
    if (!state.recorded) {
      state.recorded = true;
      stats.solved++;
      if (!state.helped) {
        stats.streak = stats.lastSolvedDay === day - 1 ? stats.streak + 1 : 1;
        stats.maxStreak = Math.max(stats.maxStreak, stats.streak);
        stats.lastSolvedDay = day;
        if (stats.best === null || state.seconds < stats.best) stats.best = state.seconds;
      }
      Quill.save(STATS_KEY, stats);
    }
    save();
    render();
    tick();
    setTimeout(showDone, 900);
  }

  function showDone() {
    document.getElementById("done-text").textContent = state.helped
      ? "You finished the Mini in " + Quill.formatTime(state.seconds) + " (with a little help)."
      : "You solved the Mini in " + Quill.formatTime(state.seconds) + ".";
    var streak = stats.lastSolvedDay !== null && stats.lastSolvedDay >= day - 1 ? stats.streak : 0;
    document.getElementById("mini-stats").innerHTML = [
      [stats.solved, "Solved"],
      [stats.best === null ? "–" : Quill.formatTime(stats.best), "Best Time"],
      [streak, "Streak"],
    ].map(function (s) {
      return '<div class="stat"><div class="num">' + s[0] + '</div><div class="lbl">' + s[1] + "</div></div>";
    }).join("");
    Quill.openModal("done-modal");
  }

  document.getElementById("share-btn").addEventListener("click", function () {
    Quill.share("I solved The Quill Mini #" + (day + 1) + " in " + Quill.formatTime(state.seconds) + "! ✏️");
  });

  // ---------- Timer & pausing ----------
  var timerText = document.getElementById("timer-text");
  var startCover = document.getElementById("start-cover");
  var pauseCover = document.getElementById("pause-cover");

  function tick() {
    timerText.textContent = Quill.formatTime(state.seconds);
    document.getElementById("pause-icon").style.display = state.done ? "none" : "";
  }
  setInterval(function () {
    if (state.started && !state.done && !paused && !document.hidden) {
      state.seconds++;
      tick();
      if (state.seconds % 5 === 0) save();
    }
    if (Quill.puzzleNumber() !== day && (!state.started || state.done)) location.reload();
  }, 1000);

  function setPaused(p) {
    if (state.done || !state.started) return;
    paused = p;
    pauseCover.classList.toggle("show", p);
    save();
  }
  document.getElementById("timer").addEventListener("click", function () { setPaused(!paused); });
  document.getElementById("resume-btn").addEventListener("click", function () { setPaused(false); });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) setPaused(true);
  });

  document.getElementById("start-btn").addEventListener("click", function () {
    state.started = true;
    startCover.classList.remove("show");
    save();
    render();
  });

  // ---------- Init ----------
  document.getElementById("date").textContent = Quill.prettyDate();
  document.getElementById("byline").textContent =
    (puzzle.title ? "“" + puzzle.title + "” " : "") + "by " + (puzzle.author || "The Quill Staff");
  selectWord(ordered[0]);
  tick();
  if (!state.started) startCover.classList.add("show");
  else if (state.done) setTimeout(showDone, 400);
  else setPaused(true); // returning mid-solve: let them un-pause when ready
})();
