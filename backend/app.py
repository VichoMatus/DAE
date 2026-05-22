

import os
import json
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

DB_PATH = os.path.join(os.path.dirname(__file__), 'database.json')
INITIAL_DB_PATH = DB_PATH # We keep a copy in memory for reset

# Helper to read from database.json
def read_db():
    if not os.path.exists(DB_PATH):
        # Fallback to an empty schema if file doesn't exist
        return {"assets": [], "requests": [], "history": []}
    with open(DB_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

# Helper to write to database.json
def write_db(data):
    with open(DB_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

# Dynamic linear depreciation calculator
def calculate_book_value(asset, current_date_str="2026-05-22"):
    purchase_date = datetime.strptime(asset["purchase_date"], "%Y-%m-%d")
    current_date = datetime.strptime(current_date_str, "%Y-%m-%d")
    
    # Calculate difference in months
    months_elapsed = (current_date.year - purchase_date.year) * 12 + (current_date.month - purchase_date.month)
    if months_elapsed < 0:
        months_elapsed = 0
        
    total_lifespan = asset["lifespan_months"] + asset["extension_months"]
    
    if months_elapsed >= total_lifespan:
        book_value = 0
    else:
        depreciation_per_month = asset["original_value"] / total_lifespan
        book_value = asset["original_value"] - (depreciation_per_month * months_elapsed)
        
    # Round to nearest integer (CLP)
    return int(max(0, book_value))

# Calculate remaining lifespan in months
def calculate_remaining_lifespan(asset, current_date_str="2026-05-22"):
    purchase_date = datetime.strptime(asset["purchase_date"], "%Y-%m-%d")
    current_date = datetime.strptime(current_date_str, "%Y-%m-%d")
    
    months_elapsed = (current_date.year - purchase_date.year) * 12 + (current_date.month - purchase_date.month)
    if months_elapsed < 0:
        months_elapsed = 0
        
    total_lifespan = asset["lifespan_months"] + asset["extension_months"]
    remaining = total_lifespan - months_elapsed
    return max(0, remaining)

# Validation rules for allowed transitions
# Key: current_status, Value: list of valid next statuses
ALLOWED_TRANSITIONS = {
    "En Bodega": ["En Tránsito (Bodega-TI)"],
    "En Tránsito (Bodega-TI)": ["En Configuración"],
    "En Configuración": ["Listo para Entrega"],
    "Listo para Entrega": ["Pendiente de Recepción Formal"],
    "Pendiente de Recepción Formal": ["Asignado", "En Bodega"],
    "Asignado": ["En Diagnóstico", "Pendiente de Devolución", "Incidente Externo"],
    "En Diagnóstico": ["Pendiente de Decisión", "En Configuración"],
    "Pendiente de Decisión": ["Dado de Baja", "Asignado (Extendido)"],
    "Asignado (Extendido)": ["En Diagnóstico", "Pendiente de Devolución", "Incidente Externo"],
    "Pendiente de Devolución": ["En Validación Técnica"],
    "En Validación Técnica": ["Disponible para Reasignación"],
    "Disponible para Reasignación": ["En Bodega"],
    "Incidente Externo": ["Dado de Baja"],
    "Dado de Baja": []
}

# Compatibility Matrix for D1
# Key: Job Profile, Value: dict of compatibility rules
COMPATIBILITY_MATRIX = {
    "Desarrollador / TI": {
        "required_ram_min": 16,
        "required_categories": ["MacBook Pro M3", "MacBook Pro M1", "Workstation i9"]
    },
    "Administrativo / Finanzas": {
        "required_ram_min": 8,
        "required_categories": ["Dell Latitude 5440", "ThinkPad L14"]
    }
}

def parse_ram_gb(ram_str):
    # Extracts number from strings like "18GB" or "8GB"
    try:
        return int(''.join(filter(str.isdigit, ram_str)))
    except ValueError:
        return 0

# --- ENDPOINTS ---

@app.route('/api/assets', methods=['GET'])
def get_assets():
    db = read_db()
    current_date = request.args.get('date', '2026-05-22')
    # Update dynamic book values on the fly for UI presentation
    for asset in db["assets"]:
        asset["book_value"] = calculate_book_value(asset, current_date)
        asset["remaining_months"] = calculate_remaining_lifespan(asset, current_date)
    return jsonify(db["assets"])

@app.route('/api/assets/<qr_code>', methods=['GET'])
def get_asset_detail(qr_code):
    db = read_db()
    asset = next((a for a in db["assets"] if a["qr_code"] == qr_code), None)
    if not asset:
        return jsonify({"error": "Activo no encontrado"}), 404
        
    current_date = request.args.get('date', '2026-05-22')
    asset["book_value"] = calculate_book_value(asset, current_date)
    asset["remaining_months"] = calculate_remaining_lifespan(asset, current_date)
    return jsonify(asset)

@app.route('/api/requests', methods=['GET', 'POST'])
def handle_requests():
    db = read_db()
    if request.method == 'GET':
        return jsonify(db.get("requests", []))
    
    elif request.method == 'POST':
        # Create request
        data = request.json
        req_id = f"REQ-{len(db.get('requests', [])) + 1:03d}"
        new_request = {
            "id": req_id,
            "requester_role": data.get("requester_role", "Jefe de Área"),
            "collaborator": data.get("collaborator"),
            "collaborator_profile": data.get("collaborator_profile"), # "Desarrollador / TI" or "Administrativo / Finanzas"
            "category_requested": data.get("category_requested"),
            "reason": data.get("reason"),
            "status": "Pendiente",
            "created_at": datetime.now().isoformat()
        }
        db["requests"].append(new_request)
        write_db(db)
        return jsonify(new_request), 201

@app.route('/api/assets/<qr_code>/transition', methods=['POST'])
def transition_asset(qr_code):
    db = read_db()
    asset = next((a for a in db["assets"] if a["qr_code"] == qr_code), None)
    if not asset:
        return jsonify({"error": "Activo no encontrado"}), 404
        
    data = request.json
    target_status = data.get("status")
    emisor = data.get("emisor")
    receptor = data.get("receptor")
    motivo = data.get("motivo", "")
    request_id = data.get("request_id") # Optional, to link request flow
    
    current_status = asset["status"]
    
    # 1. State Machine Transition Validation
    allowed = ALLOWED_TRANSITIONS.get(current_status, [])
    if target_status not in allowed:
        return jsonify({
            "error": f"Transición no permitida de '{current_status}' a '{target_status}'. Pasos no pueden saltarse."
        }), 400
        
    # 2. D1 (Stock Check & Compatibility Matrix Check)
    if current_status == "En Bodega" and target_status == "En Tránsito (Bodega-TI)":
        if request_id:
            req = next((r for r in db["requests"] if r["id"] == request_id), None)
            if req:
                profile = req["collaborator_profile"]
                # Match compatibility
                rules = COMPATIBILITY_MATRIX.get(profile)
                if rules:
                    asset_ram = parse_ram_gb(asset["specs"].get("ram", "0GB"))
                    if asset_ram < rules["required_ram_min"]:
                        return jsonify({
                            "error": f"Incompatibilidad Técnica D1: El cargo '{profile}' requiere mínimo {rules['required_ram_min']}GB RAM. Este activo tiene {asset_ram}GB RAM."
                        }), 400
                    if asset["category"] not in rules["required_categories"]:
                        return jsonify({
                            "error": f"Incompatibilidad Técnica D1: El cargo '{profile}' requiere equipos del tipo: {', '.join(rules['required_categories'])}."
                        }), 400
                req["status"] = "Aprobado (Despachado)"
                asset["assigned_to"] = req["collaborator"]
                # Administrative responsible transfers to Jefe de Área
                asset["responsable_administrativo"] = f"Jefe de Área ({req['collaborator']})"
    
    # Update custody physical and administrative responsibilities
    # Custodio Físico: who physically holds the device
    # Responsable Administrativo: who holds legal liability
    if target_status == "En Tránsito (Bodega-TI)":
        asset["custodio_fisico"] = "Transportista / En Tránsito"
    elif target_status == "En Configuración":
        asset["custodio_fisico"] = "Técnico TI: Configuración"
    elif target_status == "Listo para Entrega" or target_status == "Pendiente de Recepción Formal":
        asset["custodio_fisico"] = "Soporte TI: Listo para Entrega"
    elif target_status == "Asignado":
        asset["custodio_fisico"] = f"Colaborador: {asset['assigned_to']}"
        asset["responsable_administrativo"] = f"Colaborador: {asset['assigned_to']}"
    elif target_status == "En Diagnóstico":
        asset["custodio_fisico"] = "Técnico TI: Servicio Técnico"
    elif target_status == "Pendiente de Decisión":
        asset["custodio_fisico"] = "Soporte TI: Custodia Temporal"
    elif target_status == "Asignado (Extendido)":
        asset["custodio_fisico"] = f"Colaborador: {asset['assigned_to']}"
        asset["responsable_administrativo"] = f"Colaborador: {asset['assigned_to']}"
    elif target_status == "Pendiente de Devolución":
        asset["custodio_fisico"] = "Logística de Devolución / Tránsito"
    elif target_status == "En Validación Técnica":
        asset["custodio_fisico"] = "Técnico TI: Validación e Higienización"
        asset["responsable_administrativo"] = "Jefe de Área TI"
    elif target_status == "Disponible para Reasignación":
        asset["custodio_fisico"] = "Encargado de Bodega"
        asset["responsable_administrativo"] = "Jefe de Área TI"
    elif target_status == "En Bodega":
        asset["custodio_fisico"] = "Encargado de Bodega"
        asset["responsable_administrativo"] = "Jefe de Área TI"
        asset["assigned_to"] = None
        asset["repair_cost"] = None
    elif target_status == "Incidente Externo":
        asset["custodio_fisico"] = "Ninguno (Siniestrado)"
        # Note: Administrative responsible remains the collaborator under investigation
    elif target_status == "Dado de Baja":
        asset["custodio_fisico"] = "Ninguno (Dado de Baja)"
        asset["responsable_administrativo"] = "Finanzas DAE (Baja Contable)"
        asset["assigned_to"] = None

    # Perform status change
    asset["status"] = target_status
    
    # 3. Create Immutable Audit Log
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "asset_qr": qr_code,
        "from_status": current_status,
        "to_status": target_status,
        "emisor": emisor,
        "receptor": receptor,
        "motivo": motivo,
        "custodio_fisico": asset["custodio_fisico"],
        "responsable_administrativo": asset["responsable_administrativo"]
    }
    db["history"].append(log_entry)
    
    write_db(db)
    return jsonify({"asset": asset, "log": log_entry})

@app.route('/api/assets/<qr_code>/diagnose', methods=['POST'])
def diagnose_asset(qr_code):
    db = read_db()
    asset = next((a for a in db["assets"] if a["qr_code"] == qr_code), None)
    if not asset:
        return jsonify({"error": "Activo no encontrado"}), 404
        
    data = request.json
    repair_cost = int(data.get("repair_cost", 0))
    emisor = data.get("emisor", "Técnico")
    
    asset["repair_cost"] = repair_cost
    current_date = data.get("date", "2026-05-22")
    
    # D2 calculation:
    # 1. Cost Comparison
    cost_exceeded = repair_cost > asset["new_equipment_price"]
    
    # 2. Lifespan Remaining check
    remaining_months = calculate_remaining_lifespan(asset, current_date)
    lifespan_short = remaining_months < 6
    
    previous_status = asset["status"]
    
    if cost_exceeded or lifespan_short:
        # Move to Pendiente de Decisión
        reason = []
        if cost_exceeded:
            reason.append(f"Costo de reparación (${repair_cost:,} CLP) excede precio nuevo (${asset['new_equipment_price']:,} CLP)")
        if lifespan_short:
            reason.append(f"Vida útil restante ({remaining_months} meses) es menor a 6 meses (Obsolescencia)")
            
        motivo = "Bloqueo D2: " + " y ".join(reason)
        asset["status"] = "Pendiente de Decisión"
        asset["custodio_fisico"] = "Soporte TI: Custodia Temporal"
        
        # Log transition
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "asset_qr": qr_code,
            "from_status": previous_status,
            "to_status": "Pendiente de Decisión",
            "emisor": emisor,
            "receptor": "Finanzas",
            "motivo": motivo,
            "custodio_fisico": asset["custodio_fisico"],
            "responsable_administrativo": asset["responsable_administrativo"]
        }
        db["history"].append(log_entry)
        write_db(db)
        return jsonify({
            "decision": "Pendiente de Decisión",
            "reason": motivo,
            "asset": asset
        })
    else:
        # Allow transition to configuration for repair
        motivo = f"Autorización D2: Costo reparación (${repair_cost:,} CLP) <= Nuevo (${asset['new_equipment_price']:,} CLP) y Vida útil restante ({remaining_months} meses) >= 6 meses"
        asset["status"] = "En Configuración"
        asset["custodio_fisico"] = "Técnico TI: Configuración"
        
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "asset_qr": qr_code,
            "from_status": previous_status,
            "to_status": "En Configuración",
            "emisor": emisor,
            "receptor": "Técnico TI",
            "motivo": motivo,
            "custodio_fisico": asset["custodio_fisico"],
            "responsable_administrativo": asset["responsable_administrativo"]
        }
        db["history"].append(log_entry)
        write_db(db)
        return jsonify({
            "decision": "Reparar",
            "reason": motivo,
            "asset": asset
        })

