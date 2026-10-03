const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : '/api';

export async function ejecutarConsultaAPI(endpoint, opciones = {}) {
    try {
        const respuesta = await fetch(`${API_BASE_URL}/${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            },
            ...opciones
        });

        if (!respuesta.ok) {
            throw new Error(`Error en la petición: ${respuesta.statusText}`);
        }

        return await respuesta.json();
    } catch (error) {
        console.error("Error al conectar con la API:", error);
        throw error;
    }
}
