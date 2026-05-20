import { useState, useEffect } from 'react';

export function useGeolocation() {
  // Coordenadas por defecto (Plaza Norte)
  const [location, setLocation] = useState({ lat: -33.3601, lng: -70.6925 });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('Geolocalización no soportada por el navegador');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsLoading(false);
      },
      (err) => {
        setError(err.message);
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

  return { location, error, isLoading };
}
