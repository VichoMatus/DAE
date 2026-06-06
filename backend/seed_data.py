import json

from werkzeug.security import generate_password_hash

from models import (
    AllocationRequest,
    Asset,
    HistoryLog,
    User,
    allow_history_mutations,
    db,
)


def _seed_users():
    return [
        {"username": "jefe_gomez", "role": "jefe_area"},
        {"username": "bodega_silva", "role": "bodega"},
        {"username": "ti_morales", "role": "ti"},
        {"username": "colab_ramirez", "role": "colaborador"},
        {"username": "finanzas_vera", "role": "finanzas"},
        {"username": "auditor_lagos", "role": "auditor"},
    ]


def _seed_assets():
    return [
        {
            "qr_code": "UCT-TI-2024-088",
            "category": "MacBook Pro M3",
            "specs": {"ram": "18GB", "processor": "M3 Pro", "storage": "512GB SSD"},
            "original_value": 2500000,
            "purchase_date": "2025-05-22",
            "status": "En Bodega",
            "custodio_fisico": "Encargado de Bodega",
            "responsable_administrativo": "Jefe de Área TI",
            "assigned_to": None,
            "repair_cost": None,
            "new_equipment_price": 3000000,
            "lifespan_months": 36,
            "extension_months": 0,
            "warranty_end_date": "2027-05-22",
            "battery_wear_pct": 12,
            "previous_failures_count": 0,
        },
        {
            "qr_code": "UCT-TI-2024-001",
            "category": "Dell Latitude 5440",
            "specs": {"ram": "8GB", "processor": "Intel Core i5", "storage": "256GB SSD"},
            "original_value": 1200000,
            "purchase_date": "2025-11-22",
            "status": "En Bodega",
            "custodio_fisico": "Encargado de Bodega",
            "responsable_administrativo": "Jefe de Área TI",
            "assigned_to": None,
            "repair_cost": None,
            "new_equipment_price": 1400000,
            "lifespan_months": 36,
            "extension_months": 0,
            "warranty_end_date": "2027-11-22",
            "battery_wear_pct": 5,
            "previous_failures_count": 0,
        },
        {
            "qr_code": "UCT-TI-2024-055",
            "category": "ThinkPad L14",
            "specs": {"ram": "8GB", "processor": "Intel Core i7", "storage": "512GB SSD"},
            "original_value": 1500000,
            "purchase_date": "2024-01-15",
            "status": "Asignado",
            "custodio_fisico": "Colaborador: Roberto Ramírez",
            "responsable_administrativo": "Colaborador: Roberto Ramírez",
            "assigned_to": "Roberto Ramírez",
            "repair_cost": None,
            "new_equipment_price": 1600000,
            "lifespan_months": 36,
            "extension_months": 0,
            "warranty_end_date": "2026-01-15",
            "battery_wear_pct": 35,
            "previous_failures_count": 2,
        },
        {
            "qr_code": "UCT-TI-2024-033",
            "category": "MacBook Pro M1",
            "specs": {"ram": "16GB", "processor": "M1 Pro", "storage": "256GB SSD"},
            "original_value": 2000000,
            "purchase_date": "2024-06-01",
            "status": "Asignado (Extendido)",
            "custodio_fisico": "Colaborador: Roberto Ramírez",
            "responsable_administrativo": "Colaborador: Roberto Ramírez",
            "assigned_to": "Roberto Ramírez",
            "repair_cost": None,
            "new_equipment_price": 2200000,
            "lifespan_months": 36,
            "extension_months": 12,
            "warranty_end_date": "2026-06-01",
            "battery_wear_pct": 40,
            "previous_failures_count": 3,
        },
    ]


def _seed_history():
    return [
        {
            "timestamp": "2025-05-22T09:00:00",
            "asset_qr": "UCT-TI-2024-088",
            "from_status": "Ninguno",
            "to_status": "En Bodega",
            "emisor": "Sistema de Compras",
            "receptor": "Encargado de Bodega",
            "motivo": "Ingreso inicial de MacBook Pro M3 nuevo a stock de bodega",
            "custodio_fisico": "Encargado de Bodega",
            "responsable_administrativo": "Jefe de Área TI",
        },
        {
            "timestamp": "2025-11-22T10:00:00",
            "asset_qr": "UCT-TI-2024-001",
            "from_status": "Ninguno",
            "to_status": "En Bodega",
            "emisor": "Sistema de Compras",
            "receptor": "Encargado de Bodega",
            "motivo": "Ingreso inicial de Dell Latitude a stock de bodega",
            "custodio_fisico": "Encargado de Bodega",
            "responsable_administrativo": "Jefe de Área TI",
        },
        {
            "timestamp": "2024-06-01T08:00:00",
            "asset_qr": "UCT-TI-2024-033",
            "from_status": "Ninguno",
            "to_status": "Asignado (Extendido)",
            "emisor": "Sistema de Compras",
            "receptor": "Encargado de Bodega",
            "motivo": "Ingreso y asignación extendida de MacBook Pro M1",
            "custodio_fisico": "Colaborador: Roberto Ramírez",
            "responsable_administrativo": "Colaborador: Roberto Ramírez",
        },
    ]


def _clear_all_tables():
    with allow_history_mutations():
        for model in (HistoryLog, AllocationRequest, Asset, User):
            for row in model.query.all():
                db.session.delete(row)
        db.session.flush()


def seed_database():
    db.create_all()
    _clear_all_tables()

    for user_data in _seed_users():
        db.session.add(
            User(
                username=user_data["username"],
                password_hash=generate_password_hash("demo1234"),
                role=user_data["role"],
                is_active=True,
            )
        )

    for asset_data in _seed_assets():
        db.session.add(
            Asset(
                qr_code=asset_data["qr_code"],
                category=asset_data["category"],
                specs=json.dumps(asset_data["specs"], ensure_ascii=False),
                original_value=asset_data["original_value"],
                purchase_date=asset_data["purchase_date"],
                status=asset_data["status"],
                custodio_fisico=asset_data["custodio_fisico"],
                responsable_administrativo=asset_data["responsable_administrativo"],
                assigned_to=asset_data["assigned_to"],
                repair_cost=asset_data["repair_cost"],
                new_equipment_price=asset_data["new_equipment_price"],
                lifespan_months=asset_data["lifespan_months"],
                extension_months=asset_data["extension_months"],
                warranty_end_date=asset_data["warranty_end_date"],
                battery_wear_pct=asset_data["battery_wear_pct"],
                previous_failures_count=asset_data["previous_failures_count"],
                incident_details=None,
            )
        )

    for history_data in _seed_history():
        db.session.add(HistoryLog(**history_data))

    db.session.commit()
