const map = L.map('map').setView([52.52, 13.405], 12); // Berlin example
map.setMaxZoom(15);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors, &copy; <a href="https://eloeverything.co/" target="_blank" rel="noopener noreferrer">EloEverything</a> | <a href="legal.html" target="_blank" rel="noopener noreferrer">Impressum & Datenschutz</a> | <a href="https://github.com/PizzaTreeIsland/Streetnames-by-Elo" target="_blank" rel="noopener noreferrer">Documentation</a>'
}).addTo(map);

map.getPane('tilePane').style.filter =
  'brightness(1) contrast(.8) grayscale(.9)';

let isAccessibilityMode = false;

function getColor(elo) {
  if (!elo || elo === 0) return '#999'; // grey fallback

  const min = 862;
  const max = 1663;
  const t = Math.max(0, Math.min(1, (elo - min) / (max - min)));

  if (isAccessibilityMode) {
    // Interpolate lightness from 40% (medium grey) to 100% (bright white)
    const lightness = 7 + (t * 93);
    return `hsl(0, 0%, ${lightness}%)`;
  } else {
    // Hue: 0 = red, 120 = green
    const hue = t * 120;
    return `hsl(${hue}, 70%, 50%)`;
  }
}

const MAP_TILE_SOURCE_URL = "https://elotiles.stickermap.org/StreetElos.pmtiles";

map.createPane('dataPane');

const hitboxLayer = L.pmtilesLayer(MAP_TILE_SOURCE_URL, {
  vectorTileLayerStyles: {
    
    map: properties => ({
      color: '#000000',
      weight: 25,
      opacity: 0,       
      fillOpacity: 0
    })
  },
  interactive: true,    
  pane: "dataPane",
  getFeatureId: f => f.properties.id
}).addTo(map);

const visibleLayer = L.pmtilesLayer(MAP_TILE_SOURCE_URL, {
  vectorTileLayerStyles: {
    map: properties => ({
      color: getColor(properties.Elo),
      weight: 4         
    })
  },
  interactive: false,   
  pane: "dataPane",
  getFeatureId: f => f.properties.id
}).addTo(map);

hitboxLayer.on('click', e => {
  const props = e.layer.properties;
  const popup = `
  <div style="font-family:system-ui,sans-serif;">
    <div style="font-weight:600; font-size:14px;">
      ${props.name ?? "Unnamed street"}
    </div>

    <div style="font-size:13px;">
      Elo: ${props.Elo ?? "No data"}
    </div>
    <div>
      Wikidata:
      <a
        href="https://www.wikidata.org/wiki/${props["name:etymology:wikidata"]}"
        target="_blank"
        rel="noopener noreferrer"
        style="font-size:13px; color:#2563eb; text-decoration:none;"
      >
         ${props["name:etymology:wikidata"]}
      </a>
    </div>
  </div>
  `;

  L.popup()
    .setLatLng(e.latlng)
    .setContent(popup)
    .openOn(map);
});

const AccessibilityControl = L.Control.extend({
  options: {
    position: 'topleft'
  },
onAdd: function () {
    const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
    const button = L.DomUtil.create('a', '', container);
    
    button.href = '#';
    button.title = 'Toggle Accessibility Mode';
    button.innerHTML = '\u25D1'; 
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    button.style.textDecoration = 'none';
    button.style.fontSize = '16px';
    button.style.backgroundColor = '#fff';
    button.style.width = '30px';
    button.style.height = '30px';

    L.DomEvent.disableClickPropagation(container);

    L.DomEvent.on(button, 'click', function (e) {
      L.DomEvent.preventDefault(e);
      
      isAccessibilityMode = !isAccessibilityMode;

      const tilePane = map.getPane('tilePane');
      if (isAccessibilityMode) {
        tilePane.style.filter = 'brightness(.05) contrast(1) grayscale(.9)';
      } else {
        tilePane.style.filter = 'brightness(1) contrast(.8) grayscale(.9)';
      }

      // Redraw data layer to pick up the updated getColor values
      visibleLayer.redraw();
    });

    return container;
  }
});

map.addControl(new AccessibilityControl());
