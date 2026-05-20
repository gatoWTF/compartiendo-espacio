'use client';
import { useMapRadar } from '../../src/hooks/useMapRadar';
import Map from '../../src/components/Map';

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