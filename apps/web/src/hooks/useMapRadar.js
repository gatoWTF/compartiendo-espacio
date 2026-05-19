import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useRouter } from 'next/navigation';

export function useMapRadar() {
  const [userLoc, setUserLoc] = useState({ lat: -33.3601, lng: -70.6925 }); 
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

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.log("Usando Plaza Norte por defecto")
      );
    }
  }, []);

  const loadParkings = async () => {
    setLoading(true);
    const effectiveRadius = parseInt(radius) === 100 ? 9999 : radius;
    const data = await fetchRadar(effectiveRadius, userLoc.lat, userLoc.lng);
    setParkings(data);
    setLoading(false);
  };

  useEffect(() => {
    loadParkings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radius, userLoc]);

  const handleReserve = async () => {
    const userStr = window.localStorage.getItem('user');
    if (!userStr) {
      router.push('/auth');
      return;
    }
    const user = JSON.parse(userStr);

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
        user_id: user.id,
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
