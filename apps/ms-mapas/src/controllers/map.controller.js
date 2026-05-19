import { NextResponse } from 'next/server';
import { MapService } from '../services/map.service';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_WEB_URL || '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export const MapController = {
  async get(request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    try {
      const data = await MapService.getMisEstacionamientos(userId);
      return NextResponse.json({ success: true, data }, { status: 200, headers: CORS_HEADERS });
    } catch (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: CORS_HEADERS });
    }
  },

  async create(request) {
    try {
      const body = await request.json();
      
      if (!body.nombre || !body.lat || !body.lng || !body.userId) {
        return NextResponse.json(
          { success: false, error: 'Faltan campos obligatorios: nombre, lat, lng, userId.' },
          { status: 400, headers: CORS_HEADERS }
        );
      }

      const data = await MapService.createEstacionamiento(body);
      return NextResponse.json({ success: true, data }, { status: 201, headers: CORS_HEADERS });
    } catch (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: CORS_HEADERS });
    }
  },

  async remove(request) {
    try {
      const body = await request.json();
      if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Se requiere un array de IDs.' },
          { status: 400, headers: CORS_HEADERS }
        );
      }

      const deletedCount = await MapService.deleteEstacionamientos(body.ids);
      return NextResponse.json({ success: true, deleted: deletedCount }, { status: 200, headers: CORS_HEADERS });
    } catch (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: CORS_HEADERS });
    }
  },

  async update(request) {
    try {
      const body = await request.json();
      if (!body.id || body.occupied_spots === undefined) {
        return NextResponse.json(
          { success: false, error: 'Se requiere id y occupied_spots.' },
          { status: 400, headers: CORS_HEADERS }
        );
      }

      const data = await MapService.updateOcupacion(body.id, body.occupied_spots);
      return NextResponse.json({ success: true, data }, { status: 200, headers: CORS_HEADERS });
    } catch (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: CORS_HEADERS });
    }
  }
};
