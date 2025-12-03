import http.server
import socketserver
import logging
from datetime import datetime

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

PORT = 8080
Handler = http.server.SimpleHTTPRequestHandler

class LoggingHTTPRequestHandler(Handler):
    def log_message(self, format, *args):
        timestamp = self.log_date_time_string()
        client_ip = self.client_address[0]
        print(f"[{timestamp}] {client_ip} - {format % args}")
    
    def do_GET(self):
        print(f"\n>>> GET request: {self.path} from {self.client_address[0]}")
        super().do_GET()

with socketserver.TCPServer(("0.0.0.0", PORT), LoggingHTTPRequestHandler) as httpd:
    print(f"\n{'='*60}")
    print(f"Server running on http://0.0.0.0:{PORT}")
    print(f"Access from phone at: http://192.168.1.106:{PORT}")
    print(f"{'='*60}\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\nServer stopped.")
