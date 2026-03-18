'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase'; // 3 niveles de profundidad
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const fileInputRef = useRef(null);
  const router = useRouter();

  // Estados
  const [telefono, setTelefono] = useState('');
  const [patente, setPatente] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth'); return; }
      setSession(session);

      const { data } = await supabase.from('usuarios').select('*').eq('id', session.user.id).single();
      if (data) {
        setUserProfile(data);
        setTelefono(data.telefono || '');
        setPatente(data.patente || '');
      }
      setLoading(false);
    };
    fetchUser();
  }, [router]);

  // INNOVACIÓN: Subir Avatar
  const handleAvatarUpload = async (e) => {
    try {
      setUpdating(true);
      const file = e.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const filePath = `${session.user.id}/avatar-${Date.now()}.${fileExt}`;

      // 1. Subir imagen a Storage
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      // 2. Obtener URL pública
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

      // 3. Guardar en la tabla usuarios
      await supabase.from('usuarios').update({ avatar_url: publicUrl }).eq('id', session.user.id);
      
      setUserProfile({ ...userProfile, avatar_url: publicUrl });
      showToast("Foto de perfil actualizada", "success");
    } catch (error) {
      showToast("Error al subir imagen", "error");
    } finally {
      setUpdating(false);
    }
  };

  // Actualizar Datos y Contraseña
  const handleSave = async (e) => {
    e.preventDefault();
    setUpdating(true);

    // Actualizar Teléfono y Patente
    const { error: dbError } = await supabase.from('usuarios')
      .update({ telefono, patente: userProfile.rol === 'cliente' ? patente : 'N/A' })
      .eq('id', session.user.id);

    // Actualizar Contraseña (si escribió una)
    if (newPassword.length >= 6) {
      const { error: authError } = await supabase.auth.updateUser({ password: newPassword });
      if (authError) showToast("Error al cambiar contraseña", "error");
      else setNewPassword('');
    }

    if (!dbError) showToast("Perfil actualizado correctamente", "success");
    setUpdating(false);
  };

  if (loading) return <div style={{ color: 'white', padding: '50px', textAlign: 'center' }}><i className="fa-solid fa-spinner fa-spin"></i> Cargando perfil...</div>;

  return (
    <section className="view-content" style={{ padding: '30px', maxWidth: '800px', margin: '0 auto' }}>
      
      {toast && (
        <div id="toast-container" style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999 }}>
          <div className={`toast ${toast.type}`} style={{ padding: '15px 25px', background: toast.type === 'success' ? '#10b981' : '#ef4444', color: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
            {toast.msg}
          </div>
        </div>
      )}

      <h2 style={{ color: 'var(--primary)', fontSize: '2.5rem', marginBottom: '30px' }}><i className="fa-solid fa-id-badge"></i> Mi Identidad</h2>

      <div className="glass-panel" style={{ padding: '30px', background: 'rgba(15, 23, 42, 0.7)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
        
        {/* Sección de Foto de Perfil */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '30px' }}>
          <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => fileInputRef.current.click()}>
            {userProfile?.avatar_url ? (
              <img src={userProfile.avatar_url} alt="Avatar" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)' }} />
            ) : (
              <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid var(--text-muted)' }}>
                <i className="fa-solid fa-user" style={{ fontSize: '3rem', color: 'var(--text-muted)' }}></i>
              </div>
            )}
            <div style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--primary)', padding: '8px', borderRadius: '50%', color: 'white' }}>
              <i className="fa-solid fa-camera"></i>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" style={{ display: 'none' }} />
          </div>
          <div>
            <h3 style={{ margin: 0, color: 'white', fontSize: '1.8rem' }}>{userProfile?.nombre_completo}</h3>
            <p style={{ margin: '5px 0', color: 'var(--text-muted)' }}>{session.user.email}</p>
            <span style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '5px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'capitalize' }}>
              Cuenta de {userProfile?.rol}
            </span>
          </div>
        </div>

        {/* Formulario de Datos y Seguridad */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 'bold' }}>Teléfono de Contacto</label>
              <div style={{ position: 'relative' }}>
                <i className="fa-solid fa-phone" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}></i>
                <input type="tel" value={telefono} onChange={e => setTelefono(e.target.value)} style={{ width: '100%', padding: '12px 12px 12px 45px', background: 'rgba(0,0,0,0.3)', border: '1px solid #334155', borderRadius: '8px', color: 'white', outline: 'none' }} required />
              </div>
            </div>
            
            {userProfile?.rol === 'cliente' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 'bold' }}>Patente del Vehículo</label>
                <div style={{ position: 'relative' }}>
                  <i className="fa-solid fa-car-side" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}></i>
                  <input type="text" value={patente} onChange={e => setPatente(e.target.value)} style={{ width: '100%', padding: '12px 12px 12px 45px', background: 'rgba(0,0,0,0.3)', border: '1px solid #334155', borderRadius: '8px', color: 'white', outline: 'none' }} />
                </div>
              </div>
            )}
          </div>

          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', marginTop: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h4 style={{ margin: '0 0 15px 0', color: 'white' }}><i className="fa-solid fa-shield-halved" style={{ color: 'var(--primary)' }}></i> Seguridad</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 'bold' }}>Cambiar Contraseña (Opcional)</label>
              <div style={{ position: 'relative' }}>
                <i className="fa-solid fa-lock" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}></i>
                <input type="password" placeholder="Escribe tu nueva contraseña..." value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ width: '100%', padding: '12px 12px 12px 45px', background: 'rgba(0,0,0,0.3)', border: '1px solid #334155', borderRadius: '8px', color: 'white', outline: 'none' }} />
              </div>
              <small style={{ color: 'var(--text-muted)' }}>Déjalo en blanco si no deseas cambiarla.</small>
            </div>
          </div>

          <button type="submit" disabled={updating} style={{ background: 'var(--primary)', color: 'white', padding: '15px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', marginTop: '10px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
            {updating ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <><i className="fa-solid fa-floppy-disk"></i> Guardar Cambios</>}
          </button>
        </form>
      </div>
    </section>
  );
}