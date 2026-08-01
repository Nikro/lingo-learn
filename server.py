#!/usr/bin/env python3
"""Spanish Learning App server with proper cache-busting headers."""
import http.server
import socketserver
import os

PORT = 9876
DIRECTORY = "."

class CacheBustingHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Only bust cache for JS files to allow browser to cache HTML/CSS
        if self.path.endswith('.js'):
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
        elif self.path.endswith('.html'):
            self.send_header('Cache-Control', 'no-cache, must-revalidate')
        elif self.path.endswith('.json'):
            self.send_header('Cache-Control', 'no-cache, must-revalidate')
        elif self.path.endswith('.css'):
            self.send_header('Cache-Control', 'no-cache, must-revalidate')
        super().end_headers()

    def log_message(self, format, *args):
        print(f"[{self.log_date_time_string()}] {args[0]}")

if __name__ == '__main__':
    with socketserver.TCPServer(('', PORT), CacheBustingHandler) as httpd:
        print(f"Server running on http://0.0.0.0:{PORT}")
        print(f"Serving from: {os.path.abspath(DIRECTORY)}")
        httpd.serve_forever()
