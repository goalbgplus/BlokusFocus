import http.server
import socketserver
import os
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
WEB_DIR = os.path.dirname(os.path.abspath(__file__))

os.chdir(WEB_DIR)

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        # Cache static assets
        if self.path.endswith(('.css', '.js', '.woff', '.woff2', '.ttf')):
            self.send_header('Cache-Control', 'public, max-age=31536000, immutable')
        elif self.path.endswith(('.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico')):
            self.send_header('Cache-Control', 'public, max-age=31536000, immutable')
        elif self.path.endswith('.html'):
            self.send_header('Cache-Control', 'no-cache, must-revalidate')
        super().end_headers()

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Serving at http://0.0.0.0:{PORT} (LAN accessible)")
    httpd.serve_forever()
