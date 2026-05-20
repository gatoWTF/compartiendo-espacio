'use client';
import { useMapRadar } from '../../src/hooks/useMapRadar';
import dynamic from 'next/dynamic';

const Map = dynamic(() => import('../../src/components/Map'), { ssr: false });

export default function MapaPageContainer() {
  const { state, actions } = useMapRadar();
  
  return (
    <Map 
      location={state.userLoc} 
      isLoading={state.loading} 
      error={state.reserveError} 
      parkings={state.parkings} 
      onSpotSelect={actions.setSelectedSpot} 
    />
  );
}