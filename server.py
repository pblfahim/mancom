#!/usr/bin/env python3
"""
Pubali Bank PLC. - MANCOM Portal
Local Development Server with Document Ingestion API
Saves all final uploaded documents directly into assets/documents/
"""

import http.server
import socketserver
import os
import json
import base64
import sys
from email.parser import BytesParser
from email.policy import default

PORT = 8085
if len(sys.argv) > 1:
    try:
        PORT = int(sys.argv[1])
    except ValueError:
        pass

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
DOCS_DIR = os.path.join(ROOT_DIR, 'assets', 'documents')
os.makedirs(DOCS_DIR, exist_ok=True)

class MancomServerHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT_DIR, **kwargs)

    def end_headers(self):
        # Enable CORS for local testing
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        if self.path == '/api/upload':
            try:
                content_type = self.headers.get('Content-Type', '')
                content_length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(content_length)

                saved_files = []

                if 'multipart/form-data' in content_type:
                    msg = BytesParser(policy=default).parsebytes(
                        f"Content-Type: {content_type}\r\n\r\n".encode('latin1') + body
                    )
                    for part in msg.iter_parts():
                        filename = part.get_filename()
                        if filename:
                            filename = os.path.basename(filename)
                            file_payload = part.get_payload(decode=True)
                            dest_path = os.path.join(DOCS_DIR, filename)
                            with open(dest_path, 'wb') as f:
                                f.write(file_payload)
                            saved_files.append({
                                'fileName': filename,
                                'fileSize': len(file_payload),
                                'fileUrl': f'assets/documents/{filename}',
                                'savedPath': dest_path
                            })
                elif 'application/json' in content_type:
                    data = json.loads(body.decode('utf-8'))
                    filename = os.path.basename(data.get('fileName', 'document.pdf'))
                    file_b64 = data.get('fileData', '')
                    if ',' in file_b64:
                        file_b64 = file_b64.split(',', 1)[1]
                    file_bytes = base64.b64decode(file_b64)
                    dest_path = os.path.join(DOCS_DIR, filename)
                    with open(dest_path, 'wb') as f:
                        f.write(file_bytes)
                    saved_files.append({
                        'fileName': filename,
                        'fileSize': len(file_bytes),
                        'fileUrl': f'assets/documents/{filename}',
                        'savedPath': dest_path
                    })

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                response = {
                    'status': 'success',
                    'message': 'All final documents successfully saved in assets/documents/ folder',
                    'documentsFolder': 'assets/documents/',
                    'savedFiles': saved_files
                }
                self.wfile.write(json.dumps(response).encode('utf-8'))
                print(f"[MANCOM Server] Saved {len(saved_files)} document(s) into assets/documents/")
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'error', 'message': str(e)}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == '__main__':
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), MancomServerHandler) as httpd:
        print(f"[MANCOM Server] Serving HTTP on port {PORT} (Document repository: {DOCS_DIR}) ...")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[MANCOM Server] Stopped.")
