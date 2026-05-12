'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@parkings/supabase-db';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return router.push('/auth');
      setUser(session.user);
    });
  }, [router]);

  if (!user) return <div style={{ padding: '100px', textAlign: 'center', color: 'white' }}>Cargando perfil...</div>;

  return (
    <div style={{ padding: '60px 20px', maxWidth: '600px', margin: '0 auto' }}>
      <div className="glass" style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--primary)', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
          <i className="fa-solid fa-user"></i>
        </div>
        <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>Mi Perfil</h2>
        <div style={{ textAlign: 'left', marginTop: '30px', color: 'var(--text-muted)' }}>
          <p style={{ marginBottom: '15px' }}><strong>ID de Usuario:</strong> <br/> {user.id}</p>
          <p style={{ marginBottom: '15px' }}><strong>Correo Electrónico:</strong> <br/> {user.email}</p>
          <p style={{ marginBottom: '15px' }}><strong>Último Acceso:</strong> <br/> {new Date(user.last_sign_in_at).toLocaleString()}</p>
        </div>
        <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} className="glass" style={{ marginTop: '30px', width: '100%', padding: '15px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', cursor: 'pointer' }}>
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}