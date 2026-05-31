import { useState, useEffect } from 'react';
import { supabase } from '@parkings/supabase-db';

export function useGeolocation() {
  const [location, setLocation] = useState({ lat: -33.3601, lng: -70.6925 });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    // 1. Cargar el perfil de manera no bloqueante (manejo robusto de errores)
    // Esto garantiza que un 404 en la base de datos no rompa la inicialización del mapa.
    const loadProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile, error: profileError } = await supabase
            .from('perfiles')
            .select('nombre')
            .eq('id', session.user.id)
            .single();
          
          if (profileError) throw profileError;
          setUserProfile({ name: profile.nombre });
        }
      } catch (err) {
        console.error('[Geolocation] Fallo silencioso al cargar perfil de Supabase:', err.message);
        setUserProfile(null);
      }
    };
    
    loadProfile();

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('Geolocalización no soportada por el navegador');
      setIsLoading(false);
      return;
    }

    // 2. watchPosition en lugar de getCurrentPosition para geolocalización continua
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsLoading(false);
      },
      (err) => {
        setError(err.message);
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return { location, error, isLoading, userProfile };
}
