# Локальный сервер для разработки: как python -m http.server, но без кэша браузера,
# чтобы после правок не смешивались старые и новые файлы.
import http.server
import os
import sys


class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8791
    os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
    http.server.ThreadingHTTPServer(('', port), NoCache).serve_forever()
