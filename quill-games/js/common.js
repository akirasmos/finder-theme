/* Shared helpers for The Quill Games. */
(function () {
  // The first day of puzzles. Puzzle #1 is shown on this date; each day after
  // moves on by one. Change this if you launch on a different day.
  var LAUNCH_DATE = "2026-09-26";

  function localDayNumber(date) {
    // Days since 1970-01-01 in the player's local timezone, so the puzzle
    // changes at their midnight rather than UTC midnight.
    return Math.floor(
      (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())) / 86400000
    );
  }

  function puzzleNumber(date) {
    var p = LAUNCH_DATE.split("-").map(Number);
    var launch = localDayNumber(new Date(p[0], p[1] - 1, p[2]));
    return Math.max(0, localDayNumber(date || new Date()) - launch);
  }

  // Today's date in the player's timezone as "YYYY-MM-DD", used to look up
  // scheduled puzzles.
  function dateKey(date) {
    var d = date || new Date();
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function load(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* storage unavailable (private mode, etc.) — game still works */
    }
  }

  function toast(message, ms) {
    var host = document.querySelector(".toast-host");
    if (!host) {
      host = document.createElement("div");
      host.className = "toast-host";
      host.setAttribute("aria-live", "polite");
      document.body.appendChild(host);
    }
    var el = document.createElement("div");
    el.className = "toast";
    el.textContent = message;
    host.prepend(el);
    setTimeout(function () {
      el.style.opacity = "0";
      setTimeout(function () { el.remove(); }, 300);
    }, ms || 1500);
  }

  function openModal(id) {
    var m = document.getElementById(id);
    if (m) m.classList.add("open");
  }

  function closeModal(id) {
    var m = document.getElementById(id);
    if (m) m.classList.remove("open");
  }

  // Close modals with the X, by clicking the backdrop, or with Escape.
  document.addEventListener("click", function (e) {
    if (e.target.classList.contains("modal-backdrop")) {
      e.target.classList.remove("open");
    }
    var closer = e.target.closest("[data-close]");
    if (closer) closer.closest(".modal-backdrop").classList.remove("open");
    var opener = e.target.closest("[data-open]");
    if (opener) openModal(opener.getAttribute("data-open"));
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal-backdrop.open").forEach(function (m) {
        m.classList.remove("open");
      });
    }
  });

  function share(text) {
    if (navigator.share && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
      navigator.share({ text: text }).catch(function () {});
      return;
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(
        function () { toast("Copied results to clipboard"); },
        function () { toast("Couldn't copy results"); }
      );
    } else {
      toast("Couldn't copy results");
    }
  }

  function prettyDate(date) {
    return (date || new Date()).toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatTime(seconds) {
    var m = Math.floor(seconds / 60);
    var s = seconds % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  var BACKSPACE_ICON =
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H7.07L2.4 12l4.66-7H22v14zm-11.59-2L14 13.41 17.59 17 19 15.59 15.41 12 19 8.41 17.59 7 14 10.59 10.41 7 9 8.41 12.59 12 9 15.59z"/></svg>';

  // Builds a QWERTY keyboard. onKey receives "a".."z", "enter" or "backspace".
  // Pass withEnter=false to leave the Enter key out.
  function buildKeyboard(container, onKey, withEnter) {
    var rows = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
    container.innerHTML = "";
    rows.forEach(function (letters, i) {
      var row = document.createElement("div");
      row.className = "kb-row";
      if (i === 1) row.appendChild(spacer());
      if (i === 2) row.appendChild(withEnter === false ? spacer() : key("enter", "Enter", true));
      letters.split("").forEach(function (l) { row.appendChild(key(l, l)); });
      if (i === 1) row.appendChild(spacer());
      if (i === 2) row.appendChild(key("backspace", BACKSPACE_ICON, true));
      container.appendChild(row);
    });

    function spacer() {
      var s = document.createElement("div");
      s.className = "spacer";
      return s;
    }
    function key(value, label, wide) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "key" + (wide ? " wide" : "");
      b.dataset.key = value;
      b.innerHTML = label;
      if (value === "backspace") b.setAttribute("aria-label", "Backspace");
      b.addEventListener("click", function (e) {
        e.preventDefault();
        b.blur();
        onKey(value);
      });
      return b;
    }
  }

  window.Quill = {
    buildKeyboard: buildKeyboard,
    puzzleNumber: puzzleNumber,
    dateKey: dateKey,
    LAUNCH_DATE: LAUNCH_DATE,
    load: load,
    save: save,
    toast: toast,
    openModal: openModal,
    closeModal: closeModal,
    share: share,
    prettyDate: prettyDate,
    formatTime: formatTime,
  };
})();
