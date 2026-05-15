import os
import json
import uuid
from datetime import datetime
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

ACCESS_CODE = os.environ.get("ACCESS_CODE", "SOFSE2026")
DATA_FILE = "perfiles.json"

LINEAS = ["Roca", "Mitre", "Sarmiento", "San Martín", "Belgrano Sur", "Tren de la Costa"]
SECTORES = ["Mesa de Usuario", "Control de Tráfico", "Infraestructura", "Atención al Cliente", "Seguridad"]
COLABORADORES = ["Ariel", "Diego", "Patricia", "Ninguno"]
TRAITS_RRHH = [
    "Apegado a reglamentos", "Resolutivo en crisis", "Comunicación formal",
    "Proactivo", "Bajo perfil", "Liderazgo natural", "Puntualidad ejemplar",
    "Rigidez procedimental", "Comunicación reactiva", "Resistencia al cambio",
    "Escasa tolerancia a la presión", "Perfil defensivo", "Dificultad para priorizar"
]
SEMAFOROS = {"green", "yellow", "red"}


def _load_all():
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except Exception:
            return []


def _save_all(profiles):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(profiles, f, indent=4, ensure_ascii=False)


def _normalize(data, existing=None):
    base = existing.copy() if existing else {}
    base.update({
        "nombre": (data.get("nombre") or "").strip(),
        "linea": data.get("linea") if data.get("linea") in LINEAS else LINEAS[0],
        "sector": data.get("sector") if data.get("sector") in SECTORES else SECTORES[0],
        "email": (data.get("email") or "").strip(),
        "celular": (data.get("celular") or "").strip(),
        "vinculo": (data.get("vinculo") or "").strip(),
        "fotoUrl": (data.get("fotoUrl") or "").strip(),
        "perfilProfesional": [t for t in (data.get("perfilProfesional") or []) if isinstance(t, str)],
        "perfilInterno": (data.get("perfilInterno") or "").strip(),
        "semaforo": data.get("semaforo") if data.get("semaforo") in SEMAFOROS else "green",
        "afinidad": data.get("afinidad") if data.get("afinidad") in COLABORADORES else "Ninguno",
    })
    return base


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/login", methods=["POST"])
def login():
    data = request.json or {}
    if data.get("code") == ACCESS_CODE:
        return jsonify({"success": True, "message": "Acceso concedido"})
    return jsonify({"success": False, "message": "Código incorrecto"}), 401


@app.route("/api/config", methods=["GET"])
def config():
    return jsonify({
        "lineas": LINEAS,
        "sectores": SECTORES,
        "colaboradores": COLABORADORES,
        "traits": TRAITS_RRHH,
    })


@app.route("/api/perfiles", methods=["GET"])
def list_profiles():
    profiles = _load_all()
    profiles.sort(key=lambda p: (p.get("nombre") or "").lower())
    return jsonify({"success": True, "perfiles": profiles})


@app.route("/api/perfiles", methods=["POST"])
def add_profile():
    data = request.json or {}
    if not (data.get("nombre") or "").strip():
        return jsonify({"success": False, "message": "Falta el nombre"}), 400
    profiles = _load_all()
    item = _normalize(data)
    item["id"] = uuid.uuid4().hex
    item["createdAt"] = datetime.now().isoformat()
    item["updatedAt"] = item["createdAt"]
    profiles.append(item)
    _save_all(profiles)
    return jsonify({"success": True, "message": "Perfil registrado", "perfil": item})


@app.route("/api/perfiles/<pid>", methods=["PUT"])
def update_profile(pid):
    data = request.json or {}
    profiles = _load_all()
    for i, p in enumerate(profiles):
        if p.get("id") == pid:
            updated = _normalize(data, existing=p)
            updated["id"] = pid
            updated["updatedAt"] = datetime.now().isoformat()
            profiles[i] = updated
            _save_all(profiles)
            return jsonify({"success": True, "message": "Perfil actualizado", "perfil": updated})
    return jsonify({"success": False, "message": "No encontrado"}), 404


@app.route("/api/perfiles/<pid>", methods=["DELETE"])
def delete_profile(pid):
    profiles = _load_all()
    new_list = [p for p in profiles if p.get("id") != pid]
    if len(new_list) == len(profiles):
        return jsonify({"success": False, "message": "No encontrado"}), 404
    _save_all(new_list)
    return jsonify({"success": True, "message": "Perfil eliminado"})


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