@app.route('/api/assets/<qr_code>/finance-decision', methods=['POST'])
def finance_decision(qr_code):
    db = read_db()
    asset = next((a for a in db["assets"] if a["qr_code"] == qr_code), None)
    if not asset:
        return jsonify({"error": "Activo no encontrado"}), 404
        
    data = request.json
    action = data.get("action") # "baja" or "extension"
    emisor = data.get("emisor", "Finanzas")
    motivo = data.get("motivo", "")
    
    if asset["status"] != "Pendiente de Decisión":
        return jsonify({"error": "El activo no está en estado Pendiente de Decisión"}), 400
        
    previous_status = asset["status"]
    
    if action == "baja":
        asset["status"] = "Dado de Baja"
        asset["custodio_fisico"] = "Ninguno (Dado de Baja)"
        asset["responsable_administrativo"] = "Finanzas DAE (Baja Contable)"
        
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "asset_qr": qr_code,
            "from_status": previous_status,
            "to_status": "Dado de Baja",
            "emisor": emisor,
            "receptor": "Inventario Pasivo",
            "motivo": f"Baja contable y física autorizada por Finanzas: {motivo}",
            "custodio_fisico": asset["custodio_fisico"],
            "responsable_administrativo": asset["responsable_administrativo"]
        }
        db["history"].append(log_entry)
        write_db(db)
        return jsonify({"success": True, "asset": asset})
        
    elif action == "extension":
        # D3 quantifiable criteria check
        battery_wear = asset["battery_wear_pct"]
        failures = asset["previous_failures_count"]
        
        if battery_wear >= 30 or failures >= 3:
            warnings = []
            if battery_wear >= 30:
                warnings.append(f"Desgaste de batería es {battery_wear}% (Límite: <30%)")
            if failures >= 3:
                warnings.append(f"Conteo de fallas previas es {failures} (Límite: <3)")
            
            # Require justification or block
            justification = data.get("justification", "")
            if not justification:
                return jsonify({
                    "error": f"Falla D3: Criterio de extensión excedido ({', '.join(warnings)}). Se requiere justificación excepcional obligatoria de Finanzas."
                }), 400
            
            motivo = f"Aprobado con Excepción Especial D3. {', '.join(warnings)}. Justificación: {justification}"
        else:
            motivo = f"Aprobado bajo parámetros D3 estándar: Desgaste batería ({battery_wear}%) < 30%, Fallas ({failures}) < 3."
            
        asset["status"] = "Asignado (Extendido)"
        asset["extension_months"] = 12
        asset["custodio_fisico"] = f"Colaborador: {asset['assigned_to']}"
        asset["responsable_administrativo"] = f"Colaborador: {asset['assigned_to']}"
        
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "asset_qr": qr_code,
            "from_status": previous_status,
            "to_status": "Asignado (Extendido)",
            "emisor": emisor,
            "receptor": f"Colaborador: {asset['assigned_to']}",
            "motivo": motivo,
            "custodio_fisico": asset["custodio_fisico"],
            "responsable_administrativo": asset["responsable_administrativo"]
        }
        db["history"].append(log_entry)
        write_db(db)
        return jsonify({"success": True, "asset": asset})
        
    else:
        return jsonify({"error": "Acción financiera no reconocida"}), 400

