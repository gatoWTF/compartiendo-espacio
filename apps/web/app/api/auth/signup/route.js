import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@parkings/supabase-db';

// POST /api/auth/signup
// Server-side signup usando Admin API (service role) para evitar el rate limit
// de emails de Supabase y el error unexpected_failure cuando email confirmation
// está activa sin SMTP configurado.
export async function POST(request) {
  try {
    const { email, password, nombre, rol } = await request.json();

    if (!email || !password || !nombre || !rol) {
      return NextResponse.json({ error: 'Faltan campos requeridos.' }, { status: 400 });
    }

    if (!['cliente', 'arrendador'].includes(rol)) {
      return NextResponse.json({ error: 'Rol inválido.' }, { status: 400 });
    }

    const admin = getServiceSupabase();

    // Crear usuario con email_confirm: true → no requiere verificación por email
    const { data: userData, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nombre, rol },
    });

    if (createError) {
      // Traducir errores comunes
      if (createError.message?.includes('already registered') || createError.message?.includes('already been registered')) {
        return NextResponse.json({ error: 'Este correo ya tiene una cuenta. Inicia sesión.' }, { status: 409 });
      }
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    // Crear perfil (el trigger on_auth_user_created debería hacerlo, pero lo hacemos
    // explícitamente con upsert para garantizarlo)
    const { error: profileError } = await admin.from('perfiles').upsert({
      id: userData.user.id,
      nombre,
      rol,
    }, { onConflict: 'id' });

    if (profileError) {
      console.error('[signup] Error al crear perfil:', profileError.message);
      // No abortamos — el usuario se creó; el perfil se puede crear después
    }

    // Ahora iniciamos sesión para obtener el access_token del usuario
    // (Admin API no devuelve session directamente)
    const { createClient } = await import('@supabase/supabase-js');
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { auth: { persistSession: false } }
    );

    const { data: sessionData, error: signInError } = await anonClient.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      // Usuario creado correctamente aunque no podamos auto-login
      return NextResponse.json({
        success: true,
        autoLogin: false,
        message: 'Cuenta creada. Inicia sesión manualmente.',
      });
    }

    return NextResponse.json({
      success: true,
      autoLogin: true,
      session: sessionData.session,
      user: {
        id: userData.user.id,
        email: userData.user.email,
        nombre,
        rol,
      },
    });

  } catch (err) {
    console.error('[signup] Error inesperado:', err.message);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
