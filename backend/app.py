import json
from datetime import datetime
from pathlib import Path
from functools import wraps

from flask import Flask, jsonify, request, session
from flask_cors import CORS
from werkzeug.security import check_password_hash

from models import AllocationRequest, Asset, HistoryLog, User, calculate_remaining_lifespan, db
from seed_data import seed_database


app = Flask(__name__)
app.config["SECRET_KEY"] = "dae-activa-secret-2026"
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{(Path(__file__).resolve().parent / 'dae_activa.db').as_posix()}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db.init_app(app)
CORS(app, supports_credentials=True, origins=['http://localhost:3000'])

with app.app_context():
    db.create_all()


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
    "Dado de Baja": [],
}

# Compatibility Matrix for D1
# Key: Job Profile, Value: dict of compatibility rules
COMPATIBILITY_MATRIX = {
    "Desarrollador / TI": {
        "required_ram_min": 16,
        "required_categories": ["MacBook Pro M3", "MacBook Pro M1", "Workstation i9"],
    },
    "Administrativo / Finanzas": {
        "required_ram_min": 8,
        "required_categories": ["Dell Latitude 5440", "ThinkPad L14"],
    },
}


def parse_ram_gb(ram_str):
    # Extracts number from strings like "18GB" or "8GB"
    try:
        return int("".join(filter(str.isdigit, ram_str)))
    except ValueError:
        return 0


def require_auth(roles=None):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if 'user_id' not in session:
                return jsonify({'error': 'No autenticado'}), 401
            if roles and session.get('role') not in roles:
                return jsonify({'error': 'Sin permisos para esta acción'}), 403
            return f(*args, **kwargs)

        return decorated

    return decorator


def _asset_or_404(qr_code):
    asset = db.session.get(Asset, qr_code)
    if not asset:
        return None, (jsonify({"error": "Activo no encontrado"}), 404)
    return asset, None


def _append_log(asset, from_status, to_status, emisor, receptor, motivo):
    log_entry = HistoryLog(
        timestamp=datetime.now().isoformat(),
        asset_qr=asset.qr_code,
        from_status=from_status,
        to_status=to_status,
        emisor=emisor,
        receptor=receptor,
        motivo=motivo,
        custodio_fisico=asset.custodio_fisico,
        responsable_administrativo=asset.responsable_administrativo,
    )
    db.session.add(log_entry)
    return log_entry


def _apply_custody_updates(asset, target_status):
    if target_status == "En Tránsito (Bodega-TI)":
        asset.custodio_fisico = "Transportista / En Tránsito"
    elif target_status == "En Configuración":
        asset.custodio_fisico = "Técnico TI: Configuración"
    elif target_status == "Listo para Entrega" or target_status == "Pendiente de Recepción Formal":
        asset.custodio_fisico = "Soporte TI: Listo para Entrega"
    elif target_status == "Asignado":
        asset.custodio_fisico = f"Colaborador: {asset.assigned_to}"
        asset.responsable_administrativo = f"Colaborador: {asset.assigned_to}"
    elif target_status == "En Diagnóstico":
        asset.custodio_fisico = "Técnico TI: Servicio Técnico"
    elif target_status == "Pendiente de Decisión":
        asset.custodio_fisico = "Soporte TI: Custodia Temporal"
    elif target_status == "Asignado (Extendido)":
        asset.custodio_fisico = f"Colaborador: {asset.assigned_to}"
        asset.responsable_administrativo = f"Colaborador: {asset.assigned_to}"
    elif target_status == "Pendiente de Devolución":
        asset.custodio_fisico = "Logística de Devolución / Tránsito"
    elif target_status == "En Validación Técnica":
        asset.custodio_fisico = "Técnico TI: Validación e Higienización"
        asset.responsable_administrativo = "Jefe de Área TI"
    elif target_status == "Disponible para Reasignación":
        asset.custodio_fisico = "Encargado de Bodega"
        asset.responsable_administrativo = "Jefe de Área TI"
    elif target_status == "En Bodega":
        asset.custodio_fisico = "Encargado de Bodega"
        asset.responsable_administrativo = "Jefe de Área TI"
        asset.assigned_to = None
        asset.repair_cost = None
    elif target_status == "Incidente Externo":
        asset.custodio_fisico = "Ninguno (Siniestrado)"
    elif target_status == "Dado de Baja":
        asset.custodio_fisico = "Ninguno (Dado de Baja)"
        asset.responsable_administrativo = "Finanzas DAE (Baja Contable)"
        asset.assigned_to = None


# --- ENDPOINTS ---


