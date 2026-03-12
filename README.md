# Knight — Chess Helper

![Uploading Knight-Banner.png…]()

Chrome extension that plays chess on chess.com like a human. Auto-plays moves, shows best move hints, and mimics real human behavior to avoid detection.

---

## Features

- Auto-play — engine plays moves automatically on your behalf
- Best move hint — shows the best move with an animated arrow on the board
- Opening book — first moves played from Lichess Masters database
- Adjustable ELO — set strength from 1000 to 1500 with a slider
- Human-like mouse movement — Bezier curves, fake hesitations, wrong piece hovers
- Adaptive think time — fast in obvious positions, slow in sharp tactical ones
- Recapture reflex — instant response after opponent captures
- Time pressure mode — detects your clock and speeds up automatically
- Background analysis — engine thinks while opponent is moving
- Move log — tracks every played move with game phase indicator
- Draggable floating UI — lives anywhere on screen, out of your way

---

## Installation

1. Download or clone this repository
2. Go to chrome://extensions
3. Enable Developer mode
4. Click Load unpacked
5. Select the project folder

---

## How it works

Reads the board from the DOM, builds a FEN string, sends it to Stockfish for analysis. Opening moves come from the Lichess Masters database. All moves are executed through simulated pointer events with curved mouse paths and randomized timing so it looks like a real person playing.

| ELO  | Depth | Mistakes | Blunders |
|------|-------|----------|----------|
| 1000 | 3     | 30%      | 8%       |
| 1200 | 5     | 19%      | 5%       |
| 1300 | 5     | 18%      | 4%       |
| 1500 | 8     | 8%       | 2%       |

---

## Disclaimer

For educational purposes only. Using cheats on chess.com violates their Terms of Service and may result in a permanent ban. Use at your own risk.
