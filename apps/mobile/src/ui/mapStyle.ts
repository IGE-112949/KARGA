// Estilo Google Maps próximo do mockup: tons suaves, sem pontos de interesse.
export const MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#EEF1EC' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#5B6670' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#F4F7F6' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#CFE2EE' }] },
  { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ color: '#E2E7E2' }] },
];
