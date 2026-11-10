#!/usr/bin/env python3
"""Local-only static server. Python 3.10+. No packages to install."""
import argparse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from functools import partial
import mimetypes
import threading
import webbrowser

ROOT = Path(__file__).resolve().parent
mimetypes.add_type('text/javascript', '.js')
mimetypes.add_type('application/json', '.json')

class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        super().end_headers()

    def list_directory(self, path):
        self.send_error(404)

    def log_message(self, *_):
        pass

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=4173)
    parser.add_argument('--open', action='store_true', help='Open the local URL in your default browser')
    args = parser.parse_args()
    try:
        server = ThreadingHTTPServer(('127.0.0.1', args.port), partial(Handler, directory=str(ROOT)))
    except OSError as exc:
        raise SystemExit(f'Could not start: {exc}\nTry: python3 run.py --port 4174')
    print(f'\nTRANSIT AFFORDABILITY ATLAS\nLocal: http://127.0.0.1:{args.port}\nKeep this terminal open. Press Control+C to stop.\n', flush=True)
    if args.open:
        threading.Timer(0.4, lambda: webbrowser.open(f'http://127.0.0.1:{args.port}')).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nStopped.')
    finally:
        server.server_close()

if __name__ == '__main__':
    main()
