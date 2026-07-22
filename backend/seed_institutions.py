from app.database import SessionLocal
from app.models.models import Institution, InstitutionType

db = SessionLocal()

institutions = [
    {"name": "Reserve Bank of Malawi", "type": InstitutionType.central_bank, "code": "RBM"},
    {"name": "National Bank of Malawi", "type": InstitutionType.bank, "code": "NBM"},
    {"name": "Standard Bank Malawi", "type": InstitutionType.bank, "code": "STD"},
    {"name": "First Merchant Bank", "type": InstitutionType.bank, "code": "FMB"},
    {"name": "TNM Mpamba", "type": InstitutionType.mobile_money, "code": "TNM"},
    {"name": "Airtel Money Malawi", "type": InstitutionType.mobile_money, "code": "AIR"},
]

for inst in institutions:
    exists = db.query(Institution).filter(Institution.code == inst["code"]).first()
    if not exists:
        db.add(Institution(**inst))

db.commit()
db.close()
print("✅ Institutions seeded")
