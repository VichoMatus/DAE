import json
from datetime import datetime
from app import app
from models import db, Asset, HistoryLog

with app.app_context():
    # Limpieza total de activos e historial previo para demostración limpia
    db.session.query(HistoryLog).delete()
    db.session.query(Asset).delete()
    db.session.commit()

    # Equipo 1: UCT-VID-001 (En Bodega)
    asset1 = Asset(
        qr_code="UCT-VID-001",
        category="MacBook Pro M3",
        specs=json.dumps({"ram": "18GB", "processor": "M3 Pro", "storage": "512GB SSD"}, ensure_ascii=False),
        original_value=2500000,
        purchase_date="2026-05-22",
        status="En Bodega",
        custodio_fisico="Encargado de Bodega",
        responsable_administrativo="Jefe de Área TI",
        assigned_to=None,
        repair_cost=None,
        new_equipment_price=3000000,
        lifespan_months=36,
        extension_months=0,
        warranty_end_date="2028-05-22",
        battery_wear_pct=12,
        previous_failures_count=0
    )
    db.session.add(asset1)

    log1 = HistoryLog(
        timestamp=datetime.now().isoformat(),
        asset_qr="UCT-VID-001",
        from_status="Ninguno",
        to_status="En Bodega",
        emisor="Encargado de Bodega",
        receptor="Encargado de Bodega",
        motivo="Ingreso de nuevo activo al sistema para video de demostración.",
        custodio_fisico="Encargado de Bodega",
        responsable_administrativo="Jefe de Área TI"
    )
    db.session.add(log1)

    # Equipo 2: UCT-VID-002 (Listo para Entrega)
    asset2 = Asset(
        qr_code="UCT-VID-002",
        category="ThinkPad L14",
        specs=json.dumps({"ram": "16GB", "processor": "Intel Core i7", "storage": "512GB SSD"}, ensure_ascii=False),
        original_value=1500000,
        purchase_date="2025-06-01",
        status="Listo para Entrega",
        custodio_fisico="Técnico TI",
        responsable_administrativo="Jefe de Área TI",
        assigned_to="Roberto Ramírez",
        repair_cost=None,
        new_equipment_price=1600000,
        lifespan_months=36,
        extension_months=0,
        warranty_end_date="2028-06-01",
        battery_wear_pct=15,
        previous_failures_count=1
    )
    db.session.add(asset2)

    log2 = HistoryLog(
        timestamp=datetime.now().isoformat(),
        asset_qr="UCT-VID-002",
        from_status="Ninguno",
        to_status="Listo para Entrega",
        emisor="Técnico TI",
        receptor="Técnico TI",
        motivo="Equipo configurado y preparado. Listo para asignación.",
        custodio_fisico="Técnico TI",
        responsable_administrativo="Jefe de Área TI"
    )
    db.session.add(log2)

    # Equipo 3: UCT-VID-003 (En Diagnóstico con desgaste batería 45% y 4 fallas)
    asset3 = Asset(
        qr_code="UCT-VID-003",
        category="Dell Latitude 5440",
        specs=json.dumps({"ram": "16GB", "processor": "Intel Core i7", "storage": "512GB SSD"}, ensure_ascii=False),
        original_value=1200000,
        purchase_date="2025-01-01",
        status="En Diagnóstico",
        custodio_fisico="Técnico TI",
        responsable_administrativo="Colaborador: Roberto Ramírez",
        assigned_to="Roberto Ramírez",
        repair_cost=None,
        new_equipment_price=1400000,
        lifespan_months=36,
        extension_months=0,
        warranty_end_date="2027-01-01",
        battery_wear_pct=45,
        previous_failures_count=4
    )
    db.session.add(asset3)

    log3 = HistoryLog(
        timestamp=datetime.now().isoformat(),
        asset_qr="UCT-VID-003",
        from_status="Ninguno",
        to_status="En Diagnóstico",
        emisor="Técnico TI",
        receptor="Técnico TI",
        motivo="Ingreso a servicio técnico por fallas reiteradas reportadas por el colaborador.",
        custodio_fisico="Técnico TI",
        responsable_administrativo="Colaborador: Roberto Ramírez"
    )
    db.session.add(log3)

    db.session.commit()
    print("Base de datos de demostración de video seeded exitosamente.")
