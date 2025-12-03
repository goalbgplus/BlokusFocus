#!/usr/bin/env python3
"""
HTTP Server with proper cache headers for best practices
Replaces plain http.server to add cache control headers
"""

import http.server
import socketserver
import mimetypes
import os
from pathlib import Path

PORT = 8000

class CachingHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add cache headers based on file type
        file_path = Path(self.translate_path(self.path))
        
        # Long-term cache for versioned assets (with query string ?v=X.X)
        if '?v=' in self.path or file_path.suffix in ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.woff', '.woff2', '.ttf']:
            self.send_header('Cache-Control', 'public, max-age=31536000, immutable')  # 1 year
        # No cache for HTML and dynamic files
        elif file_path.suffix in ['.html', '.json', '.js', '.css']:
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
        # Default: moderate caching
        else:
            self.send_header('Cache-Control', 'public, max-age=3600')  # 1 hour
        
        # Security headers for best practices
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'DENY')
        self.send_header('X-XSS-Protection', '1; mode=block')
        self.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')
        
        super().end_headers()

if __name__ == '__main__':
    handler = CachingHTTPRequestHandler
    
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print(f"Serving at http://localhost:{PORT}")
        print("With proper cache headers and security headers")
        httpd.serve_forever()
