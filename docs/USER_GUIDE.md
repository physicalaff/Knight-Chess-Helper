<div align="center">

<img src="../assets/Knight.png" width="90" alt="Knight">

# 📘 Knight Chess Helper — User Guide

*Everything you need to install, understand and get the most out of Knight.*

</div>

---

## 📑 Contents

> Click any line to jump directly to that part of the guide.

1. [🚀 Overview](#-overview)
2. [🧩 Core Features](#-core-features)
3. [🖥️ The Dashboard](#️-the-dashboard)
4. [♟️ Modes](#️-modes)
5. [⚙️ Settings & Strength Presets](#️-settings--strength-presets)
6. [🎨 Themes](#-themes)
7. [🛠️ Installation](#️-installation)
8. [❓ Troubleshooting](#-troubleshooting)
9. [💬 FAQ](#-faq)

---

## 🚀 Overview

Knight is a local-first analysis assistant that injects a clean, draggable dashboard into Chess.com. It uses a **local Stockfish WebAssembly engine**, so every evaluation happens on your own machine — fast, private and offline-capable.

Use it to **study positions, review your games, prepare openings and train** against adjustable engine strength.

[↑ Back to contents](#-contents)

---

## 🧩 Core Features

| Feature | What it does |
|---|---|
| 🧠 **Local Stockfish engine** | Runs entirely in your browser via WebAssembly — no servers, no tracking |
| 📊 **Position strength bar** | Live centipawn evaluation with a clear numeric readout |
| 🎯 **Best-move hints** | Draws the engine's recommended move as an arrow on the board |
| 📖 **Opening book** | Recognises the opening and suggests theory-backed continuations |
| 📈 **Statistics** | Tracks moves played, current game phase and game history offline |
| 🌍 **Languages** | Full English and Russian interface |

[↑ Back to contents](#-contents)

---

## 🖥️ The Dashboard

Knight injects a floating, draggable panel with a redesigned, **icon-rail** layout:

- **Left rail** — switch between modes (Game, Rage, Analysis, Developer) and open Settings.
- **Status pills** — show your colour and the current game phase (Opening · Middlegame · Endgame).
- **Position strength** — the evaluation bar and number at the top of the panel.
- **Live stats** — moves played, clock and phase at a glance.
- **Move history** — a running list of the latest moves.
- **Actions** — request a hint or reset the panel.

The whole panel is available in both **dark** and **light** themes (see [Themes](#-themes)).

[↑ Back to contents](#-contents)

---

## ♟️ Modes

| Mode | Purpose |
|---|---|
| 🎮 **Game** | The standard analysis view — evaluation, hints and stats while you play or review. |
| 🔥 **Rage** | Higher engine strength for deeper analysis of sharp positions. |
| 📊 **Analysis** | A dedicated panel for stepping through a game's key moments and evaluations. |
| 〈〉 **Developer** | Diagnostics and debug information for contributors. |

[↑ Back to contents](#-contents)

---

## ⚙️ Settings & Strength Presets

Open **Settings** from the gear icon at the bottom of the left rail. From here you can choose your language, theme, and engine strength.

Strength presets adjust how deeply and how strongly the engine plays — handy when you want a training partner around your own level rather than full-strength Stockfish:

| Preset | Engine depth | Style |
|---|:--:|---|
| **Beginner** | Low | Gentle, forgiving — great for learning |
| **Intermediate** | Medium | Balanced club-level strength |
| **Advanced** | High | Strong, near full-engine analysis |
| **Aggressive** | Medium | Sharp, tactical preference |
| **Positional** | Medium | Slow, solid, strategic preference |
| **Custom** | Adjustable | Unlocks sliders to fine-tune strength yourself |

[↑ Back to contents](#-contents)

---

## 🎨 Themes

Knight ships with a polished **theme switcher** in the Settings tab:

- 🌙 **Dark** — the default near-black, indigo-accented interface.
- ☀️ **Light** — a clean, bright variant for daytime use.

There is also a **Rage / Shadow Fiend** visual style with a matte-red palette, an animated avatar and optional theme music (which auto-pauses when you switch tabs). It's purely cosmetic.

[↑ Back to contents](#-contents)

---

## 🛠️ Installation

Knight runs locally and is loaded as an **unpacked extension**.

### Step 1 — Download the release
Go to the [Releases](https://github.com/physicalaff/Knight-Chess-Helper/releases) page and download the latest `Knight-Chess-Helper-vX.X.X.zip` from the **Assets** section.

![Download release](screenshots/Screenshot_1.png)

### Step 2 — Extract the archive
Extract the ZIP into a dedicated folder (e.g. `Knight-Chess`).

![Extract archive](screenshots/Screenshot_2.png)

### Step 3 — Open the Chrome menu
In Chrome, click the **⋮** menu in the top-right corner.

![Open Chrome menu](screenshots/Screenshot_3.png)

### Step 4 — Go to Extensions
Hover over **Extensions** to open the submenu.

![Extensions](screenshots/Screenshot_4.png)

### Step 5 — Manage Extensions
Click **Manage Extensions** to open `chrome://extensions/`.

![Manage Extensions](screenshots/Screenshot_5.png)

### Step 6 — Enable Developer Mode
Toggle **Developer mode** **ON** (top-right of the Extensions page).

![Developer Mode](screenshots/Screenshot_6.png)

### Step 7 — Load unpacked
Click **Load unpacked** (top-left).

![Load Unpacked](screenshots/Screenshot_7.png)

### Step 8 — Select the folder
Pick the **Knight-Chess** folder you extracted in Step 2.

![Select folder](screenshots/Screenshot_8.png)

### Step 9 — Verify it's active
The **Knight Chess Helper** card should appear — make sure its toggle is **ON**.

![Active](screenshots/Screenshot_9.png)

✅ You're ready! Open [Chess.com](https://www.chess.com/) and click the floating Knight icon to open the dashboard.

[↑ Back to contents](#-contents)

---

## ❓ Troubleshooting

> [!IMPORTANT]
> **The language screen is unresponsive.**
> Update to the latest release — this was fixed in earlier versions.
>
> **The panel is cut off at the bottom.**
> Scroll inside the panel; adaptive scrolling is enabled.
>
> **The clock shows the wrong time.**
> Make sure you're in a live game. The clock aligns to the bottom player; toggle the panel off and on to reset.

[↑ Back to contents](#-contents)

---

## 💬 FAQ

**Is my data sent anywhere?**
No. The engine runs locally via WebAssembly; your games never leave your machine.

**Does it work offline?**
Yes — once installed, analysis works without an internet connection.

**Which browsers are supported?**
All Chromium browsers (Chrome, Edge, Brave, Opera). Firefox support is experimental.

**How should I use it?**
For analysis, study, opening prep and reviewing your own games. Please respect the Terms of Service of any platform where you play.

[↑ Back to contents](#-contents)
