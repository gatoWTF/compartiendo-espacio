import { useState, useEffect } from 'react';
import { supabase } from '@parkings/supabase-db';

export function useGeolocation() {
  const [location, setLocation] = useState({ lat: -33.3601, lng: -70.6925 });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        let resolvedName = null;

        // Primer intento: perfiles.nombre
        try {
          const { data: profile, error: profileError } = await supabase
            .from('perfiles')
            .select('nombre')
            .eq('id', session.user.id)
            .single();
          
          if (!profileError && profile?.nombre) {
            resolvedName = profile.nombre;
          }
        } catch (e) {
          console.warn('[Geolocation] Fallo al consultar tabla perfiles, usando fallback');
        }

        // Fallbacks automáticos si la tabla falló o devolvió 404
        if (!resolvedName) {
          resolvedName = 
            session.user.user_metadata?.nombre || 
            session.user.user_metadata?.full_name || 
            session.user.email?.split('@')[0] || 
            'Usuario';
        }

        setUserProfile({ name: resolvedName, session });

      } catch (err) {
        console.error('[Geolocation] Fallo silencioso al cargar sesión de Supabase:', err.message);
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
