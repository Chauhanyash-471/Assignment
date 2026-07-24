(function () {
  var KEY = "pythonist:cleared";
  var TOTAL = 10;

  function getCleared() {
    try {
      var raw = localStorage.getItem(KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr.filter(function (n) { return Number.isInteger(n); }) : [];
    } catch (e) { return []; }
  }

  function setCleared(arr) {
    try { localStorage.setItem(KEY, JSON.stringify(arr)); } catch (e) {}
  }

  var RANKS = {1:"F",2:"E",3:"D",4:"D+",5:"C",6:"C+",7:"B",8:"B+",9:"A",10:"S"};

  function highestRank(cleared) {
    if (!cleared.length) return "Unranked";
    var top = Math.max.apply(null, cleared);
    return "Rank " + RANKS[top];
  }

  function computeStats(cleared) {
    var count = cleared.length;
    return {
      count: count,
      focus: Math.min(100, count * 10),
      caffeine: Math.max(12, 100 - count * 8),
      marks: Math.min(100, count * 10),
      bossHp: Math.max(0, 100 - count * 10),
    };
  }

  function paintStatusWindow(cleared) {
    var s = computeStats(cleared);

    var lv = document.getElementById("stat-lv");
    var rank = document.getElementById("stat-rank");
    var trials = document.getElementById("stat-trials");
    var focusFill = document.getElementById("bar-focus");
    var focusPct = document.getElementById("bar-focus-pct");
    var caffFill = document.getElementById("bar-caffeine");
    var caffPct = document.getElementById("bar-caffeine-pct");
    var marksFill = document.getElementById("bar-marks");
    var marksPct = document.getElementById("bar-marks-pct");
    var bossFill = document.getElementById("bar-boss");
    var bossPct = document.getElementById("bar-boss-pct");
    var bossStatus = document.getElementById("boss-status");

    if (lv) lv.textContent = "LV. " + s.count;
    if (rank) rank.textContent = highestRank(cleared);
    if (trials) trials.textContent = s.count + " / " + TOTAL + " cleared";
    if (focusFill) focusFill.style.width = s.focus + "%";
    if (focusPct) focusPct.textContent = s.focus + "%";
    if (caffFill) caffFill.style.width = s.caffeine + "%";
    if (caffPct) caffPct.textContent = s.caffeine + "%";
    if (marksFill) marksFill.style.width = s.marks + "%";
    if (marksPct) marksPct.textContent = s.marks + "%";
    if (bossFill) {
      bossFill.style.width = s.bossHp + "%";
      bossFill.classList.toggle("defeated", s.bossHp === 0);
    }
    if (bossPct) bossPct.textContent = s.bossHp === 0 ? "DEFEATED" : s.bossHp + "%";
    if (bossStatus) bossStatus.textContent = s.bossHp === 0 ? "" : "— HP";

    cleared.forEach(function (n) {
      var card = document.querySelector('.skill[data-trial="' + n + '"]');
      if (card) {
        card.classList.add("cleared");
        var flag = card.querySelector(".cleared-flag");
        if (flag) flag.hidden = false;
      }
      var node = document.querySelector('.dot[data-trial="' + n + '"]');
      if (node) node.classList.add("cleared");
    });

    var resetBtn = document.getElementById("reset-progress");
    if (resetBtn) {
      resetBtn.hidden = s.count === 0;
    }
  }

  function paintMiniHud(cleared) {
    var el = document.getElementById("mini-hud");
    if (!el) return;
    var s = computeStats(cleared);
    el.textContent = "LV. " + s.count + " \u00b7 Vibhu HP " + (s.bossHp === 0 ? "DEFEATED" : s.bossHp + "%");
  }

  function showToast(html) {
    var existing = document.getElementById("lvl-toast");
    if (existing) existing.remove();
    var el = document.createElement("div");
    el.id = "lvl-toast";
    el.innerHTML = html;
    document.body.appendChild(el);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { el.classList.add("show"); });
    });
    setTimeout(function () {
      el.classList.remove("show");
      setTimeout(function () { el.remove(); }, 500);
    }, 5200);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var role = document.body.getAttribute("data-role");

    // ---------------- TRIAL PAGE ----------------
    if (role === "trial") {
      var n = parseInt(document.body.getAttribute("data-trial-n"), 10);
      var mastery = document.querySelector(".mastery");
      var badge = document.querySelector(".mastery .m-top");

      paintMiniHud(getCleared());

      if (mastery && n) {
        var already = getCleared().indexOf(n) !== -1;
        if (already && badge) badge.textContent = "\u2726 Mastery confirmed (saved to this device)";

        var obs = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) {
              var before = getCleared();
              if (before.indexOf(n) === -1) {
                var after = before.concat([n]);
                setCleared(after);
                if (badge) badge.textContent = "\u2726 Mastery confirmed (saved to this device)";
                paintMiniHud(after);

                var s = computeStats(after);
                var bossLine = s.bossHp === 0
                  ? "<b>Vibhu Gautam \u2014 DEFEATED.</b> Final grade: S."
                  : "Vibhu Gautam HP now <b>" + s.bossHp + "%</b>.";
                showToast(
                  '<div class="tt-label">\u2726 LEVEL UP \u2014 RANK ' + RANKS[n] + '</div>' +
                  '<div class="tt-body">+10% marks reclaimed. ' + bossLine + '</div>'
                );
              }
              obs.unobserve(mastery);
            }
          });
        }, { threshold: .6 });
        obs.observe(mastery);
      }
    }

    // ---------------- INDEX PAGE ----------------
    if (role === "index") {
      paintStatusWindow(getCleared());

      var resetBtn = document.getElementById("reset-progress");
      if (resetBtn) {
        resetBtn.addEventListener("click", function (e) {
          e.preventDefault();
          if (confirm("Abandon this run? All cleared Trials will reset to Unranked.")) {
            setCleared([]);
            location.reload();
          }
        });
      }
    }
  });
})();
