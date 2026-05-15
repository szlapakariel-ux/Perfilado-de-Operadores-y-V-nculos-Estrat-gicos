import os
import json
from datetime import datetime
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# Configuración
ACCESS_CODE = os.environ.get("ACCESS_CODE", "SOFSE2026")
DATA_FILE = "perfiles.json"

def save_profile(data):
    profiles = []
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            try:
                profiles = json.load(f)
            except:
                pass
    
    data["timestamp"] = datetime.now().isoformat()
    profiles.append(data)
    
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(profiles, f, indent=4, ensure_ascii=False)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    if data and data.get("code") == ACCESS_CODE:
        return jsonify({"success": True, "message": "Acceso concedido"})
    return jsonify({"success": False, "message": "Código incorrecto"}), 401

@app.route("/api/perfiles", methods=["POST"])
def add_profile():
    data = request.json
    if not data or not data.get("nombre"):
        return jsonify({"success": False, "message": "Faltan datos obligatorios"}), 400
    
    save_profile(data)
    return jsonify({"success": True, "message": "Perfil registrado con éxito"})

# ------------------------------------------------------------------ #
#  Rutas originales del túnel (prueba_tunel.py)
# ------------------------------------------------------------------ #
@app.route("/ping", methods=["GET"])
def ping():
    return jsonify({"ok": True, "tunnel": "funcionando"})

@app.route("/scraping/ejecutar", methods=["POST"])
def ejecutar_scraping():
    ahora = datetime.now().strftime("%H:%M:%S")
    print(f"[OK] [{ahora}] Recibí pedido de scraping desde Render/Railway")
    payload = {
        "ok": True,
        "mensajes": [
            "Mensaje de prueba 1 (simulado)",
            "Mensaje de prueba 2 (simulado)",
        ],
        "total": 2,
    }
    return jsonify(payload)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8765))
    app.run(host="0.0.0.0", port=port, debug=True)
