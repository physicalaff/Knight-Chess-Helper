# <img src="../assets/Knight.png" width="45" valign="middle"> Knight — Chess Assistant User Guide

Welcome to the official user guide for **Knight — Chess Assistant**. This guide provides an in-depth explanation of all the features, emulated human behaviors, customization options, and installation.

---

## 📊 Dashboard Overview

The Knight dashboard is a floating, draggable glassmorphic panel injected directly into the Chess.com interface.

![Dashboard Overview](screenshots/dashboard.png)
*Placeholder: Drop your screenshot of the main dashboard here as `dashboard.png`*

### Core UI Indicators:
*   **Position Strength (Evaluation Bar):** A real-time centipawn visual bar. If you are playing as White, green represents advantage, and red represents disadvantage. The text displays the direct eval (e.g., `+1.2` or `-0.8`).
*   **Active Indicator:** Glows green when the auto-play system is actively making moves, and pulses neon-red when **Shadow Fiend Mode** is active.
*   **Engine Statistics:**
    *   **Eval:** Shows current engine evaluation.
    *   **Moves:** Total moves played in the current session.
    *   **Clock:** Displays your active game clock time (recalculated color-agnostically).
    *   **Phase:** Identifies current game phase (`Opening`, `Middlegame`, or `Endgame`).

---

## ⚙️ Human Behavior Presets

Knight features five calibrated presets to match human playstyles of various strengths. These can be adjusted on the fly in the **Settings** panel (accessed via the gear icon ⚙️).

| Profile | Depth | Blunder % | Mouse Speed | Think Variance | Description / Playstyle |
| :--- | :---: | :---: | :---: | :---: | :--- |
| 👶 **Beginner** | 3 plies | 12% | 0.7x | 0.8x | Simulates casual, novice play with higher blunder chance and slower mouse movements. |
| 📈 **Intermediate** | 5 plies | 5% | 1.0x | 1.0x | Emulates standard club-level players. Balanced pacing and moderate mouse speeds. |
| 🎓 **Advanced** | 8 plies | 1.5% | 1.3x | 1.3x | Competitive tournament-level play. Fast mouse, deep search depth, minimal mistakes. |
| ⚔️ **Aggressive** | 6 plies | 2% | 1.2x | 0.4x | Sharp, tactical, fast-paced play. Decides moves quickly with low variance. |
| 🛡️ **Positional** | 6 plies | 1% | 0.9x | 1.2x | Deep strategic maneuvering. Decides slowly, calculating quiet, solid moves. |
| ⚙️ **Custom** | *Manual* | *Manual* | *Manual* | *Manual* | Unlocks granular sliders for blunder rate, mouse speed, and thinking variance. |

---

## 🛡️ Anti-Ban 3.0 Emulations

To bypass chess platforms' strict anti-cheating algorithms, Knight implements deep behavioral emulations that replicate natural human patterns.

![Custom Settings Sliders](screenshots/custom_settings.png)
*Placeholder: Drop your screenshot of the Custom settings sliders here as `custom_settings.png`*

### 1. Human Mouse Paths (Bezier Curves)
Unlike simple bots that click instantly or move in straight lines, Knight simulates human arm movements using cubic Bezier curves combined with micro-tremors (physical hand vibrations) and deceleration curves.

### 2. Emulated Fatigue
As the game progresses, a human player gets tired. Past move 15, Knight automatically adds a **2.5% cumulative delay** per turn to thinking times, simulating cognitive fatigue.

### 3. Random Distractions
Humans get distracted or step away from the screen. Past move 6, there is a small random chance (3%) that the extension will simulate a distraction, taking a **long pause of 8 to 15 seconds** before making a move.

### 4. Dynamic Search Depth
Constantly calculating to the same depth (e.g., exactly 8 plies) is a signature of bot behavior. When active, Knight fluctuates Stockfish's target depth by **$\pm 2$ plies** randomly on every move.

### 5. Simulating Misclicks
Knight occasionally simulates a physical misclick. It moves the mouse cursor to a neighboring square of the starting piece, pauses, cancels the drag, and then plays the correct move.

### 6. Pondering
On your opponent's turn, Knight pre-calculates responses in the background. If the opponent plays the expected move, the аssistant can play the pre-calculated response nearly instantly (premove).