@app.route('/api/assets/<qr_code>/incident', methods=['POST'])
def report_incident(qr_code):
    db = read_db()
    asset = next((a for a in db["assets"] if a["qr_code"] == qr_code), None)
    if not asset:
        return jsonify({"error": "Activo no encontrado"}), 404
        
    data = request.json
    police_report_num = data.get("police_report_num")
    description = data.get("description")
    emisor = data.get("emisor")
    
    if not police_report_num:
        return jsonify({"error": "El número de denuncia policial es obligatorio"}), 400
        
    previous_status = asset["status"]
    asset["status"] = "Incidente Externo"
    asset["custodio_fisico"] = "Ninguno (Siniestrado / Robo)"
    asset["incident_details"] = {
        "police_report_num": police_report_num,
        "description": description,
        "reported_at": datetime.now().isoformat(),
        "reported_by": emisor
    }
    
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "asset_qr": qr_code,
        "from_status": previous_status,
        "to_status": "Incidente Externo",
        "emisor": emisor,
        "receptor": "Comité de Auditoría / Finanzas",
        "motivo": f"Registro de Incidente Externo - Denuncia N° {police_report_num}. Detalle: {description}",
        "custodio_fisico": asset["custodio_fisico"],
        "responsable_administrativo": asset["responsable_administrativo"]
    }
    db["history"].append(log_entry)
    write_db(db)
    return jsonify({"success": True, "asset": asset})

