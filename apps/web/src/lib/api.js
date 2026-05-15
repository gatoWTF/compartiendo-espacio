// Archivo: apps/web/src/lib/api.js

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3001';
const MAPAS_URL = process.env.NEXT_PUBLIC_MAPAS_URL || 'http://localhost:3002';
const RESERVAS_URL = process.env.NEXT_PUBLIC_RESERVAS_URL || 'http://localhost:3003';

// Autenticación
export async function login(email, password) {
  const res = await fetch(`${AUTH_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function register(email, password) {
  const res = await fetch(`${AUTH_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

// Mapas / Geolocalización
export async function searchParkings(lat, lng, radius) {
  const res = await fetch(
    `${MAPAS_URL}/api/v1/search?lat=${lat}&lng=${lng}&radius=${radius}`
  );
  return res.json();
}

// Reservas
export async function createReserva(data) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${RESERVAS_URL}/api/v1/reserve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}