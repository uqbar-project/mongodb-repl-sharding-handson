db.getMongo().setReadPref("secondary")
use('negocio')
db.clientes.find({"region": "CABA", "dni": 43026404 }).limit(2).pretty()