import { NextResponse } from 'next/server';
import { getSupabaseWithToken } from '@parkings/supabase-db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getToken(req) {
  const h = req.headers.get('authorization') || '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}

export async function POST(request) {
  const token = getToken(request);
  if (!token) return NextResponse.json({ success: false, error: 'No autenticado.' }, { status: 401 });

  const { reserva_id, amount, provider = 'mock', metadata } = await request.json();
  if (!amount || amount <= 0) return NextResponse.json({ success: false, error: 'Monto inválido.' }, { status: 400 });

  const db = getSupabaseWithToken(token);
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: 'Token inválido.' }, { status: 401 });

  const transaction_id = `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const { data: payment, error } = await db.from('payments').insert({
    reserva_id: reserva_id || null,
    user_id: user.id,
    amount,
    status: 'completed',
    provider,
    transaction_id,
    metadata: metadata || null,
  }).select('id, transaction_id, status').single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, payment }, { status: 201 });
}