---

## 🌌 Shadow Fiend (ZXC) Mode

Activating the legendary **Shadow Fiend Mode** shifts the assistant into a high-performance, dark-matte neon-red theme.

![Shadow Fiend Mode Active](screenshots/sf_mode.png)
*Placeholder: Drop your screenshot of SF Mode active here as `sf_mode.png`*

### Features:
*   **Animated SF Avatar:** Replaces panel icons with the animated Shadow Fiend GIF (`assets/sf.gif`).
*   **Audio Integration:** Plays the theme track (`assets/sf.mp3`) with automatic tab visibility synchronization (pauses music when switching tabs, resumes when returning, and stops when the tab is closed).
*   **Rage Mode Integration:** Combined with **Rage Mode** and **Bullet Mode**, clicking the "Show Hint" button instantly executes the move on the board within 1–3 seconds.

---

## 🛠️ Step-by-Step Installation Guide

Since the extension runs locally and is not hosted on the Chrome Web Store, it must be loaded as an unpacked extension in Developer Mode. Follow these steps:

### Step 1: Download the Release
Go to the repository's [Releases](https://github.com/physicalaff/Knight-Chess-Helper/releases) page. Under the **Assets** section of the latest release, download the `Knight-Chess-vX.X.X.zip` package (or click the source code zip link).

![Download release](screenshots/Screenshot_1.png)

---

### Step 2: Extract the ZIP Archive
Locate the downloaded ZIP file on your computer and extract it using WinRAR, 7-Zip, or your system's default archiver. Make sure the files are extracted into a dedicated folder (e.g., `Knight-Chess`).

![Extract archive](screenshots/Screenshot_2.png)

---

### Step 3: Open Chrome Menu
Open your Google Chrome browser. Click on the **3 vertical dots** menu icon in the top-right corner of the window.

![Open Chrome menu](screenshots/Screenshot_3.png)

---

### Step 4: Go to Extensions
In the dropdown menu, hover over **Extensions** (Расширения) to open the extensions submenu.

![Select Extensions](screenshots/Screenshot_4.png)

---

### Step 5: Click Manage Extensions
Click on **Manage Extensions** (Управление расширениями) from the submenu. This will open the extensions configuration tab (`chrome://extensions/`).

![Manage Extensions](screenshots/Screenshot_5.png)

---

### Step 6: Enable Developer Mode
In the top-right corner of the Extensions page, locate the **Developer mode** (Режим разработчика) toggle switch and turn it **ON**.

![Enable Developer Mode](screenshots/Screenshot_6.png)

---

### Step 7: Click Load Unpacked
Once Developer Mode is enabled, new buttons will appear in the top-left area. Click on the **Load unpacked** (Загрузить распакованное расширение) button.

![Click Load Unpacked](screenshots/Screenshot_7.png)

---

### Step 8: Select the Extracted Folder
In the file selection dialog that opens, navigate to the folder where you extracted the extension files in Step 2, click on the **Knight-Chess** folder, and select it.

![Select extension folder](screenshots/Screenshot_8.png)

---

### Step 9: Verify Active Status
The **Knight — Chess Assistant** card should now appear on your Extensions page. Make sure the toggle switch on the card is turned **ON** and the version matches the latest release.

![Extension activated](screenshots/Screenshot_9.png)

You are all set! Open [Chess.com](https://www.chess.com/) and click the floating Knight icon to open the dashboard!

---

## ❓ Troubleshooting

> [!IMPORTANT]
> **Issue: The Choose Language screen is unresponsive.**
> *   *Fix:* Make sure you are using the latest release **v6.1.2** or higher. A prior version had missing event bindings which have been fully fixed.
>
> **Issue: The assistant panel is cut off at the bottom of the screen.**
> *   *Fix:* We have added screen-height adaptive scrolling to the panel. Simply scroll inside the panel to access the bottom settings or export buttons.
>
> **Issue: Clock shows incorrect time.**
> *   *Fix:* Make sure you are playing a live match on Chess.com. The clock auto-aligns with the bottom player viewport. If you resize the screen, toggle the panel off and on again to refresh.
