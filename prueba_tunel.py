"""
prueba_tunel.py
Servidor HTTP mínimo para verificar que el túnel ngrok funciona
desde la red corporativa hacia Render (o cualquier cliente externo).

Uso:
  Terminal 1: py prueba_tunel.py
  Terminal 2: ngrok http 8765
"""

import os
from http.server import BaseHTTPRequestHandler, HTTPServer
from datetime import datetime
import json

PORT = int(os.environ.get("PORT", 8765))


class Handler(BaseHTTPRequestHandler):

    # ------------------------------------------------------------------ #
    #  GET /ping  — health-check básico                                   #
    # ------------------------------------------------------------------ #
    def do_GET(self):
        if self.path == "/ping":
            self._responder({"ok": True, "tunnel": "funcionando"})
        else:
            self._responder({"error": "ruta no encontrada"}, status=404)

    # ------------------------------------------------------------------ #
    #  POST /scraping/ejecutar  — simula un pedido real de Render         #
    # ------------------------------------------------------------------ #
    def do_POST(self):
        if self.path == "/scraping/ejecutar":
            ahora = datetime.now().strftime("%H:%M:%S")
            print(f"✅ [{ahora}] Recibí pedido de scraping desde Render")
            payload = {
                "ok": True,
                "mensajes": [
                    "Mensaje de prueba 1 (simulado)",
                    "Mensaje de prueba 2 (simulado)",
                ],
                "total": 2,
            }
            self._responder(payload)
        else:
            self._responder({"error": "ruta no encontrada"}, status=404)

    # ------------------------------------------------------------------ #
    #  Helper                                                             #
    # ------------------------------------------------------------------ #
    def _responder(self, data: dict, status: int = 200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    # Silencia los logs de acceso del servidor para mantener la terminal limpia
    def log_message(self, format, *args):  # noqa: A002
        ahora = datetime.now().strftime("%H:%M:%S")
        print(f"  [{ahora}]  {self.address_string()}  {args[0]}")


# ------------------------------------------------------------------ #
#  Entry point                                                        #
# ------------------------------------------------------------------ #
if __name__ == "__main__":
    server = HTTPServer(("0.0.0.0", PORT), Handler)
    print(f"🚀 Servidor escuchando en http://0.0.0.0:{PORT}")
    print("   Rutas disponibles:")
    print("     GET  /ping              → health-check")
    print("     POST /scraping/ejecutar → simula pedido de Render")
    print("\n   Esperando conexiones… (Ctrl+C para detener)\n")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n⛔ Servidor detenido.")
