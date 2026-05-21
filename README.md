<img width="512" height="512" alt="Knight" src="https://github.com/user-attachments/assets/e255d1fa-0f43-4916-b27f-c23167f97d2d" />

Knight — Chess Helper v4.1.0

🛡️ **An advanced, highly polished, and human-like chess assistant for Chess.com.** 

Knight is a Chrome extension designed to assist your chess games entirely locally. Powered by WebAssembly (WASM) and Chrome's Offscreen Document API, it analyzes positions offline, predicts human thinking times, simulates natural mouse trajectories, and offers a premium futuristic dashboard interface.

---

## 🚀 Key Features

* 🤖 **Auto-Play** — Automatically execute moves on your behalf with natural, randomized human delay and organic mouse paths.
* 🧠 **100% Local Engine** — Powered by a local **Stockfish 18 (WebAssembly)** engine. It performs all calculations inside an isolated `Offscreen Document` without making third-party server calls, bypassing Chess.com's strict Content Security Policy (CSP).
* ⚡ **Smart Think Time & Predictability** — The engine dynamically adapts its thinking time:
  * **Obvious Moves (Near-Instant):** Direct recaptures on the same square or forced mates-in-1 are executed in **110–310ms** to replicate instant human reflexes.
  * **Complex Positions (Deliberate Choice):** Close games with active tactical threats prompt the engine to think **1.8x – 2.1x** longer, simulating a player deep in thought.
* 🎯 **Dynamic ELO Calibration (1000–1500)** — A real, mathematically scaled difficulty system that changes search depth, blunder rates, and physical mouse movements.
* ⬡ **Instant Board Hints** — Draws the best move dynamically on the chessboard using animated dashes and arrows. **Zero cooldown**—hints update instantly on click.
* 📖 **Opening Book** — Automatically plays the first 14 half-moves naturally using Lichess Masters Database to look indistinguishable from a human player.
* 🌌 **Obsidian Glass UI** — A premium dark-cyber dashboard featuring compact real-time game statistics (clocks, evaluations, moves log) and a pulsing floating neon indicator.

## 📊 Privacy & Telemetry Disclosure

To help the developer evaluate the active user base and decide whether to continue dedicating time to future updates or archive the project, the extension includes a lightweight, 100% anonymous telemetry system.

* **What is tracked:** A randomly generated unique client ID (e.g., `usr_abcdef123`) and the date/time of the daily extension launch.
* **What is NOT tracked:** Absolutely no personal data, Chess.com credentials, session cookies, tokens, or game histories are collected. 
* **How it works:** Once a day, when you open Chess.com, the extension sends a single anonymous ping to a secure, private Google Spreadsheet.
* **Why this is necessary:** This data is used solely as a signal of active interest. It helps the developer understand if there is a real audience using the assistant, determining whether to release future updates (such as pondering, threat heatmaps, and position complexity metrics) or archive the repository.

---

## 📊 ELO Scaling Matrix

The ELO slider isn't just cosmetic; it dynamically adjusts the following core engine parameters in real-time:

| ELO Level | Category | Depth | Mistake Chance | Blunder Chance | Average Thinking Time | Mouse Wobble |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| **1000** | Beginner | 3 plies | 30% | 8% | ~300ms – 2.0s | Heavy (5px) |
| **1100** | Casual | 4 plies | 25% | 6.5% | ~400ms – 2.4s | Moderate (4.3px) |
| **1200** | Intermediate | 5 plies | 21% | 5.2% | ~450ms – 2.7s | Moderate (3.6px) |
| **1300** | Club Player | 6 plies | 17% | 4% | ~500ms – 3.0s | Light (2.9px) |
| **1400** | Strong Club | 7 plies | 12% | 2.8% | ~550ms – 3.4s | Light (2.2px) |
| **1500** | Advanced | 8 plies | 8% | 1.5% | ~600ms – 3.8s | Smooth (1.5px) |

---

## 🛠️ Installation Guide

Since the extension runs locally and is not hosted on the Chrome Web Store, you can easily install it as an unpacked developer extension:

1. **Download the source:** Clone this repository or download the latest zipped bundle from the [Releases](https://github.com/physicalaff/Knight-Chess-Helper/releases) page.
2. **Unpack the archive:** Extract the files into a dedicated folder on your computer.
3. **Open Chrome Extensions:** Navigate to `chrome://extensions/` in your browser.
4. **Enable Developer Mode:** Toggle the **Developer mode** switch in the top-right corner.
5. **Load Unpacked:** Click the **Load unpacked** button in the top-left corner and select the extracted extension folder.
6. **Start Playing:** Open any game on [Chess.com](https://www.chess.com/) and click the floating Knight icon to open the dashboard!

---

## 🏗️ Architecture & Security

To bypass Chess.com's strict sandboxing and Content Security Policies, Knight uses a modern Manifest V3 multi-layered messaging system:

# <img src="Knight.png" width="38" valign="middle"> Knight — Chess Helper v4.1.0

🛡️ **An advanced, highly polished, and human-like chess assistant for Chess.com.** 

Knight is a Chrome extension designed to assist your chess games entirely locally. Powered by WebAssembly (WASM) and Chrome's Offscreen Document API, it analyzes positions offline, predicts human thinking times, simulates natural mouse trajectories, and offers a premium futuristic dashboard interface.

---

## 🚀 Key Features

* 🤖 **Auto-Play** — Automatically execute moves on your behalf with natural, randomized human delay and organic mouse paths.
* 🧠 **100% Local Engine** — Powered by a local **Stockfish 18 (WebAssembly)** engine. It performs all calculations inside an isolated `Offscreen Document` without making third-party server calls, bypassing Chess.com's strict Content Security Policy (CSP).
* ⚡ **Smart Think Time & Predictability** — The engine dynamically adapts its thinking time:
  * **Obvious Moves (Near-Instant):** Direct recaptures on the same square or forced mates-in-1 are executed in **110–310ms** to replicate instant human reflexes.
  * **Complex Positions (Deliberate Choice):** Close games with active tactical threats prompt the engine to think **1.8x – 2.1x** longer, simulating a player deep in thought.
* 🎯 **Dynamic ELO Calibration (1000–1500)** — A real, mathematically scaled difficulty system that changes search depth, blunder rates, and physical mouse movements.
* ⬡ **Instant Board Hints** — Draws the best move dynamically on the chessboard using animated dashes and arrows. **Zero cooldown**—hints update instantly on click.
* 📖 **Opening Book** — Automatically plays the first 14 half-moves naturally using Lichess Masters Database to look indistinguishable from a human player.
* 🌌 **Obsidian Glass UI** — A premium dark-cyber dashboard featuring compact real-time game statistics (clocks, evaluations, moves log) and a pulsing floating neon indicator.

---

## 📊 ELO Scaling Matrix

The ELO slider isn't just cosmetic; it dynamically adjusts the following core engine parameters in real-time:

| ELO Level | Category | Depth | Mistake Chance | Blunder Chance | Average Thinking Time | Mouse Wobble |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| **1000** | Beginner | 3 plies | 30% | 8% | ~300ms – 2.0s | Heavy (5px) |
| **1100** | Casual | 4 plies | 25% | 6.5% | ~400ms – 2.4s | Moderate (4.3px) |
| **1200** | Intermediate | 5 plies | 21% | 5.2% | ~450ms – 2.7s | Moderate (3.6px) |
| **1300** | Club Player | 6 plies | 17% | 4% | ~500ms – 3.0s | Light (2.9px) |
| **1400** | Strong Club | 7 plies | 12% | 2.8% | ~550ms – 3.4s | Light (2.2px) |
| **1500** | Advanced | 8 plies | 8% | 1.5% | ~600ms – 3.8s | Smooth (1.5px) |

---

## 🛠️ Installation Guide

Since the extension runs locally and is not hosted on the Chrome Web Store, you can easily install it as an unpacked developer extension:

1. **Download the source:** Clone this repository or download the latest zipped bundle from the [Releases](https://github.com/physicalaff/Knight-Chess-Helper/releases) page.
2. **Unpack the archive:** Extract the files into a dedicated folder on your computer.
3. **Open Chrome Extensions:** Navigate to `chrome://extensions/` in your browser.
4. **Enable Developer Mode:** Toggle the **Developer mode** switch in the top-right corner.
5. **Load Unpacked:** Click the **Load unpacked** button in the top-left corner and select the extracted extension folder.
6. **Start Playing:** Open any game on [Chess.com](https://www.chess.com/) and click the floating Knight icon to open the dashboard!

---

## 🏗️ Architecture & Security

To bypass Chess.com's strict sandboxing and Content Security Policies, Knight uses a modern Manifest V3 multi-layered messaging system:

<img width="1774" height="887" alt="image" src="https://github.com/user-attachments/assets/0a9a8e6a-b5dd-4f61-8e42-2c2a322159c6" />