@app.route('/api/auth/login', methods=['POST'])
def auth_login():
    data = request.json or {}
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Credenciales inválidas'}), 401

    session['user_id'] = user.id
    session['role'] = user.role
    return jsonify({'user_id': user.id, 'username': user.username, 'role': user.role}), 200


@app.route('/api/auth/logout', methods=['POST'])
def auth_logout():
    session.clear()
    return jsonify({'message': 'Sesión cerrada'}), 200


@app.route('/api/auth/me', methods=['GET'])
def auth_me():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'No autenticado'}), 401

    user = db.session.get(User, user_id)
    if not user:
        session.clear()
        return jsonify({'error': 'No autenticado'}), 401

    return jsonify({'user_id': user.id, 'username': user.username, 'role': user.role})


@app.route('/api/assets', methods=['GET'])
@require_auth()
def get_assets():
    current_date = request.args.get('date', '2026-05-22')
    assets = Asset.query.all()
    return jsonify([asset.to_dict(current_date) for asset in assets])


@app.route('/api/assets/<qr_code>', methods=['GET'])
def get_asset_detail(qr_code):
    asset, error_response = _asset_or_404(qr_code)
    if error_response:
        return error_response

    current_date = request.args.get('date', '2026-05-22')
    return jsonify(asset.to_dict(current_date))


@app.route('/api/requests', methods=['GET'])
@require_auth()
def get_requests():
    return jsonify([allocation_request.to_dict() for allocation_request in AllocationRequest.query.all()])


@app.route('/api/requests', methods=['POST'])
@require_auth(['jefe_area'])
def create_request():
    data = request.json or {}
    req_id = f"REQ-{AllocationRequest.query.count() + 1:03d}"
    new_request = AllocationRequest(
        id=req_id,
        requester_role=data.get("requester_role", "Jefe de Área"),
        collaborator=data.get("collaborator"),
        collaborator_profile=data.get("collaborator_profile"),
        category_requested=data.get("category_requested"),
        reason=data.get("reason"),
        status="Pendiente",
        created_at=datetime.now().isoformat(),
    )
    db.session.add(new_request)
    db.session.commit()
    return jsonify(new_request.to_dict()), 201


@app.route('/api/assets', methods=['POST'])
@require_auth(['bodega'])
def create_asset():
    data = request.json or {}
    qr_code = data.get("qr_code", "").strip()
    category = data.get("category", "").strip()
    specs = data.get("specs") or {}
    original_value = int(data.get("original_value", 0))
    purchase_date = data.get("purchase_date", "")
    new_equipment_price = int(data.get("new_equipment_price", 0))
    lifespan_months = int(data.get("lifespan_months", 0))
    warranty_end_date = data.get("warranty_end_date", "")

    if not qr_code or not category or not purchase_date or not warranty_end_date:
        return jsonify({"error": "Faltan campos obligatorios para registrar el activo"}), 400

    if Asset.query.filter_by(qr_code=qr_code).first():
        return jsonify({"error": "El código QR ya está registrado en el sistema"}), 409

    if original_value <= 0 or new_equipment_price <= 0:
        return jsonify({"error": "Los valores monetarios deben ser mayores a 0"}), 400

    try:
        datetime.strptime(purchase_date, "%Y-%m-%d")
    except ValueError:
        return jsonify({"error": "Formato de fecha inválido. Use YYYY-MM-DD"}), 400

    asset = Asset(
        qr_code=qr_code,
        category=category,
        specs=json.dumps(specs, ensure_ascii=False),
        original_value=original_value,
        purchase_date=purchase_date,
        status="En Bodega",
        custodio_fisico="Encargado de Bodega",
        responsable_administrativo="Jefe de Área TI",
        assigned_to=None,
        repair_cost=None,
        new_equipment_price=new_equipment_price,
        lifespan_months=lifespan_months,
        extension_months=0,
        warranty_end_date=warranty_end_date,
        battery_wear_pct=0,
        previous_failures_count=0,
        incident_details=None,
    )
    db.session.add(asset)

    history_log = HistoryLog(
        timestamp=datetime.now().isoformat(),
        asset_qr=qr_code,
        from_status="Ninguno",
        to_status="En Bodega",
        emisor="Encargado de Bodega",
        receptor="Encargado de Bodega",
        motivo=f"Ingreso de nuevo activo al sistema: {category}. Registrado por bodega con código {qr_code}.",
        custodio_fisico="Encargado de Bodega",
        responsable_administrativo="Jefe de Área TI",
    )
    db.session.add(history_log)
    db.session.commit()

    return jsonify(asset.to_dict()), 201


