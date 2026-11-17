#!/usr/bin/env python3
"""Take the 4 NEON VOID STRIKE screenshots: title, play, boss, victory.
Serves game/ locally, opens each ?shot=<scene>&seed=1 in headless Chromium
at 1280x720, waits for window.__shotReady, saves a JPEG (quality 80).
Run from the game-a directory: python3 take-shots.py [--port 8901]
"""
import http.server
import os
import socketserver
import subprocess
import sys
import threading
import time

HERE = os.path.dirname(os.path.abspath(__file__))
GAME_DIR = os.path.join(HERE, "game")
SHOT_DIR = os.path.join(HERE, "screenshots")
SCENES = [
    ("1-title.jpg", "title"),
    ("2-play.jpg", "play"),
    ("3-boss.jpg", "boss"),
    ("4-victory.jpg", "victory"),
]
PORT = int(sys.argv[sys.argv.index("--port") + 1]) if "--port" in sys.argv else 8901


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=GAME_DIR, **kwargs)

    def log_message(self, *args):
        pass


def main():
    os.makedirs(SHOT_DIR, exist_ok=True)
    with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
        thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        thread.start()
        time.sleep(0.5)
        from playwright.sync_api import sync_playwright

        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page(viewport={"width": 1280, "height": 720})
            errors = []
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
            for name, scene in SCENES:
                page.goto(f"http://127.0.0.1:{PORT}/index.html?shot={scene}&seed=1")
                page.wait_for_function("window.__shotReady === true", timeout=15000)
                page.wait_for_timeout(150)
                path = os.path.join(SHOT_DIR, name)
                page.screenshot(path=path, type="jpeg", quality=80)
                size = os.path.getsize(path)
                print(f"{name}: {size} bytes {'OK' if size <= 262144 else 'TOO BIG'}")
            print("page errors:", errors if errors else "none")
            browser.close()
        httpd.shutdown()


if __name__ == "__main__":
    main()
