import json
from contextlib import contextmanager
from datetime import datetime

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import event


db = SQLAlchemy()
_HISTORY_MUTATIONS_ALLOWED = False


@contextmanager
def allow_history_mutations():
    global _HISTORY_MUTATIONS_ALLOWED

    previous_state = _HISTORY_MUTATIONS_ALLOWED
    _HISTORY_MUTATIONS_ALLOWED = True
    try:
        yield
    finally:
        _HISTORY_MUTATIONS_ALLOWED = previous_state


def _json_load(value, default=None):
    if value in (None, ""):
        return default
    if isinstance(value, (dict, list)):
        return value
    try:
        return json.loads(value)
    except (TypeError, json.JSONDecodeError):
        return default


def _asset_get(asset, field_name):
    if isinstance(asset, dict):
        return asset.get(field_name)
    return getattr(asset, field_name)


def calculate_book_value(asset, current_date_str="2026-05-22"):
    purchase_date = datetime.strptime(_asset_get(asset, "purchase_date"), "%Y-%m-%d")
    current_date = datetime.strptime(current_date_str, "%Y-%m-%d")

    months_elapsed = (current_date.year - purchase_date.year) * 12 + (current_date.month - purchase_date.month)
    if months_elapsed < 0:
        months_elapsed = 0

    total_lifespan = _asset_get(asset, "lifespan_months") + _asset_get(asset, "extension_months")

    if months_elapsed >= total_lifespan:
        book_value = 0
    else:
        depreciation_per_month = _asset_get(asset, "original_value") / total_lifespan
        book_value = _asset_get(asset, "original_value") - (depreciation_per_month * months_elapsed)

    return int(max(0, book_value))


def calculate_remaining_lifespan(asset, current_date_str="2026-05-22"):
    purchase_date = datetime.strptime(_asset_get(asset, "purchase_date"), "%Y-%m-%d")
    current_date = datetime.strptime(current_date_str, "%Y-%m-%d")

    months_elapsed = (current_date.year - purchase_date.year) * 12 + (current_date.month - purchase_date.month)
    if months_elapsed < 0:
        months_elapsed = 0

    total_lifespan = _asset_get(asset, "lifespan_months") + _asset_get(asset, "extension_months")
    remaining = total_lifespan - months_elapsed
    return max(0, remaining)


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(50), nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "password_hash": self.password_hash,
            "role": self.role,
            "is_active": self.is_active,
        }


class Asset(db.Model):
    qr_code = db.Column(db.String(50), primary_key=True)
    category = db.Column(db.String(100), nullable=False)
    specs = db.Column(db.Text, nullable=False)
    original_value = db.Column(db.Integer, nullable=False)
    purchase_date = db.Column(db.String(20), nullable=False)
    status = db.Column(db.String(80), nullable=False)
    custodio_fisico = db.Column(db.String(150))
    responsable_administrativo = db.Column(db.String(150))
    assigned_to = db.Column(db.String(150), nullable=True)
    repair_cost = db.Column(db.Integer, nullable=True)
    new_equipment_price = db.Column(db.Integer, nullable=False)
    lifespan_months = db.Column(db.Integer, nullable=False)
    extension_months = db.Column(db.Integer, default=0, nullable=False)
    warranty_end_date = db.Column(db.String(20))
    battery_wear_pct = db.Column(db.Integer, default=0, nullable=False)
    previous_failures_count = db.Column(db.Integer, default=0, nullable=False)
    incident_details = db.Column(db.Text, nullable=True)

    history_logs = db.relationship("HistoryLog", backref="asset", lazy=True)

    def to_dict(self, current_date_str=None):
        data = {
            "qr_code": self.qr_code,
            "category": self.category,
            "specs": _json_load(self.specs, {}),
            "original_value": self.original_value,
            "purchase_date": self.purchase_date,
            "status": self.status,
            "custodio_fisico": self.custodio_fisico,
            "responsable_administrativo": self.responsable_administrativo,
            "assigned_to": self.assigned_to,
            "repair_cost": self.repair_cost,
            "new_equipment_price": self.new_equipment_price,
            "lifespan_months": self.lifespan_months,
            "extension_months": self.extension_months,
            "warranty_end_date": self.warranty_end_date,
            "battery_wear_pct": self.battery_wear_pct,
            "previous_failures_count": self.previous_failures_count,
            "incident_details": _json_load(self.incident_details, None),
        }

        if current_date_str is not None:
            data["book_value"] = calculate_book_value(self, current_date_str)
            data["remaining_months"] = calculate_remaining_lifespan(self, current_date_str)

        return data


class AllocationRequest(db.Model):
    id = db.Column(db.String(20), primary_key=True)
    requester_role = db.Column(db.String(80))
    collaborator = db.Column(db.String(150), nullable=False)
    collaborator_profile = db.Column(db.String(100))
    category_requested = db.Column(db.String(100))
    reason = db.Column(db.Text)
    status = db.Column(db.String(50), default="Pendiente")
    created_at = db.Column(db.String(50))

    def to_dict(self):
        return {
            "id": self.id,
            "requester_role": self.requester_role,
            "collaborator": self.collaborator,
            "collaborator_profile": self.collaborator_profile,
            "category_requested": self.category_requested,
            "reason": self.reason,
            "status": self.status,
            "created_at": self.created_at,
        }


class HistoryLog(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    timestamp = db.Column(db.String(50), nullable=False)
    asset_qr = db.Column(db.String(50), db.ForeignKey("asset.qr_code"), nullable=False)
    from_status = db.Column(db.String(80))
    to_status = db.Column(db.String(80), nullable=False)
    emisor = db.Column(db.String(150))
    receptor = db.Column(db.String(150))
    motivo = db.Column(db.Text)
    custodio_fisico = db.Column(db.String(150))
    responsable_administrativo = db.Column(db.String(150))

    def to_dict(self):
        return {
            "timestamp": self.timestamp,
            "asset_qr": self.asset_qr,
            "from_status": self.from_status,
            "to_status": self.to_status,
            "emisor": self.emisor,
            "receptor": self.receptor,
            "motivo": self.motivo,
            "custodio_fisico": self.custodio_fisico,
            "responsable_administrativo": self.responsable_administrativo,
        }


@event.listens_for(HistoryLog, "before_update", propagate=True)
def _prevent_history_update(mapper, connection, target):
    if not _HISTORY_MUTATIONS_ALLOWED:
        raise ValueError("HistoryLog es inmutable")


@event.listens_for(HistoryLog, "before_delete", propagate=True)
def _prevent_history_delete(mapper, connection, target):
    if not _HISTORY_MUTATIONS_ALLOWED:
        raise ValueError("HistoryLog es inmutable")
