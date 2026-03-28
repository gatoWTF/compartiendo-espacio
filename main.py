from fastapi import FastAPI, HTTPException

from fastapi.middleware.cors import CORSMiddleware

from supabase import create_client, Client

from pydantic import BaseModel

import os

from dotenv import load_dotenv



# Cargar variables de entorno

load_dotenv(".env.local")



app = FastAPI(

    title="API Compartiendo Espacio",

    description="Microservicio central de búsqueda y gestión de estacionamientos",

    version="1.0.0"

)



# INNOVACIÓN: Configuración de CORS

# Esto permite que el Frontend de Next.js (localhost:3000) se comunique con este Backend

app.add_middleware(

    CORSMiddleware,

    allow_origins=["http://localhost:3000"], # La URL del Frontend

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],

)



# Conexión al BaaS (Supabase)

url: str = os.environ.get("SUPABASE_URL")

key: str = os.environ.get("SUPABASE_KEY")

if not url or not key:

    raise Exception("Faltan las credenciales de Supabase en el .env")



supabase: Client = create_client(url, key)



# --- MODELOS DE DATOS (Contratos) ---

class ReservaIn(BaseModel):

    estacionamiento_id: str

    conductor_id: str

    patente: str



# --- ENDPOINTS (Las Rutas de la API) ---



@app.get("/")

def read_root():

    return {"status": "online", "message": "Motor Backend de Compartiendo Espacio Operativo"}



@app.get("/api/estacionamientos")

def obtener_estacionamientos():

    """Microservicio: Devuelve todos los estacionamientos para renderizar en el mapa."""

    try:

        response = supabase.table("estacionamientos").select("*").execute()

        return response.data

    except Exception as e:

        raise HTTPException(status_code=500, detail=str(e))



@app.post("/api/reservas")

def crear_reserva(reserva: ReservaIn):

    """Microservicio: Procesa una nueva pre-reserva P2P."""

    try:

        nueva_reserva = {

            "estacionamiento_id": reserva.estacionamiento_id,

            "conductor_id": reserva.conductor_id,

            "patente_registrada": reserva.patente,

            "estado": "pendiente"

        }

        response = supabase.table("reservas").insert(nueva_reserva).execute()

        return {"mensaje": "Reserva creada con éxito", "data": response.data}

    except Exception as e:

        raise HTTPException(status_code=400, detail=str(e))