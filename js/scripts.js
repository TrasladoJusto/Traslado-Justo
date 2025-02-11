// ========== CONTROL DEL MENÚ MÓVIL ========== //
const menuToggle = document.querySelector('.menu-toggle');
const menu = document.querySelector('.menu');
const overlay = document.querySelector('.overlay');

// Función para alternar menú
function toggleMenu() {
    menu.classList.toggle('active');
    overlay.classList.toggle('active');
    document.body.style.overflow = menu.classList.contains('active') ? 'hidden' : 'auto';
}

// Event listeners
menuToggle.addEventListener('click', toggleMenu);
overlay.addEventListener('click', toggleMenu);

// ========== FUNCIONALIDAD DEL MAPA ========== //
let map;
let routingControl;
let markerOrigen = null;
let markerDestino = null;

// Inicializar mapa
function initMap() {
    map = L.map('map').setView([-12.046374, -77.042793], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
}

// Geocodificar dirección
async function geocodeAddress(address) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
        const data = await response.json();
        
        if (!data.length) throw new Error('Dirección no encontrada');
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        
    } catch (error) {
        alert(`Error: ${error.message}`);
        throw error;
    }
}

// Añadir marcador
function addMarker(coordinates, isOrigin) {
    const icon = L.icon({
        iconUrl: isOrigin 
            ? 'https://leafletjs.com/examples/custom-icons/leaf-green.png'
            : 'https://leafletjs.com/examples/custom-icons/leaf-red.png',
        iconSize: [32, 41]
    });

    // Eliminar marcador existente
    if (isOrigin && markerOrigen) map.removeLayer(markerOrigen);
    if (!isOrigin && markerDestino) map.removeLayer(markerDestino);

    // Crear nuevo marcador
    const marker = L.marker(coordinates, { icon }).addTo(map);
    isOrigin ? markerOrigen = marker : markerDestino = marker;
}

// Calcular ruta
async function calculateRoute() {
    const origenInput = document.getElementById('origen').value.trim();
    const destinoInput = document.getElementById('destino').value.trim();

    if (!origenInput || !destinoInput) {
        alert('Por favor ingrese ambas direcciones');
        return;
    }

    try {
        const [origenCoords, destinoCoords] = await Promise.all([
            geocodeAddress(origenInput),
            geocodeAddress(destinoInput)
        ]);

        // Añadir marcadores
        addMarker(origenCoords, true);
        addMarker(destinoCoords, false);

        // Eliminar ruta anterior
        if (routingControl) map.removeControl(routingControl);

        // Crear nueva ruta
        routingControl = L.Routing.control({
            waypoints: [
                L.latLng(origenCoords[0], origenCoords[1]),
                L.latLng(destinoCoords[0], destinoCoords[1])
            ],
            routeWhileDragging: true,
            show: false
        }).addTo(map);

        // Manejar resultados
        routingControl.on('routesfound', e => {
            const route = e.routes[0];
            const distancia = (route.summary.totalDistance / 1000).toFixed(2);
            const tiempo = Math.round(route.summary.totalTime / 60);
            const costo = (distancia * 2).toFixed(2);

            document.getElementById('distancia-res').textContent = `Distancia: ${distancia} km`;
            document.getElementById('tiempo-res').textContent = `Tiempo estimado: ${tiempo} min`;
            document.getElementById('costo-res').textContent = `Costo estimado: S/ ${costo}`;
        });

    } catch (error) {
        console.error('Error al calcular ruta:', error);
    }
}

// Limpiar selección
function clearMarkers() {
    if (markerOrigen) map.removeLayer(markerOrigen);
    if (markerDestino) map.removeLayer(markerDestino);
    if (routingControl) map.removeControl(routingControl);
    
    markerOrigen = null;
    markerDestino = null;
    routingControl = null;
    
    document.getElementById('origen').value = '';
    document.getElementById('destino').value = '';
    document.querySelectorAll('#resultados p').forEach(p => p.textContent = '-');
}

// Enviar a WhatsApp
function enviarWhatsApp(e) {
    e.preventDefault();
    
    // Obtener datos del formulario
    const formData = new FormData(document.getElementById('contactForm'));
    const datos = Object.fromEntries(formData.entries());
    
    // Construir mensaje
    const mensaje = `*Solicitud de Traslado*
    
    *Nombre:* ${datos.nombre} ${datos.apellidos}
    *Celular:* ${datos.celular}
    *Correo:* ${datos.correo || 'No especificado'}
    *Vehículo:* ${datos.vehiculo}
    *Fecha:* ${datos.fecha}
    *Hora:* ${datos.hora}
    *Origen:* ${datos.origen}
    *Destino:* ${datos.destino}
    *Costo estimado:* ${document.getElementById('costo-res').textContent.split(': ')[1] || 'No calculado'}`;

    // Codificar y enviar
    const url = `https://wa.me/51968726558?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
}

// ========== INICIALIZACIÓN ========== //
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    
    // Event listeners
    document.getElementById('calculateRoute').addEventListener('click', calculateRoute);
    document.getElementById('clearMarkers').addEventListener('click', clearMarkers);
    document.getElementById('contactForm').addEventListener('submit', enviarWhatsApp);
    
    // Cerrar menú al hacer clic en enlaces
    document.querySelectorAll('.menu a').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) toggleMenu();
        });
    });
});
