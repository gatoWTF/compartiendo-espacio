import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('../../../components/Map'), { 
  ssr: false,
  loading: () => <div className="radar-loader" style={{color:'white', display:'flex', justifyContent:'center', alignItems:'center', height:'100%'}}><i className="fa-solid fa-satellite fa-spin" style={{marginRight: '10px'}}></i> Sincronizando Nodos Satelitales...</div>
});

export function MapPresenter({ state, actions }) {
  const { userLoc, parkings, radius, sortOption, selectedSpot, loading, isCloud, mobileMenuOpen, isReserving, reserveStep, reserveError } = state;
  const { setRadius, setSortOption, setSelectedSpot, setMobileMenuOpen, handleReserve } = actions;

  return (
    <div className="main-map-container">
      <button className="mobile-toggle-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
        <i className={`fa-solid ${mobileMenuOpen ? 'fa-xmark' : 'fa-radar'}`}></i>
        {!mobileMenuOpen && <span>RADAR</span>}
      </button>

      <aside className={`sidebar-radar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="header-radar">
          <div className="status-dot"></div>
          <h2>RADAR<span>P2P</span></h2>
        </div>

        <div className="infra-indicator">
          <i className="fa-solid fa-server"></i> MS-Mapas: <span className="status-text">{isCloud ? 'Cloud Edge' : 'Local Node'}</span>
        </div>

        <div className="control-card">
          <div className="label-group">
            <label>RANGO DE ESCANEO</label>
            <span className="km-value">{parseInt(radius) === 100 ? 'GLOBAL 🌍' : `${radius} KM`}</span>
          </div>
          <input type="range" min="1" max="100" value={radius} onChange={(e) => setRadius(e.target.value)} className="modern-slider" />
          
          <div className="filter-group">
            <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="modern-select">
              <option value="cercania">📍 Ordenar por Cercanía</option>
              <option value="rating">⭐ Mejor Calificados</option>
              <option value="precio">💸 Precio (Menor a Mayor)</option>
            </select>
          </div>
        </div>

        <div className="parking-list-section">
          <p className="section-tag">NODOS DISPONIBLES</p>
          {loading ? (
            <div className="radar-scanning">
               <div className="ring"></div>
               <span>Escaneando red...</span>
            </div>
          ) : parkings.length === 0 ? (
            <div className="no-results">No hay nodos en este parámetro.</div>
          ) : (
            [...parkings]
              .sort((a, b) => {
                if (sortOption === 'rating') return (b.rating || 5) - (a.rating || 5);
                if (sortOption === 'precio') return a.precio_hora - b.precio_hora;
                return 0;
              })
              .map(p => {
              const isFull = p.occupied_spots >= p.total_spots;
              return (
                <div key={p.id} onClick={() => { setSelectedSpot(p); setMobileMenuOpen(false); }} className={`parking-card-mini ${selectedSpot?.id === p.id ? 'active' : ''}`}>
                  <div className="card-top">
                    <span className="p-name">{p.nombre}</span>
                    <span className="p-star">★ {p.rating || '5.0'}</span>
                  </div>
                  <div className="card-bottom">
                    <span style={{color: isFull ? '#ef4444' : '#10b981', fontWeight: 'bold'}}>
                      {isFull ? '🔴 Lleno' : `🟢 ${p.total_spots - p.occupied_spots} Disp.`}
                    </span>
                    <span className="p-price">${p.precio_hora}/hr</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      <main className="map-view">
        <MapComponent parkings={parkings} userLoc={userLoc} focusedSpot={selectedSpot} />
        
        {selectedSpot && (
          <div className="floating-details">
            {isReserving ? (
               <div className="saga-flow-container">
                 {reserveStep === 1 && <div className="step-loading"><i className="fa-solid fa-satellite fa-spin"></i> Verificando Disponibilidad en MS-Reservas...</div>}
                 {reserveStep === 2 && <div className="step-loading"><i className="fa-solid fa-money-check-dollar fa-beat"></i> Procesando Pago Seguro P2P...</div>}
                 {reserveStep === 3 && <div className="step-success"><i className="fa-solid fa-check-circle"></i> ¡Reserva Confirmada y Sincronizada!</div>}
                 {reserveError && <div className="step-error"><i className="fa-solid fa-triangle-exclamation"></i> Transacción Abortada: {reserveError}</div>}
               </div>
            ) : (
              <>
                <button className="btn-close" onClick={() => setSelectedSpot(null)}>×</button>
                <div className="badge"><i className="fa-solid fa-shield-check"></i> NODO VERIFICADO</div>
                <h2>{selectedSpot.nombre}</h2>
                <p className="description">{selectedSpot.descripcion || 'Espacio privado con seguridad avanzada en la red P2P.'}</p>
                
                <div className="info-grid">
                  <div className="info-item">
                    <small>TARIFA</small>
                    <strong>${selectedSpot.precio_hora}</strong>
                  </div>
                  <div className="info-item">
                    <small>DISTANCIA</small>
                    <strong>{radius} km</strong>
                  </div>
                </div>

                <button 
                  className={`btn-action ${selectedSpot.occupied_spots >= selectedSpot.total_spots ? 'disabled' : ''}`}
                  onClick={handleReserve}
                  disabled={selectedSpot.occupied_spots >= selectedSpot.total_spots}
                >
                   <i className="fa-solid fa-bolt"></i> 
                   {selectedSpot.occupied_spots >= selectedSpot.total_spots ? 'NODO LLENO' : 'ENLAZAR RESERVA'}
                </button>
              </>
            )}
          </div>
        )}
      </main>

      <style jsx>{`
        .main-map-container { display: flex; height: calc(100vh - 70px); background: #020617; color: white; overflow: hidden; position: relative; }
        
        .mobile-toggle-btn { display: none; position: absolute; top: 20px; left: 20px; z-index: 2000; background: linear-gradient(135deg, #3b82f6, #2563eb); border: none; padding: 12px 20px; border-radius: 12px; color: white; font-weight: 900; box-shadow: 0 4px 15px rgba(37, 99, 235, 0.4); cursor: pointer; align-items: center; gap: 8px; font-size: 1rem; }
        
        .sidebar-radar { width: 380px; background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(25px); border-right: 1px solid rgba(59, 130, 246, 0.2); padding: 35px; display: flex; flex-direction: column; gap: 25px; transition: 0.3s; z-index: 1000; overflow-y: auto; }
        
        .header-radar { display: flex; align-items: center; gap: 15px; }
        .status-dot { width: 10px; height: 10px; background: #3b82f6; border-radius: 50%; box-shadow: 0 0 15px #3b82f6; animation: pulse 2s infinite; }
        h2 { font-size: 1.8rem; font-weight: 900; margin: 0; }
        h2 span { color: #3b82f6; }
        
        .infra-indicator { background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); padding: 8px 12px; border-radius: 8px; font-size: 0.8rem; color: #10b981; font-weight: 700; display: flex; align-items: center; gap: 8px; }
        .status-text { color: white; }

        .control-card { background: rgba(255, 255, 255, 0.03); padding: 20px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); }
        .label-group { display: flex; justify-content: space-between; font-size: 0.75rem; font-weight: 800; color: #64748b; margin-bottom: 12px; }
        .km-value { color: #3b82f6; font-weight: 900; }
        .modern-slider { width: 100%; accent-color: #3b82f6; cursor: pointer; margin-bottom: 15px; }
        .filter-group { margin-top: 10px; }
        .modern-select { width: 100%; padding: 10px; background: rgba(0,0,0,0.5); color: white; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; font-size: 0.85rem; outline: none; cursor: pointer; transition: border-color 0.3s; }
        .modern-select:hover { border-color: #3b82f6; }

        .parking-list-section { flex: 1; display: flex; flex-direction: column; }
        .section-tag { font-size: 0.75rem; font-weight: 900; color: #64748b; letter-spacing: 2px; margin-bottom: 15px; }
        .no-results { color: #64748b; text-align: center; margin-top: 20px; font-size: 0.9rem; }
        
        .radar-scanning { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 150px; color: #3b82f6; font-size: 0.85rem; font-weight: 700; }
        .ring { width: 40px; height: 40px; border: 3px solid transparent; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 15px; }

        .parking-card-mini { padding: 18px; background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 18px; margin-bottom: 15px; cursor: pointer; transition: 0.3s; }
        .parking-card-mini:hover { background: rgba(255, 255, 255, 0.06); transform: translateX(5px); }
        .parking-card-mini.active { border-color: #3b82f6; background: rgba(59, 130, 246, 0.1); transform: scale(1.02); }
        
        .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .p-name { font-weight: 800; font-size: 1.05rem; }
        .p-star { color: #fbbf24; font-size: 0.85rem; font-weight: 900; }
        .card-bottom { display: flex; justify-content: space-between; font-size: 0.85rem; color: #94a3b8; }
        .p-price { color: #10b981; font-weight: 900; }
        
        .map-view { flex: 1; position: relative; }
        
        .floating-details { position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%); width: 90%; max-width: 440px; background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(40px); border: 1px solid rgba(59, 130, 246, 0.5); border-radius: 28px; padding: 35px; z-index: 1000; animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); box-shadow: 0 30px 60px rgba(0, 0, 0, 0.8); }
        
        .btn-close { position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.1); border: none; width: 30px; height: 30px; border-radius: 50%; color: white; font-size: 1.2rem; cursor: pointer; transition: 0.3s; }
        .btn-close:hover { background: #ef4444; }
        
        .badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: rgba(16, 185, 129, 0.2); color: #10b981; border-radius: 8px; font-size: 0.7rem; font-weight: 900; margin-bottom: 15px; }
        h2 { font-size: 1.5rem; margin-bottom: 10px; }
        .description { color: #94a3b8; font-size: 0.9rem; line-height: 1.5; margin-bottom: 20px; }
        
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px; }
        .info-item { background: rgba(0,0,0,0.3); padding: 15px; border-radius: 12px; text-align: center; border: 1px solid rgba(255,255,255,0.05); }
        .info-item small { display: block; font-size: 0.7rem; color: #64748b; font-weight: 800; margin-bottom: 5px; }
        .info-item strong { display: block; font-size: 1.2rem; color: #3b82f6; font-weight: 900; }
        
        .btn-action { width: 100%; padding: 18px; background: linear-gradient(135deg, #3b82f6, #2563eb); border: none; border-radius: 16px; color: white; font-weight: 900; cursor: pointer; font-size: 1.05rem; transition: 0.3s; display: flex; align-items: center; justify-content: center; gap: 10px; }
        .btn-action:hover { transform: translateY(-3px); box-shadow: 0 10px 25px rgba(37, 99, 235, 0.4); }
        .btn-action.disabled { background: rgba(255,255,255,0.1); color: #64748b; cursor: not-allowed; box-shadow: none; transform: none; }
        
        .saga-flow-container { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; text-align: center; }
        .step-loading { color: #3b82f6; font-size: 1.2rem; font-weight: 800; display: flex; flex-direction: column; gap: 15px; align-items: center; animation: pulse 2s infinite; }
        .step-loading i { font-size: 3rem; }
        .step-success { color: #10b981; font-size: 1.2rem; font-weight: 800; display: flex; flex-direction: column; gap: 15px; align-items: center; animation: slideUp 0.5s ease; }
        .step-success i { font-size: 3rem; }
        .step-error { color: #ef4444; font-size: 1.1rem; font-weight: 800; display: flex; flex-direction: column; gap: 15px; align-items: center; }
        .step-error i { font-size: 3rem; }

        @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.05); opacity: 0.8; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes slideUp { from { transform: translate(-50%, 100px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
        
        @media (max-width: 800px) {
          .mobile-toggle-btn { display: flex; }
          .sidebar-radar { position: absolute; left: -100%; top: 0; height: 100%; width: 100%; max-width: 380px; box-shadow: 20px 0 50px rgba(0,0,0,0.5); }
          .sidebar-radar.open { left: 0; }
          .floating-details { bottom: 20px; padding: 25px; }
        }
      `}</style>
    </div>
  );
}
