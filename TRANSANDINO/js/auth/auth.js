// Obtiene la información del usuario guardada en localStorage
export function obtenerUsuario() {
  try {
    const userStr = localStorage.getItem('user') || localStorage.getItem('usuario');
    if (!userStr) return null;
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
}

// Verifica que exista una sesión activa; si no existe, redirige a login.html
export function exigirSesion() {
  const usuario = obtenerUsuario();
  if (!usuario) {
    alert('Debes iniciar sesión para acceder a esta página.');
    window.location.href = 'login.html';
    return null;
  }
  return usuario;
}

// Control de acceso por roles permitidos
export function exigirRol(...rolesPermitidos) {
  const usuario = exigirSesion();
  if (!usuario) return null;
  if (!rolesPermitidos.includes(usuario.rol)) {
    alert('Tu perfil no tiene acceso a esta página.');
    window.location.href = 'index.html';
    return null;
  }
  return usuario;
}

// Retorna la ruta inicial que le corresponde a cada rol
export function rutaInicioSegunRol(rol) {
  const rutas = {
    cliente: 'registro.html',
    administrador: 'panel.html',
    empleado: 'panel.html',
    cajero: 'caja.html'
  };
  return rutas[rol] ?? 'index.html';
}