@app.route('/api/assets/<qr_code>/transition', methods=['POST'])
@require_auth(['jefe_area', 'bodega', 'ti', 'colaborador'])
def transition_asset(qr_code):
    asset, error_response = _asset_or_404(qr_code)
    if error_response:
        return error_response

    data = request.json or {}
    target_status = data.get("status")
    emisor = data.get("emisor")
    receptor = data.get("receptor")
    motivo = data.get("motivo", "")
    request_id = data.get("request_id")

    current_status = asset.status
    allowed = ALLOWED_TRANSITIONS.get(current_status, [])
    if target_status not in allowed:
        return jsonify({
            "error": f"Transición no permitida de '{current_status}' a '{target_status}'. Pasos no pueden saltarse."
        }), 400

    if current_status == "En Bodega" and target_status == "En Tránsito (Bodega-TI)":
        if request_id:
            req = db.session.get(AllocationRequest, request_id)
            if req:
                profile = req.collaborator_profile
                rules = COMPATIBILITY_MATRIX.get(profile)
                if rules:
                    asset_specs = json.loads(asset.specs) if asset.specs else {}
                    asset_ram = parse_ram_gb(asset_specs.get("ram", "0GB"))
                    if asset_ram < rules["required_ram_min"]:
                        return jsonify({
                            "error": f"Incompatibilidad Técnica D1: El cargo '{profile}' requiere mínimo {rules['required_ram_min']}GB RAM. Este activo tiene {asset_ram}GB RAM."
                        }), 400
                    if asset.category not in rules["required_categories"]:
                        return jsonify({
                            "error": f"Incompatibilidad Técnica D1: El cargo '{profile}' requiere equipos del tipo: {', '.join(rules['required_categories'])}."
                        }), 400
                req.status = "Aprobado (Despachado)"
                asset.assigned_to = req.collaborator
                asset.responsable_administrativo = f"Jefe de Área ({req.collaborator})"

    _apply_custody_updates(asset, target_status)
    asset.status = target_status

    log_entry = _append_log(asset, current_status, target_status, emisor, receptor, motivo)
    db.session.commit()
    return jsonify({"asset": asset.to_dict(), "log": log_entry.to_dict()})


@app.route('/api/assets/<qr_code>/diagnose', methods=['POST'])
@require_auth(['ti'])
def diagnose_asset(qr_code):
    asset, error_response = _asset_or_404(qr_code)
    if error_response:
        return error_response

    data = request.json or {}
    repair_cost = int(data.get("repair_cost", 0))
    emisor = data.get("emisor", "Técnico")

    asset.repair_cost = repair_cost
    asset.previous_failures_count = (asset.previous_failures_count or 0) + 1
    current_date = data.get("date", "2026-05-22")

    cost_exceeded = repair_cost > asset.new_equipment_price
    remaining_months = calculate_remaining_lifespan(asset, current_date)
    lifespan_short = remaining_months < 6

    previous_status = asset.status

    if cost_exceeded or lifespan_short:
        reason = []
        if cost_exceeded:
            reason.append(f"Costo de reparación (${repair_cost:,} CLP) excede precio nuevo (${asset.new_equipment_price:,} CLP)")
        if lifespan_short:
            reason.append(f"Vida útil restante ({remaining_months} meses) es menor a 6 meses (Obsolescencia)")

        motivo = "Bloqueo D2: " + " y ".join(reason)
        asset.status = "Pendiente de Decisión"
        asset.custodio_fisico = "Soporte TI: Custodia Temporal"

        _append_log(asset, previous_status, "Pendiente de Decisión", emisor, "Finanzas", motivo)
        db.session.commit()
        return jsonify({
            "decision": "Pendiente de Decisión",
            "reason": motivo,
            "asset": asset.to_dict()
        })

    motivo = f"Autorización D2: Costo reparación (${repair_cost:,} CLP) <= Nuevo (${asset.new_equipment_price:,} CLP) y Vida útil restante ({remaining_months} meses) >= 6 meses"
    asset.status = "En Configuración"
    asset.custodio_fisico = "Técnico TI: Configuración"

    _append_log(asset, previous_status, "En Configuración", emisor, "Técnico TI", motivo)
    db.session.commit()
    return jsonify({
        "decision": "Reparar",
        "reason": motivo,
        "asset": asset.to_dict()
    })


