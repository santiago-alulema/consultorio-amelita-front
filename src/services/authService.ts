import { api } from '../api/api';
import type { UsuarioSesion } from '../models';

export async function login(usuario: string, password: string) {
    const { data } = await api.post('/auth/login', {
        usuario,
        password,
    });

    localStorage.setItem('token', data.token);
    localStorage.setItem('usuario', JSON.stringify(data.usuario));

    return data.usuario as UsuarioSesion;
}

export function usuarioActual(): UsuarioSesion | null {
    const usuario = localStorage.getItem('usuario');
    return usuario ? JSON.parse(usuario) : null;
}

export function logout() {
    localStorage.clear();
    location.href = '/login';
}

export function tienePermiso(codigo: string) {
    return usuarioActual()?.permisos.includes(codigo) ?? false;
}
