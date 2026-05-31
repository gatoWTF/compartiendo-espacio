import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useRouter } from 'next/navigation';
import { useGeolocation } from './useGeolocation';
import { supabase } from '@parkings/supabase-db';

export function useMapRadar() {
  const { location: userLoc, isLoading: isLocating, error: locError } = useGeolocation();
  const [parkings, setParkings] = useState([]);
  const [radius, setRadius] = useState(5);
  const [sortOption, setSortOption] = useState('cercania');
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCloud, setIsCloud] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [isReserving, setIsReserving] = useState(false);
  const [reserveStep, setReserveStep] = useState(0); 
  const [reserveError, setReserveError] = useState(null);

  const router = useRouter();

  const fetchRadar = async (r, lat, lng) => {
    try {
      const URL = process.env.NEXT_PUBLIC_MS_MAPAS_URL || 'http://localhost:3002/api/v1';
      if (typeof window !== 'undefined' && (URL.includes('vercel') || window.location.hostname.includes('vercel'))) {
        setIsCloud(true);
      }
      
      const res = await fetch(`${URL}/search?radius=${r}&lat=${lat}&lng=${lng}`, { cache: 'no-store' });
      const data = await res.json();
      return data.success ? data.data : [];
    } catch (e) { return []; }
  };

  const loadParkings = async () => {
    setLoading(true);
    const effectiveRadius = parseInt(radius) === 100 ? 9999 : radius;
    const data = await fetchRadar(effectiveRadius, userLoc.lat, userLoc.lng);
    setParkings(data);
    setLoading(false);
  };

  useEffect(() => {
    loadParkings();

    // ─── WEBSOCKETS REALTIME SUBSCRIPTION ───
    const channel = supabase
      .channel('public:estacionamientos')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'estacionamientos' },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setParkings((current) =>
              current.map((p) => (p.id === payload.new.id ? { ...p, ...payload.new } : p))
            );
            // Actualizar spot seleccionado si es el modificado
            setSelectedSpot((current) => 
              current?.id === payload.new.id ? { ...current, ...payload.new } : current
            );
          } else if (payload.eventType === 'INSERT') {
            setParkings((current) => [...current, payload.new]);
          } else if (payload.eventType === 'DELETE') {
            setParkings((current) => current.filter((p) => p.id !== payload.old.id));
            setSelectedSpot((current) => current?.id === payload.old.id ? null : current);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radius, userLoc]);

  const handleReserve = async () => {
    // Use Supabase session instead of localStorage
    const { data: { session: authSession } } = await supabase.auth.getSession();
    if (!authSession?.user) {
      router.push('/auth');
      return;
    }

    setIsReserving(true);
    setReserveError(null);
    setReserveStep(1); 

    try {
      const check = await api.reservas.verificarDisponibilidad(selectedSpot.id);
      if (!check.success || !check.available) {
        throw new Error('El nodo ya no está disponible o está lleno.');
      }

      setReserveStep(2); 
      await new Promise(resolve => setTimeout(resolve, 2000)); 

      const resData = await api.reservas.crearReserva({
        parking_id: selectedSpot.id,
        user_id: authSession.user.id,
        duration_hours: 1
      });

      if (!resData.success) {
        throw new Error(resData.error || 'Error al completar la transacción P2P.');
      }

      setReserveStep(3);
      loadParkings();

      setTimeout(() => {
        setIsReserving(false);
        setReserveStep(0);
        setSelectedSpot(null); 
      }, 3000);

    } catch (err) {
      setReserveError(err.message);
      setTimeout(() => {
        setIsReserving(false);
        setReserveStep(0);
      }, 3000);
    }
  };

  return {
    state: { userLoc, parkings, radius, sortOption, selectedSpot, loading, isCloud, mobileMenuOpen, isReserving, reserveStep, reserveError },
    actions: { setRadius, setSortOption, setSelectedSpot, setMobileMenuOpen, handleReserve }
  };
}
