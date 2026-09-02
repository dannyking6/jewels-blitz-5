/**
 * game-driver.js — Driver local hors-ligne pour Jewels Blitz 5.
 * Expose window.GameSnacks avec la surface attendue par le wrapper Softgames local :
 *  - audio.isEnabled() -> bool ; audio.subscribe(cb)
 *  - storage.setItem(k, v) async ; storage.getItem(k) async (v = base64(JSON), null sinon)
 *  - ad.break(opts) : reward -> beforeReward(showAdFn) -> [show] -> adViewed/afterAd/adBreakDone
 *                     autre  -> beforeAd -> afterAd -> adBreakDone
 *  - game.ready/firstFrameReady/gameOver/levelComplete/onPause/onResume ; score.update
 */
(function () {
  "use strict";
  const PREFIX = "local_save_";

  const audio = {
    _enabled: true,
    _subs: [],
    isEnabled: function () { return this._enabled; },
    subscribe: function (cb) { if (typeof cb === "function") this._subs.push(cb); },
    _notify: function () { const s = this._enabled; this._subs.forEach(function (cb) { try { cb(s); } catch (e) {} }); },
  };

  const storage = {
    async getItem(k) {
      try { return localStorage.getItem(PREFIX + String(k)); } catch (e) { return null; }
    },
    async setItem(k, v) {
      try { localStorage.setItem(PREFIX + String(k), String(v)); } catch (e) {}
    },
  };

  function finish(o, status) {
    o.adBreakDone && o.adBreakDone({ breakStatus: status });
  }

  const ad = {
    break: function (o) {
      o = o || {};
      setTimeout(function () {
        if (o.type === "reward") {
          let shown = false;
          const showAdFn = function () {
            if (shown) return;
            shown = true;
            o.beforeAd && o.beforeAd();
            setTimeout(function () {
              o.adViewed && o.adViewed();
              o.afterAd && o.afterAd();
              finish(o, "viewed");
            }, 250);
          };
          o.beforeReward && o.beforeReward(showAdFn);
          setTimeout(function () {
            if (shown) return;
            shown = true;
            o.adViewed && o.adViewed();
            o.afterAd && o.afterAd();
            finish(o, "viewed");
          }, 700);
        } else {
          o.beforeAd && o.beforeAd();
          setTimeout(function () {
            o.afterAd && o.afterAd();
            finish(o, "viewed");
          }, 150);
        }
      }, 30);
    },
  };

  const game = {
    ready: function () { console.log("[GameDriver] game.ready()"); },
    firstFrameReady: function () { console.log("[GameDriver] game.firstFrameReady()"); },
    gameOver: function () { console.log("[GameDriver] game.gameOver()"); },
    levelComplete: function (l) { console.log("[GameDriver] game.levelComplete(" + l + ")"); },
    onPause: function (cb) {
      document.addEventListener("visibilitychange", function () { if (document.hidden) try { cb(); } catch (e) {} });
    },
    onResume: function (cb) {
      document.addEventListener("visibilitychange", function () { if (!document.hidden) try { cb(); } catch (e) {} });
    },
  };

  const score = { update: function (s) { console.log("[GameDriver] score.update(" + s + ")"); } };

  window.GameSnacks = { ad: ad, audio: audio, game: game, score: score, storage: storage };
  console.log("[GameDriver] driver local charge (hors-ligne)");
})();
