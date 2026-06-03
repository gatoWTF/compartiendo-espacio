'use client';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function ReviewModal({ reservaId, onClose, onSubmit }) {
  const [stars, setStars] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comentario, setComentario] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (stars === 0) {
      toast.error('Selecciona una puntuación antes de enviar.');
      return;
    }
    setLoading(true);
    try {
      await onSubmit({ reservaId, stars, comentario: comentario.trim() || null });
      toast.success('¡Gracias por tu calificación!');
      onClose();
    } catch (err) {
      toast.error(err.message || 'No se pudo enviar la calificación.');
    } finally {
      setLoading(false);
    }
  };

  const displayStars = hovered || stars;

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}
      onClick={(e) => e.target === e.currentTarget && !loading && onClose()}
    >
      <div
        style={{ background: 'linear-gradient(145deg,#0f172a,#1e293b)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '400px', boxShadow: '0 0 60px rgba(59,130,246,0.1)' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-modal-title"
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h3 id="review-modal-title" style={{ color: '#f8fafc', fontWeight: 800, fontSize: '1.15rem', margin: 0 }}>
              <i className="fa-solid fa-star" style={{ color: '#f59e0b', marginRight: '8px' }}></i>
              Califica tu experiencia
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '4px' }}>Tu opinión ayuda a mejorar la comunidad</p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#94a3b8', cursor: 'pointer', padding: '8px 10px' }}
            aria-label="Cerrar"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Stars */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '8px' }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setStars(n)}
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered(0)}
              disabled={loading}
              style={{ background: 'none', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '2.2rem', color: n <= displayStars ? '#f59e0b' : '#334155', transition: 'color 0.1s, transform 0.1s', transform: n <= displayStars ? 'scale(1.15)' : 'scale(1)', padding: '4px' }}
              aria-label={`${n} estrella${n > 1 ? 's' : ''}`}
            >
              ★
            </button>
          ))}
        </div>

        {/* Stars label */}
        <div style={{ textAlign: 'center', marginBottom: '20px', minHeight: '22px' }}>
          {displayStars > 0 && (
            <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.9rem' }}>
              {['', 'Muy malo', 'Malo', 'Regular', 'Bueno', '¡Excelente!'][displayStars]}
            </span>
          )}
          {displayStars === 0 && (
            <span style={{ color: '#475569', fontSize: '0.85rem' }}>Toca para puntuar</span>
          )}
        </div>

        {/* Comment */}
        <label style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
          Comentario <span style={{ color: '#475569', fontWeight: 400 }}>(opcional)</span>
        </label>
        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          placeholder="Cuéntanos cómo fue tu experiencia…"
          maxLength={500}
          disabled={loading}
          style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#e2e8f0', padding: '12px 14px', fontSize: '0.9rem', resize: 'vertical', minHeight: '88px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }}
        />
        <div style={{ textAlign: 'right', color: '#475569', fontSize: '0.75rem', marginTop: '4px', marginBottom: '20px' }}>
          {comentario.length}/500
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{ flex: 1, padding: '12px', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#94a3b8', borderRadius: '12px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.9rem' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || stars === 0}
            style={{ flex: 2, padding: '12px', background: stars > 0 && !loading ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '12px', color: stars > 0 && !loading ? 'white' : '#475569', cursor: loading || stars === 0 ? 'not-allowed' : 'pointer', fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}
          >
            {loading ? (
              <><i className="fa-solid fa-circle-notch fa-spin"></i> Enviando…</>
            ) : (
              <><i className="fa-solid fa-paper-plane"></i> Enviar reseña</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
