import json
import urllib.request
import urllib.parse
import time
import argparse
import sys

DEFAULT_FEN_LIST = [
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
    "rnbqkbnr/pppp1ppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
    "rnbqkbnr/pppp1ppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
    "rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 1",
    "rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 1"
]

class BookCompiler:
    def __init__(self, output_path, max_depth, min_weight):
        self.output_path = output_path
        self.max_depth = max_depth
        self.min_weight = min_weight
        self.compiled_book = {}
        self.visited_fens = set()

    def _fetch_lichess_data(self, fen):
        url = f"https://explorer.lichess.ovh/masters?fen={urllib.parse.quote(fen)}&topGames=0&recentGames=0"
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
        req = urllib.request.Request(url, headers=headers)
        
        for attempt in range(3):
            try:
                with urllib.request.urlopen(req, timeout=5) as response:
                    if response.status == 200:
                        return json.loads(response.read().decode('utf-8'))
            except Exception as e:
                time.sleep(1 + attempt)
        return None

    def _clean_fen(self, fen):
        parts = fen.split(' ')
        if len(parts) >= 4:
            return ' '.join(parts[:4])
        return fen

    def compile_node(self, fen, current_depth):
        if current_depth > self.max_depth:
            return

        normalized_fen = self._clean_fen(fen)
        if normalized_fen in self.visited_fens:
            return
        self.visited_fens.add(normalized_fen)

        sys.stdout.write(f"\rCrawling Depth {current_depth}/{self.max_depth} | Nodes visited: {len(self.visited_fens)}")
        sys.stdout.flush()

        data = self._fetch_lichess_data(fen)
        if not data or 'moves' not in data or not data['moves']:
            return

        valid_moves = []
        for m in data['moves']:
            weight = m.get('white', 0) + m.get('black', 0) + m.get('draws', 0)
            if weight >= self.min_weight:
                valid_moves.append(m)

        if not valid_moves:
            return

        best_move_data = max(valid_moves, key=lambda x: x.get('white', 0) + x.get('black', 0) + x.get('draws', 0))
        best_move_uci = best_move_data.get('uci')

        if best_move_uci:
            self.compiled_book[normalized_fen] = best_move_uci

            next_fen = data.get('fen')
            if next_fen:
                time.sleep(0.4)
                self.compile_node(next_fen, current_depth + 1)

    def run(self, start_fens):
        print("Starting local opening book compilation...")
        for i, fen in enumerate(start_fens):
            print(f"\nProcessing seed path {i + 1}/{len(start_fens)}")
            self.compile_node(fen, 1)
        
        self.save_to_json()

    def save_to_json(self):
        print(f"\nWriting compiled book to {self.output_path}...")
        try:
            with open(self.output_path, 'w', encoding='utf-8') as f:
                json.dump(self.compiled_book, f, indent=4, ensure_ascii=False)
            print("Successfully compiled offline opening book!")
        except Exception as e:
            print(f"Error saving JSON file: {e}")

def main():
    parser = argparse.ArgumentParser(description="Advanced Chess Opening Book Compiler")
    parser.add_argument("-o", "--output", default="../assets/local_book.json", help="Path to output compiled JSON")
    parser.add_argument("-d", "--depth", type=int, default=12, help="Maximum half-move depth to crawl")
    parser.add_argument("-w", "--weight", type=int, default=15, help="Minimum master game weight threshold")
    args = parser.parse_args()

    compiler = BookCompiler(
        output_path=args.output,
        max_depth=args.depth,
        min_weight=args.weight
    )
    
    compiler.run(DEFAULT_FEN_LIST)

if __name__ == "__main__":
    main()