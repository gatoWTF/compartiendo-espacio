'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const fileInputRef = useRef(null);
  const router = useRouter();

  // Estados para formularios
  const [nombre, setNombre] = useState('');
  const [rut, setRut] = useState('');
  const [telefono, setTelefono] = useState('');
  const [patente, setPatente] = useState('');
  
  // Estados para cambio de contraseña
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth'); return; }
      setSession(session);

      // Traer perfil público
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!error && data) {
        setUserProfile(data);
        setNombre(data.nombre_completo || '');
        setRut(data.rut || '');
        setTelefono(data.telefono || '');
        setPatente(data.patente || '');
      }
      setLoading(false);
    };

    fetchUserData();
  }, [router]);

  // INNOVACIÓN: Gestión de Avatar (Subida a Storage)
  const handleAvatarClick = () => { fileInputRef.current.click(); };

  const handleAvatarChange = async (event) => {
    try {
      setUpdating(true);
      if (!event.target.files || event.target.files.length === 0) return;
      
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      // Guardamos la foto en una carpeta con el ID del usuario: userid/avatar.ext
      const filePath = `${session.user.id}/avatar.${fileExt}`;

      // 1. Subir imagen al Bucket 'avatars' (usando upsert para reemplazar la vieja)
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // 2. Obtener la URL pública de la imagen recién subida
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 3. Actualizar la tabla pública 'usuarios' con la nueva URL
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ avatar_url: publicUrl })
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      // Actualizar interfaz local
      setUserProfile({ ...userProfile, avatar_url: publicUrl });
      showToast("¡Foto de perfil actualizada!", "success");

    } catch (error) {
      showToast("Error al subir imagen: " + error.message, "error");
    } finally {
      setUpdating(false);
    }
  };

  // Actualizar datos personales
  const handleUpdateDetails = async (e) => {
    e.preventDefault();
    setUpdating(true);
    const rutLimpio = rut.replace(/\./g, '');

    const { error } = await supabase
      .from('usuarios')
      .update({
        nombre_completo: nombre,
        rut: rutLimpio,
        telefono: telefono,
        patente: userProfile.rol === 'cliente' ? patente : 'No aplica'
      })
      .eq('id', session.user.id);

    if (!error) {
      showToast("Datos actualizados correctamente.", "success");
    } else {
      showToast("Error al actualizar: " + error.message, "error");
    }
    setUpdating(false);
  };

  // INNOVACIÓN: Cambio de contraseña SEGURO (Verifica actual)
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { showToast("Las nuevas contraseñas no coinciden.", "error"); return; }
    if (newPassword.length < 6) { showToast("La nueva contraseña debe tener 6 caracteres.", "error"); return; }

    setUpdating(true);

    // 1. Verificar contraseña actual re-autenticando
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: session.user.email,
      password: currentPassword,
    });

    if (loginError) {
      showToast("La contraseña actual es incorrecta.", "error");
      setUpdating(false);
      return;
    }

    // 2. Si la actual es correcta, actualizar a la nueva
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

    if (!updateError) {
      showToast("¡Contraseña cambiada con éxito!", "success");
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } else {
      showToast("Error al cambiar contraseña: " + updateError.message, "error");
    }
    setUpdating(false);
  };

  if (loading) return <div style={{ color: 'white', padding: '50px', textAlign: 'center' }}><i className="fa-solid fa-spinner fa-spin"></i> Cargando tu Centro de Mando...</div>;

  return (
    <section className="view-content" style={{ padding: '20px', position: 'relative' }}>
      
      {toast && (
        <div id="toast-container">
          <div className={`toast ${toast.type}`}>
            <i className={`fa-solid ${toast.type === 'success' ? 'fa-check-circle' : 'fa-circle-exclamation'}`}></i>
            <span>{toast.msg}</span>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '30px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '20px' }}>
        <h2 style={{ fontSize: '2.5rem', color: 'var(--primary)', margin: 0 }}><i className="fa-solid fa-id-card-clip"></i> Mi Perfil</h2>
        <p style={{ color: 'var(--text-muted)', margin: '5px 0 0 0' }}>Gestiona tu identidad, foto y seguridad en la red.</p>
      </div>

      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
        
        {/* COLUMNA IZQUIERDA: Avatar y Datos Personales */}
        <div className="glass-panel" style={{ flex: '2', minWidth: '400px', padding: '30px' }}>
          
          {/* Sección de Avatar Innovada */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '25px', marginBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '30px' }}>
            <div style={{ position: 'relative', cursor: updating ? 'not-allowed' : 'pointer' }} onClick={updating ? null : handleAvatarClick}>
              {userProfile?.avatar_url ? (
                <img src={userProfile.avatar_url} alt="Avatar" style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--primary)', boxShadow: '0 0 15px rgba(59,130,246,0.3)' }} />
              ) : (
                <i className="fa-solid fa-circle-user" style={{ fontSize: '120px', color: '#1e293b' }}></i>
              )}
              <div style={{ position: 'absolute', bottom: '0', right: '0', background: 'var(--primary)', color: 'white', width: '35px', height: '35px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #0f172a' }}>
                {updating ? <i className="fa-solid fa-spinner fa-spin fa-xs"></i> : <i className="fa-solid fa-camera fa-xs"></i>}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" style={{ display: 'none' }} />
            </div>
            
            <div>
              <h3 style={{ margin: 0, fontSize: '1.8rem' }}>{userProfile?.nombre_completo || 'Usuario'}</h3>
              <p style={{ margin: '5px 0 10px 0', color: 'var(--text-muted)' }}>{session.user.email}</p>
              <span className={`badge ${userProfile?.rol === 'arrendador' ? 'blue' : 'green'}`} style={{ textTransform: 'capitalize' }}>
                {userProfile?.rol === 'arrendador' ? <i className="fa-solid fa-building-user"></i> : <i className="fa-solid fa-car"></i>} {userProfile?.rol}
              </span>
            </div>
          </div>

          {/* Formulario de Datos */}
          <h3><i className="fa-solid fa-user-gear"></i> Datos de Identidad</h3>
          <form onSubmit={handleUpdateDetails} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
            <div style={{ display: 'flex', gap: '15px' }}>
              <div className="input-group" style={{ flex: 1 }}><i className="fa-solid fa-signature"></i><input type="text" placeholder="Nombre Completo" value={nombre} onChange={e => setNombre(e.target.value)} required /></div>
              <div className="input-group" style={{ flex: 1 }}><i className="fa-solid fa-id-card"></i><input type="text" placeholder="RUT" value={rut} onChange={e => setRut(e.target.value)} required /></div>
            </div>
            
            <div style={{ display: 'flex', gap: '15px' }}>
              <div className="input-group" style={{ flex: 1 }}><i className="fa-solid fa-phone"></i><input type="tel" placeholder="Teléfono" value={telefono} onChange={e => setTelefono(e.target.value)} required /></div>
              {userProfile?.rol === 'cliente' ? (
                <div className="input-group" style={{ flex: 1 }}><i className="fa-solid fa-car-side"></i><input type="text" placeholder="Patente" value={patente} onChange={e => setPatente(e.target.value)} /></div>
              ) : (
                <div style={{ flex: 1 }}></div> // Espaciador
              )}
            </div>
            
            <button type="submit" className="btn-primary" disabled={updating} style={{ padding: '12px', width: 'auto', alignSelf: 'flex-start' }}>
              {updating ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-cloud-arrow-up"></i>} Guardar Cambios
            </button>
          </form>
        </div>

        {/* COLUMNA DERECHA: Seguridad (Contraseña) */}
        <div className="glass-panel" style={{ flex: '1', minWidth: '300px', padding: '30px' }}>
          <h3><i className="fa-solid fa-shield-lock"></i> Seguridad</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>Para cambiar tu contraseña, necesitamos verificar tu identidad primero.</p>
          
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div className="input-group" style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)' }}><i className="fa-solid fa-lock" style={{ color: 'var(--status-red)' }}></i><input type="password" placeholder="Contraseña Actual" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required /></div>
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '5px 0' }}></div>
            <div className="input-group"><i className="fa-solid fa-key"></i><input type="password" placeholder="Nueva Contraseña (mín. 6 car.)" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength="6" /></div>
            <div className="input-group"><i className="fa-solid fa-key"></i><input type="password" placeholder="Confirmar Nueva Contraseña" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength="6" /></div>
            
            <button type="submit" className="btn-outline" disabled={updating} style={{ marginTop: '10px', borderColor: 'var(--primary)', color: 'var(--primary)' }}>
              {updating ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-user-shield"></i>} Actualizar Credenciales
            </button>
          </form>
        </div>

      </div>
    </section>
  );
}