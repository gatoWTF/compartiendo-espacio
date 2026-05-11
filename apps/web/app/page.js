"use client";
import { useEffect, useState } from 'react';
import Map from '@/components/Map';

export default function HomePage() {
  const [parkings, setParkings] = useState([]);

  useEffect(() => {
    // El frontend SOLO habla con el BFF
    fetch('/api/proxy/bff/dashboard')
      .then(res => res.json())
      .then(data => setParkings(data.results));
  }, []);

  return (
    <main>
      <h1>Parking's Together</h1>
      <Map locations={parkings} />
    </main>
  );
}