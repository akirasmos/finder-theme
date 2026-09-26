/* Quirdle — guess the five-letter word in six tries. */
(function () {
  var WORD_LENGTH = 5;
  var MAX_GUESSES = 6;
  var STATE_KEY = "quirdle-state";
  var STATS_KEY = "quirdle-stats";
  var WIN_WORDS = ["Genius", "Magnificent", "Impressive", "Splendid", "Great", "Phew"];

  var answers = window.QUIRDLE_ANSWERS;
  var valid = new Set(window.QUIRDLE_VALID.split(" ").concat(answers));

  var day = Quill.puzzleNumber();
  var solution = answers[day % answers.length];

  var state = Quill.load(STATE_KEY, null);
  if (!state || state.day !== day) {
    state = { day: day, guesses: [], status: "playing" };
  }
  var stats = Quill.load(STATS_KEY, {
    played: 0, won: 0, streak: 0, maxStreak: 0,
    dist: [0, 0, 0, 0, 0, 0], lastWonDay: null,
  });

  var current = "";
  var busy = false; // true while tiles are flipping

  var boardEl = document.getElementById("board");
  var rows = [];

  // ---------- Board ----------
  for (var r = 0; r < MAX_GUESSES; r++) {
    var row = document.createElement("div");
    row.className = "row";
    for (var c = 0; c < WORD_LENGTH; c++) {
      var tile = document.createElement("div");
      tile.className = "tile";
      row.appendChild(tile);
    }
    boardEl.appendChild(row);
    rows.push(row);
  }

  // ---------- Scoring ----------
  // Returns an array like ["correct","absent","present",...]. Handles
  // repeated letters the same way the original game does: greens first,
  // then yellows only while unmatched copies of that letter remain.
  function evaluate(guess) {
    var result = new Array(WORD_LENGTH).fill("absent");
    var remaining = {};
    for (var i = 0; i < WORD_LENGTH; i++) {
      if (guess[i] === solution[i]) {
        result[i] = "correct";
      } else {
        remaining[solution[i]] = (remaining[solution[i]] || 0) + 1;
      }
    }
    for (var j = 0; j < WORD_LENGTH; j++) {
      if (result[j] !== "correct" && remaining[guess[j]]) {
        result[j] = "present";
        remaining[guess[j]]--;
      }
    }
    return result;
  }

  // ---------- Rendering ----------
  function paintRow(index, word, result, animate, done) {
    var tiles = rows[index].children;
    for (var i = 0; i < WORD_LENGTH; i++) {
      (function (i) {
        var t = tiles[i];
        t.textContent = word[i] || "";
        if (!result) return;
        if (!animate) {
          t.className = "tile " + result[i];
          return;
        }
        setTimeout(function () {
          t.classList.add("flip");
          setTimeout(function () { t.className = "tile flip " + result[i]; }, 250);
        }, i * 300);
      })(i);
    }
    if (animate && done) setTimeout(done, WORD_LENGTH * 300 + 250);
  }

  var RANK = { absent: 1, present: 2, correct: 3 };
  function paintKeyboard() {
    var best = {};
    state.guesses.forEach(function (g) {
      var res = evaluate(g);
      for (var i = 0; i < WORD_LENGTH; i++) {
        if (!best[g[i]] || RANK[res[i]] > RANK[best[g[i]]]) best[g[i]] = res[i];
      }
    });
    document.querySelectorAll(".key").forEach(function (k) {
      var s = best[k.dataset.key];
      k.classList.remove("correct", "present", "absent");
      if (s) k.classList.add(s);
    });
  }

  function paintCurrent() {
    var row = rows[state.guesses.length];
    if (!row) return;
    for (var i = 0; i < WORD_LENGTH; i++) {
      var t = row.children[i];
      var ch = current[i] || "";
      if (t.textContent !== ch) {
        t.textContent = ch;
        t.className = "tile" + (ch ? " filled" : "");
      }
    }
  }

  // ---------- Input ----------
  function onKey(key) {
    if (busy || state.status !== "playing") return;
    if (key === "enter") return submit();
    if (key === "backspace") {
      current = current.slice(0, -1);
    } else if (/^[a-z]$/.test(key) && current.length < WORD_LENGTH) {
      current += key;
    }
    paintCurrent();
  }

  function shake(msg) {
    var row = rows[state.guesses.length];
    row.classList.remove("shake");
    void row.offsetWidth; // restart animation
    row.classList.add("shake");
    Quill.toast(msg);
  }

  function submit() {
    if (current.length < WORD_LENGTH) return shake("Not enough letters");
    if (!valid.has(current)) return shake("Not in word list");

    var guess = current;
    var index = state.guesses.length;
    current = "";
    state.guesses.push(guess);
    var won = guess === solution;
    if (won) state.status = "won";
    else if (state.guesses.length === MAX_GUESSES) state.status = "lost";
    Quill.save(STATE_KEY, state);

    busy = true;
    paintRow(index, guess, evaluate(guess), true, function () {
      busy = false;
      paintKeyboard();
      if (state.status !== "playing") finish(true);
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (document.querySelector(".modal-backdrop.open")) return;
    if (e.key === "Enter") { e.preventDefault(); onKey("enter"); }
    else if (e.key === "Backspace") onKey("backspace");
    else if (/^[a-zA-Z]$/.test(e.key)) onKey(e.key.toLowerCase());
  });

  Quill.buildKeyboard(document.getElementById("keyboard"), onKey);

  // ---------- Finish & stats ----------
  function recordStats() {
    if (state.recorded) return;
    stats.played++;
    if (state.status === "won") {
      stats.won++;
      stats.streak = stats.lastWonDay === day - 1 ? stats.streak + 1 : 1;
      stats.maxStreak = Math.max(stats.maxStreak, stats.streak);
      stats.dist[state.guesses.length - 1]++;
      stats.lastWonDay = day;
    } else {
      stats.streak = 0;
    }
    state.recorded = true;
    Quill.save(STATS_KEY, stats);
    Quill.save(STATE_KEY, state);
  }

  function finish(justNow) {
    recordStats();
    if (!justNow) return;
    if (state.status === "won") {
      Quill.toast(WIN_WORDS[state.guesses.length - 1], 2000);
      var tiles = rows[state.guesses.length - 1].children;
      for (var i = 0; i < WORD_LENGTH; i++) {
        (function (t, i) {
          setTimeout(function () { t.classList.remove("flip"); t.classList.add("bounce"); }, i * 100);
        })(tiles[i], i);
      }
    } else {
      Quill.toast(solution.toUpperCase(), 3000);
    }
    setTimeout(showStats, 2200);
  }

  function showStats() {
    var winPct = stats.played ? Math.round((stats.won / stats.played) * 100) : 0;
    // A streak only counts if yesterday's or today's puzzle was won.
    var streak = stats.lastWonDay !== null && stats.lastWonDay >= day - 1 ? stats.streak : 0;
    document.getElementById("stats-row").innerHTML = [
      [stats.played, "Played"], [winPct, "Win %"],
      [streak, "Current Streak"], [stats.maxStreak, "Max Streak"],
    ].map(function (s) {
      return '<div class="stat"><div class="num">' + s[0] + '</div><div class="lbl">' + s[1] + "</div></div>";
    }).join("");

    var max = Math.max.apply(null, stats.dist.concat(1));
    document.getElementById("dist").innerHTML = stats.dist.map(function (n, i) {
      var hl = state.status === "won" && state.guesses.length === i + 1 ? " hl" : "";
      return '<div class="dist-row"><span>' + (i + 1) + '</span><div class="bar' + hl +
        '" style="width:' + Math.max(7, (n / max) * 100) + '%">' + n + "</div></div>";
    }).join("");

    var finished = state.status !== "playing";
    document.getElementById("finished").hidden = !finished;
    var reveal = document.getElementById("reveal-word");
    reveal.hidden = state.status !== "lost";
    reveal.textContent = "The word was " + solution.toUpperCase();
    Quill.openModal("stats-modal");
  }

  function shareText() {
    var emoji = { correct: "🟩", present: "🟨", absent: "⬜" };
    var score = state.status === "won" ? state.guesses.length : "X";
    var grid = state.guesses.map(function (g) {
      return evaluate(g).map(function (r) { return emoji[r]; }).join("");
    }).join("\n");
    return "Quirdle #" + (day + 1) + " " + score + "/" + MAX_GUESSES + "\n\n" + grid;
  }

  document.getElementById("share-btn").addEventListener("click", function () {
    Quill.share(shareText());
  });
  document.getElementById("stats-btn").addEventListener("click", showStats);

  // Countdown to the next puzzle (local midnight).
  setInterval(function () {
    var now = new Date();
    var next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    var s = Math.floor((next - now) / 1000);
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    document.getElementById("countdown").textContent =
      pad(Math.floor(s / 3600)) + ":" + pad(Math.floor((s % 3600) / 60)) + ":" + pad(s % 60);
    if (Quill.puzzleNumber() !== day) location.reload();
  }, 1000);

  // ---------- Restore saved game ----------
  state.guesses.forEach(function (g, i) { paintRow(i, g, evaluate(g), false); });
  paintKeyboard();
  if (state.status !== "playing") {
    finish(false);
    setTimeout(showStats, 400);
  } else if (!Quill.load("quirdle-seen-help", false)) {
    Quill.save("quirdle-seen-help", true);
    Quill.openModal("help-modal");
  }
})();
