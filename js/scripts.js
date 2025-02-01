let map;
let routingControl;
let markerOrigen = null;
let markerDestino = null;

// Inicializa el mapa centrado en Lima, Perú
function initMap() {
    map = L.map('map').setView([-12.046374, -77.042793], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
}

// Geocodifica una dirección a coordenadas
async function geocodeAddress(address) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.length > 0) {
            return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        } else {
            throw new Error(`No se encontró la dirección: "${address}"`);
        }
    } catch (error) {
        console.error(`Error al geocodificar: ${error.message}`);
        throw error;
    }
}

// Marca una ubicación en el mapa
function addMarker(coordinates, isOrigin) {
    const icon = L.icon({
        iconUrl: isOrigin 
            ? 'https://leafletjs.com/examples/custom-icons/leaf-green.png' 
            : 'https://leafletjs.com/examples/custom-icons/leaf-red.png',
        iconSize: [25, 41],
    });

    const marker = L.marker(L.latLng(coordinates[0], coordinates[1]), { icon }).addTo(map);

    if (isOrigin) {
        if (markerOrigen) map.removeLayer(markerOrigen);
        markerOrigen = marker;
    } else {
        if (markerDestino) map.removeLayer(markerDestino);
        markerDestino = marker;
    }
}

// Calcula y muestra la ruta en el mapa
async function calculateRoute() {
    const originInput = document.getElementById('origen').value.trim();
    const destinationInput = document.getElementById('destino').value.trim();

    if (!originInput || !destinationInput) {
        alert('Por favor, ingrese tanto la dirección de origen como la de destino.');
        return;
    }

    try {
        const origin = await geocodeAddress(originInput);
        const destination = await geocodeAddress(destinationInput);

        addMarker(origin, true);
        addMarker(destination, false);

        if (routingControl) map.removeControl(routingControl);

        routingControl = L.Routing.control({
            waypoints: [L.latLng(origin[0], origin[1]), L.latLng(destination[0], destination[1])],
            routeWhileDragging: true,
            showAlternatives: false,
        }).addTo(map);

        routingControl.on('routesfound', (e) => {
            const route = e.routes[0];
            const distance = (route.summary.totalDistance / 1000).toFixed(2) + ' km';
            const duration = (route.summary.totalTime / 60).toFixed(0) + ' min';
            const cost = (route.summary.totalDistance / 1000 * 2).toFixed(2);

            document.getElementById('distancia-res').textContent = `Distancia: ${distance}`;
            document.getElementById('costo-res').textContent = `Costo estimado: S/ ${cost}`;
            document.getElementById('tiempo-res').textContent = `Duración estimada: ${duration}`;
        });

        routingControl.on('routingerror', (e) => {
            console.error('Error de enrutamiento:', e);
            alert('No se pudo calcular la ruta. Verifique las direcciones ingresadas.');
        });
    } catch (error) {
        alert(error.message);
    }
}

// Limpia marcadores, rutas y detalles
function clearMarkers() {
    if (markerOrigen) {
        map.removeLayer(markerOrigen);
        markerOrigen = null;
    }
    if (markerDestino) {
        map.removeLayer(markerDestino);
        markerDestino = null;
    }
    if (routingControl) {
        map.removeControl(routingControl);
        routingControl = null;
    }

    document.getElementById('origen').value = '';
    document.getElementById('destino').value = '';
    document.getElementById('distancia-res').textContent = 'Distancia: -';
    document.getElementById('costo-res').textContent = 'Costo: -';
    document.getElementById('tiempo-res').textContent = 'Tiempo estimado: -';
}

// Función para alternar el menú desplegable
function toggleMenu() {
    const menu = document.querySelector('.menu');
    const overlay = document.getElementById('overlay');
    menu.classList.toggle('active');
    overlay.classList.toggle('active');
}

// Cerrar el menú al hacer clic fuera de él
document.addEventListener('click', function(event) {
    const menu = document.querySelector('.menu');
    const menuToggle = document.querySelector('.menu-toggle');
    const overlay = document.getElementById('overlay');

    // Verificar si el clic fue fuera del menú y del botón de alternar
    if (!menu.contains(event.target) && !menuToggle.contains(event.target) && menu.classList.contains('active')) {
        menu.classList.remove('active');
        overlay.classList.remove('active');
    }
});

// Inicializa el mapa y configura eventos
document.addEventListener('DOMContentLoaded', () => {
    initMap();

    const calculateButton = document.getElementById('calculateRoute');
    const clearButton = document.getElementById('clearMarkers');
    const whatsappButton = document.getElementById('enviarWhatsApp');

    if (calculateButton) calculateButton.addEventListener('click', calculateRoute);
    if (clearButton) clearButton.addEventListener('click', clearMarkers);
    if (whatsappButton) whatsappButton.addEventListener('click', enviarWhatsApp);
});

// Envía los datos a WhatsApp
function enviarWhatsApp(event) {
    event.preventDefault();

    const nombre = document.getElementById('nombre')?.value.trim() || 'No especificado';
    const apellidos = document.getElementById('apellidos')?.value.trim() || '';
    const celular = document.getElementById('celular')?.value.trim() || 'No especificado';
    const correo = document.getElementById('correo')?.value.trim() || 'No especificado';
    const origen = document.getElementById('origen')?.value.trim() || 'No especificado';
    const destino = document.getElementById('destino')?.value.trim() || 'No especificado';
    const vehiculo = document.getElementById('vehiculo')?.value.trim() || 'No especificado';
    const fecha = document.getElementById('fecha')?.value.trim() || 'No especificada';
    const hora = document.getElementById('hora')?.value.trim() || 'No especificada';

    const costo = document.getElementById('costo-res')?.textContent.match(/Costo estimado: S\/ ([\d.]+)/)?.[1] || "0.00";

    const mensaje = `
        Solicito un servicio de Traslado Justo.
        Nombre: ${nombre} ${apellidos}
        Celular: ${celular}
        Correo: ${correo}
        Vehículo: ${vehiculo}
        Fecha: ${fecha}
        Hora: ${hora}
        Origen: ${origen}
        Destino: ${destino}
        Costo estimado: S/ ${costo}
    `.trim();

    const url = `https://wa.me/51968726558?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
}