@app.route('/api/assets/<qr_code>/finance-decision', methods=['POST'])
@require_auth(['finanzas'])
def finance_decision(qr_code):
    asset, error_response = _asset_or_404(qr_code)
    if error_response:
        return error_response

    data = request.json or {}
    action = data.get("action")
    emisor = data.get("emisor", "Finanzas")
    motivo = data.get("motivo", "")

    if asset.status not in {"Pendiente de Decisión", "Incidente Externo"}:
        return jsonify({"error": "El activo no está en estado Pendiente de Decisión"}), 400

    previous_status = asset.status

    if action == "baja":
        asset.status = "Dado de Baja"
        asset.custodio_fisico = "Ninguno (Dado de Baja)"
        asset.responsable_administrativo = "Finanzas DAE (Baja Contable)"

        if previous_status == "Incidente Externo":
            motivo_baja = f"Baja contable y física autorizada por Finanzas para siniestro: {motivo}"
        else:
            motivo_baja = f"Baja contable y física autorizada por Finanzas: {motivo}"

        _append_log(
            asset,
            previous_status,
            "Dado de Baja",
            emisor,
            "Inventario Pasivo",
            motivo_baja,
        )
        db.session.commit()
        return jsonify({"success": True, "asset": asset.to_dict()})

    if action == "extension":
        if previous_status == "Incidente Externo":
            return jsonify({"error": "Un activo siniestrado solo puede ser dado de baja, no extendido"}), 400

        battery_wear = asset.battery_wear_pct
        failures = asset.previous_failures_count

        if battery_wear >= 30 or failures >= 3:
            warnings = []
            if battery_wear >= 30:
                warnings.append(f"Desgaste de batería es {battery_wear}% (Límite: <30%)")
            if failures >= 3:
                warnings.append(f"Conteo de fallas previas es {failures} (Límite: <3)")

            justification = data.get("justification", "")
            if not justification:
                return jsonify({
                    "error": f"Falla D3: Criterio de extensión excedido ({', '.join(warnings)}). Se requiere justificación excepcional obligatoria de Finanzas."
                }), 400

            motivo = f"Aprobado con Excepción Especial D3. {', '.join(warnings)}. Justificación: {justification}"
        else:
            motivo = f"Aprobado bajo parámetros D3 estándar: Desgaste batería ({battery_wear}%) < 30%, Fallas ({failures}) < 3."

        asset.status = "Asignado (Extendido)"
        asset.extension_months = 12
        asset.custodio_fisico = f"Colaborador: {asset.assigned_to}"
        asset.responsable_administrativo = f"Colaborador: {asset.assigned_to}"

        extension_motivo = motivo
        if battery_wear >= 30 or failures >= 3:
            extension_motivo = f"Aprobado con Excepción Especial D3. {', '.join(warnings)}. Justificación: {justification}"
        else:
            extension_motivo = (
                f"Aprobado bajo parámetros D3 estándar: Desgaste batería ({battery_wear}%) < 30%, Fallas ({failures}) < 3."
            )

        _append_log(
            asset,
            previous_status,
            "Asignado (Extendido)",
            emisor,
            f"Colaborador: {asset.assigned_to}",
            extension_motivo,
        )
        db.session.commit()
        return jsonify({"success": True, "asset": asset.to_dict()})

    return jsonify({"error": "Acción financiera no reconocida"}), 400


@app.route('/api/assets/<qr_code>/incident', methods=['POST'])
@require_auth(['colaborador'])
def report_incident(qr_code):
    asset, error_response = _asset_or_404(qr_code)
    if error_response:
        return error_response

    data = request.json or {}
    police_report_num = data.get("police_report_num")
    description = data.get("description")
    emisor = data.get("emisor")

    if not police_report_num:
        return jsonify({"error": "El número de denuncia policial es obligatorio"}), 400

    if asset.status not in {"Asignado", "Asignado (Extendido)"}:
        return jsonify({"error": "El activo no está en un estado válido para reportar incidente"}), 400

    previous_status = asset.status
    asset.status = "Incidente Externo"
    asset.custodio_fisico = "Ninguno (Siniestrado / Robo)"
    asset.incident_details = json.dumps({
        "police_report_num": police_report_num,
        "description": description,
        "reported_at": datetime.now().isoformat(),
        "reported_by": emisor,
    }, ensure_ascii=False)

    _append_log(
        asset,
        previous_status,
        "Incidente Externo",
        emisor,
        "Comité de Auditoría / Finanzas",
        f"Registro de Incidente Externo - Denuncia N° {police_report_num}. Detalle: {description}",
    )
    db.session.commit()
    return jsonify({"success": True, "asset": asset.to_dict()})


@app.route('/api/history', methods=['GET'])
@require_auth()
def get_history():
    qr_code = request.args.get('qr_code')
    query = HistoryLog.query.order_by(HistoryLog.id)
    if qr_code:
        query = query.filter_by(asset_qr=qr_code)
    return jsonify([log.to_dict() for log in query.all()])


@app.route('/api/reset', methods=['POST'])
def reset_db():
    seed_database()
    return jsonify({"message": "Base de datos reiniciada con éxito", "status": "ok"})


if __name__ == '__main__':
    app.run(port=5000, debug=True)
