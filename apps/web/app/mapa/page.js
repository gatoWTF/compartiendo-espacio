'use client';
import { useMapRadar } from '../../src/hooks/useMapRadar';
import { MapPresenter } from '../../src/components/map/MapPresenter';

export default function MapaPageContainer() {
  const { state, actions } = useMapRadar();
  return <MapPresenter state={state} actions={actions} />;
}