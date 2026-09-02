# Jewels Blitz 5 — Standalone offline build

Classic 2D match-3 puzzle game built with **Phaser** (Softgames), fully downloaded
from GameSnacks and made playable offline with zero external dependencies.

## Run

```bash
python3 -m http.server 8802
# open http://localhost:8802
```

## Offline modifications

| File | Change |
|---|---|
| `index.html` | GameSnacks CDN SDK replaced by local `game-driver.js` |
| `game-driver.js` | NEW — local driver: async base64 storage, auto-granted ads, sound on |
| `js/main.js` | A/B split-test API call neutralized (data: URL), saves untouched |
| `js/gamesnackswrapper_v2.17.1.js` | Google Fonts import pointed to local CSS |

Verified: 0 console errors, 0 requests outside localhost, real gameplay reached.

## Controls

- **Tap / click** — swap cookies, navigate menus. Keyboard not required.

*Educational use only — game © its respective authors.*
