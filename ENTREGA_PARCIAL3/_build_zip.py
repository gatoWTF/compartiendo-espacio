# -*- coding: utf-8 -*-
"""Empaqueta el entregable completo (documentación + componentes fuente) en un ZIP."""
import os, zipfile

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT = os.path.join(ROOT, "ENTREGA_PARCIAL3_ParkingsTogether.zip")

# Carpetas/archivos a EXCLUIR siempre (pesados o irrelevantes)
EXCLUDE_DIRS = {"node_modules", ".next", ".git", ".turbo", ".claude", ".agents",
                "coverage", ".vercel", "dist", "build"}
EXCLUDE_FILES = {".env", ".env.local"}

# Qué incluir desde la raíz del repo (componentes + documentación general)
INCLUDE_TOP = [
    "ENTREGA_PARCIAL3",          # documentación de la entrega (con PDFs y cobertura)
    "apps",                      # frontend, BFF y microservicios (sin node_modules/.next)
    "packages",                  # paquete compartido supabase-db
    "sql",                       # esquema + stored procedures
    "docs",                      # documentación técnica del proyecto
    "supabase_schema.sql", "README.md", "INFORME_TECNICO.md",
    "repositorios.txt", "package.json", "turbo.json", "jest.config.js", "jest.setup.js",
]

def should_skip(path):
    parts = set(path.replace("\\", "/").split("/"))
    return bool(parts & EXCLUDE_DIRS)

count = 0
with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
    for top in INCLUDE_TOP:
        ap = os.path.join(ROOT, top)
        if os.path.isfile(ap):
            z.write(ap, top); count += 1
            continue
        for dirpath, dirnames, filenames in os.walk(ap):
            dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS]
            if should_skip(os.path.relpath(dirpath, ROOT)):
                continue
            for fn in filenames:
                if fn in EXCLUDE_FILES:
                    continue
                full = os.path.join(dirpath, fn)
                rel = os.path.relpath(full, ROOT)
                try:
                    z.write(full, rel); count += 1
                except Exception as e:
                    print("skip", rel, e)

print(f"ZIP creado: {OUT}")
print(f"Archivos incluidos: {count}")
print(f"Tamaño: {os.path.getsize(OUT)/1024/1024:.2f} MB")