@app.route('/api/history', methods=['GET'])
def get_history():
    db = read_db()
    qr_code = request.args.get('qr_code')
    if qr_code:
        logs = [log for log in db["history"] if log["asset_qr"] == qr_code]
        return jsonify(logs)
    return jsonify(db["history"])

@app.route('/api/reset', methods=['POST'])
def reset_db():
    initial_data = {
      "assets": [
        {
          "qr_code": "UCT-TI-2024-088",
          "category": "MacBook Pro M3",
          "specs": {
            "ram": "18GB",
            "processor": "M3 Pro",
            "storage": "512GB SSD"
          },
          "original_value": 2500000,
          "book_value": 2500000,
          "purchase_date": "2025-05-22",
          "status": "En Bodega",
          "custodio_fisico": "Encargado de Bodega",
          "responsable_administrativo": "Jefe de Área TI",
          "assigned_to": null,
          "repair_cost": null,
          "new_equipment_price": 3000000,
          "lifespan_months": 36,
          "extension_months": 0,
          "warranty_end_date": "2027-05-22",
          "battery_wear_pct": 12,
          "previous_failures_count": 0,
          "incident_details": null
        },
        {
          "qr_code": "UCT-TI-2024-001",
          "category": "Dell Latitude 5440",
          "specs": {
            "ram": "8GB",
            "processor": "Intel Core i5",
            "storage": "256GB SSD"
          },
          "original_value": 1200000,
          "book_value": 1200000,
          "purchase_date": "2025-11-22",
          "status": "En Bodega",
          "custodio_fisico": "Encargado de Bodega",
          "responsable_administrativo": "Jefe de Área TI",
          "assigned_to": null,
          "repair_cost": null,
          "new_equipment_price": 1400000,
          "lifespan_months": 36,
          "extension_months": 0,
          "warranty_end_date": "2027-11-22",
          "battery_wear_pct": 5,
          "previous_failures_count": 0,
          "incident_details": null
        }
      ],
      "requests": [],
      "history": [
        {
          "timestamp": "2025-05-22T09:00:00Z",
          "asset_qr": "UCT-TI-2024-088",
          "from_status": "Ninguno",
          "to_status": "En Bodega",
          "emisor": "Sistema de Compras",
          "receptor": "Encargado de Bodega",
          "motivo": "Ingreso inicial de MacBook Pro M3 nuevo a stock de bodega",
          "custodio_fisico": "Encargado de Bodega",
          "responsable_administrativo": "Jefe de Área TI"
        },
        {
          "timestamp": "2025-11-22T10:00:00Z",
          "asset_qr": "UCT-TI-2024-001",
          "from_status": "Ninguno",
          "to_status": "En Bodega",
          "emisor": "Sistema de Compras",
          "receptor": "Encargado de Bodega",
          "motivo": "Ingreso inicial de Dell Latitude a stock de bodega",
          "custodio_fisico": "Encargado de Bodega",
          "responsable_administrativo": "Jefe de Área TI"
        }
      ]
    }
    write_db(initial_data)
    return jsonify({"message": "Base de datos reiniciada con éxito", "status": "ok"})

if __name__ == '__main__':
    app.run(port=5000, debug=True)
