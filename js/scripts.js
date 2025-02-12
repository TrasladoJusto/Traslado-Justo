// ========== CONTROL DEL MENÚ MÓVIL ========== //
const menuToggle = document.querySelector('.menu-toggle');
const menu = document.querySelector('.menu');
const overlay = document.querySelector('.overlay');

// Función para alternar el menú
function toggleMenu() {
    menu.classList.toggle('active');
    overlay.classList.toggle('active');
    document.body.style.overflow = menu.classList.contains('active') ? 'hidden' : 'auto';
}

// Eventos del botón y overlay
menuToggle.addEventListener('click', toggleMenu);
overlay.addEventListener('click', toggleMenu);

// Cerrar al hacer clic fuera del menú
document.addEventListener('click', (e) => {
    const isMenuClick = menu.contains(e.target);
    const isButtonClick = menuToggle.contains(e.target);
    
    if (!isMenuClick && !isButtonClick && menu.classList.contains('active')) {
        toggleMenu();
    }
});

// Cerrar menú al seleccionar opción
document.querySelectorAll('.menu a').forEach(link => {
    link.addEventListener('click', () => {
        if (window.innerWidth <= 768) toggleMenu();
    });
});

// ========== FUNCIONALIDAD DEL MAPA ========== //
let map;
let routingControl;
let markerOrigen = null;
let markerDestino = null;

function initMap() {
    map = L.map('map').setView([-12.046374, -77.042793], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
}

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

function addMarker(coordinates, isOrigin) {
    const icon = L.icon({
        iconUrl: isOrigin 
            ? 'https://leafletjs.com/examples/custom-icons/leaf-green.png' 
            : 'https://leafletjs.com/examples/custom-icons/leaf-red.png',
        iconSize: [32, 41]
    });

    if (isOrigin && markerOrigen) map.removeLayer(markerOrigen);
    if (!isOrigin && markerDestino) map.removeLayer(markerDestino);

    const marker = L.marker(coordinates, { icon }).addTo(map);
    isOrigin ? markerOrigen = marker : markerDestino = marker;
}

async function calculateRoute() {
    const origen = document.getElementById('origen').value.trim();
    const destino = document.getElementById('destino').value.trim();
    
    if (!origen || !destino) return alert('Complete ambos campos de dirección');
    
    try {
        const [coordOrigen, coordDestino] = await Promise.all([
            geocodeAddress(origen),
            geocodeAddress(destino)
        ]);
        
        addMarker(coordOrigen, true);
        addMarker(coordDestino, false);
        
        if (routingControl) map.removeControl(routingControl);
        
        routingControl = L.Routing.control({
            waypoints: [L.latLng(coordOrigen), L.latLng(coordDestino)],
            routeWhileDragging: true,
            showAlternatives: false
        }).addTo(map);
        
        routingControl.on('routesfound', (e) => {
            const { totalDistance, totalTime } = e.routes[0].summary;
            document.getElementById('distancia-res').textContent = `Distancia: ${(totalDistance / 1000).toFixed(2)} km`;
            document.getElementById('tiempo-res').textContent = `Tiempo: ${Math.round(totalTime / 60)} min`;
            document.getElementById('costo-res').textContent = `Costo: S/ ${(totalDistance / 1000 * 2).toFixed(2)}`;
        });
        
    } catch (error) {
        console.error('Error en el cálculo de ruta:', error);
    }
}

function clearMarkers() {
    [markerOrigen, markerDestino].forEach(marker => {
        if (marker) map.removeLayer(marker);
    });
    markerOrigen = markerDestino = null;
    
    if (routingControl) {
        map.removeControl(routingControl);
        routingControl = null;
    }
    
    document.querySelectorAll('#resultados p').forEach(p => p.textContent = '-');
    document.getElementById('origen').value = '';
    document.getElementById('destino').value = '';
}

function enviarWhatsApp(e) {
    e.preventDefault();
    const formData = new FormData(document.getElementById('contactForm'));
    const datos = Object.fromEntries(formData.entries());
    
    const mensaje = `*Nueva Reserva*%0A
Nombre: ${datos.nombre} ${datos.apellidos}%0A
Celular: ${datos.celular}%0A
Correo: ${datos.correo || 'No especificado'}%0A
Vehículo: ${datos.vehiculo}%0A
Fecha: ${datos.fecha}%0A
Hora: ${datos.hora}%0A
Origen: ${datos.origen}%0A
Destino: ${datos.destino}%0A
${document.getElementById('costo-res').textContent}`;

    window.open(`https://wa.me/51968726558?text=${mensaje}`, '_blank');
}

// ========== INICIALIZACIÓN GENERAL ========== //
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    
    // Event listeners
    document.getElementById('calculateRoute').addEventListener('click', calculateRoute);
    document.getElementById('clearMarkers').addEventListener('click', clearMarkers);
    document.getElementById('contactForm').addEventListener('submit', enviarWhatsApp);
    
    // Ajustar posición inicial del menú
    const header = document.querySelector('header');
    if(header) menu.style.top = `${header.offsetHeight}px`;
});
