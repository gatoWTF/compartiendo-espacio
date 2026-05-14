'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../src/lib/api'; // Importamos nuestra capa de abstracción

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      // Obtenemos el token que Supabase guarda automáticamente en el LocalStorage
      const sessionStr = window.localStorage.getItem('sb-yours-app-token'); // Ajusta según tu config de Supabase
      
      if (!sessionStr) {
        router.push('/auth');
        return;
      }

      try {
        // En lugar de usar supabase.auth, llamamos a nuestro microservicio
        const userData = await api.auth.getUserProfile(JSON.parse(sessionStr).access_token);
        setUser(userData.user);
      } catch (error) {
        console.error("Error al cargar perfil:", error);
        router.push('/auth');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  if (loading) return <div className="loading">Cargando perfil...</div>;

  return (
    <div style={{ padding: '60px 20px', maxWidth: '600px', margin: '0 auto' }}>
      <div className="glass" style={{ padding: '40px', textAlign: 'center' }}>
        <h1>Hola, {user?.email}</h1>
        <p>Bienvenido a tu panel de Parking's Together</p>
        {/* Aquí puedes agregar más info que venga del microservicio */}
      </div>
    </div>
  );
}