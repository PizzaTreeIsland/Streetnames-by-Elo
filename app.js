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

  const min = 863;
  const max = 1658;
  const t = Math.max(0, Math.min(1, (elo - min) / (max - min)));

  if (isAccessibilityMode) {
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


const style = document.createElement('style');
style.innerHTML = `
  #ranking-sidebar {
    position: absolute;
    top: 0;
    right: -350px; /* Hidden off-screen by default */
    width: 320px;
    height: 100%;
    background: #fff;
    z-index: 1000; /* Above the map */
    box-shadow: -2px 0 8px rgba(0,0,0,0.2);
    transition: right 0.3s ease;
    overflow-y: auto;
    font-family: system-ui, sans-serif;
    padding: 20px;
    box-sizing: border-box;
  }
  #ranking-sidebar.open {
    right: 0;
  }
  .rank-group {
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid #eee;
  }
  .rank-header {
    display: flex;
    align-items: center;
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 8px;
  }
  .color-square {
    width: 14px;
    height: 14px;
    margin-right: 8px;
    border: 1px solid rgba(0,0,0,0.2);
    border-radius: 2px;
  }
  .street-list {
    margin: 0;
    padding-left: 22px;
    font-size: 13px;
    list-style-type: square;
  }
  .street-link {
    color: #2563eb;
    text-decoration: none;
    cursor: pointer;
  }
  .street-link:hover {
    text-decoration: underline;
  }
  .ellipsis {
    text-align: center;
    font-weight: bold;
    color: #888;
    margin: 15px 0;
    font-size: 20px;
  }
`;
document.head.appendChild(style);

const sidebar = document.createElement('div');
sidebar.id = 'ranking-sidebar';
sidebar.innerHTML = `
  <h2 style="margin-top: 0; font-size: 18px;">Rankings of street names in view</h2>
  <div id="ranking-content"><p style="color: #666; font-size: 13px;">Move the map to load streets...</p></div>
`;

L.DomEvent.disableScrollPropagation(sidebar);
L.DomEvent.disableClickPropagation(sidebar);

document.getElementById('map').appendChild(sidebar);

let isSidebarOpen = false;

const RankingControl = L.Control.extend({
  options: {
    position: 'topleft' 
  },
  onAdd: function () {
    const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
    const button = L.DomUtil.create('a', '', container);
    
    button.href = '#';
    button.title = 'Toggle Rankings Sidebar';
    button.innerHTML = '\u2655'; 
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    button.style.textDecoration = 'none';
    button.style.fontSize = '18px';
    button.style.backgroundColor = '#fff';
    button.style.width = '30px';
    button.style.height = '30px';

    L.DomEvent.disableClickPropagation(container);

    L.DomEvent.on(button, 'click', function (e) {
      L.DomEvent.preventDefault(e);
      isSidebarOpen = !isSidebarOpen;
      
      if (isSidebarOpen) {
        sidebar.classList.add('open');
        updateSidebar(); // Refresh data immediately when opened
      } else {
        sidebar.classList.remove('open');
      }
    });

    return container;
  }
});

map.addControl(new RankingControl());

function getVisibleFeatures() {
  if (!visibleLayer || !visibleLayer._vectorTiles) return [];

  const visibleMap = new Map();

  Object.values(visibleLayer._vectorTiles).forEach(tile => {
    if (tile._layers) {
      Object.values(tile._layers).forEach(layer => {
        const props = layer.properties || (layer.feature && layer.feature.properties);
        if (props && props.Elo !== undefined) {
          const key = props.name;
          if (key && !visibleMap.has(key)) {
            visibleMap.set(key, props);
          }
        }
      });
    }
  });

  return Array.from(visibleMap.values());
}

function getFeatureBounds(streetName) {
  const bounds = L.latLngBounds([]);
  const targetLayer = (typeof hitboxLayer !== 'undefined') ? hitboxLayer : visibleLayer;
  const tiles = targetLayer._vectorTiles || targetLayer._tiles || {};
  
  const currentZoom = map.getZoom();
  const mapContainerRect = map.getContainer().getBoundingClientRect();

  Object.values(tiles).forEach(tile => {
    const tileZoom = tile._coords ? tile._coords.z : tile._zoom;
    if (tileZoom !== undefined && tileZoom !== currentZoom) return;

    const layers = tile._layers || tile._features;
    if (!layers) return;

    const tileEl = tile._container || tile.el || tile._canvas;
    if (!tileEl || !document.body.contains(tileEl)) return;

    const tileRect = tileEl.getBoundingClientRect();

    Object.values(layers).forEach(layer => {
      const props = layer.properties || (layer.feature && layer.feature.properties);

      if (props && props.name === streetName && layer._pxBounds) {
        const pxCenter = layer._pxBounds.getCenter();

        const screenX = tileRect.left + pxCenter.x;
        const screenY = tileRect.top + pxCenter.y;

        const containerPoint = L.point(
          screenX - mapContainerRect.left,
          screenY - mapContainerRect.top
        );

        const latLng = map.containerPointToLatLng(containerPoint);
        bounds.extend(latLng);
      }
    });
  });

  return bounds.isValid() ? bounds : null;
}

function openPopupFromSidebar(props) {
  const center = map.getCenter();
  const featureBounds = getFeatureBounds(props.name);
  const targetLatLng = featureBounds ? featureBounds.getCenter() : center;

  const popupContent = `
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
    .setLatLng(targetLatLng || center)
    .setContent(popupContent)
    .openOn(map);
}

function updateSidebar() {
  if (!isSidebarOpen) return;

  const features = getVisibleFeatures();
  const contentDiv = document.getElementById('ranking-content');

  if (features.length === 0) {
    contentDiv.innerHTML = '<p style="color: #666; font-size: 13px;">No ranked streets visible.</p>';
    return;
  }

  const groups = {};
  features.forEach(props => {
    const elo = props.Elo;
    if (!groups[elo]) groups[elo] = [];
    
    if (!groups[elo].some(s => s.name === props.name)) {
      groups[elo].push(props);
    }
  });

  const displayElos = Object.keys(groups).map(Number).sort((a, b) => b - a);

  let html = '';
  displayElos.forEach((elo, index) => {
  const streets = groups[elo];
  const color = getColor(elo);
  const actualRank = index + 1;

  html += `
    <div class="rank-group">
      <div class="rank-header">
        <div class="color-square" style="background-color: ${color};"></div>
        #${actualRank}: Elo ${elo}
      </div>
      <ul class="street-list">
        ${streets.map(s => `
          <li>
            <a class="street-link" 
               data-id="${s.id}" 
               data-name="${s.name}" 
               data-elo="${s.Elo}" 
               data-wikidata="${s["name:etymology:wikidata"] || ""}">
              ${s.name}
            </a>
          </li>
        `).join('')}
      </ul>
    </div>
  `;
});

  contentDiv.innerHTML = html;

  document.querySelectorAll('.street-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const props = {
        id: e.target.getAttribute('data-id'),
        name: e.target.getAttribute('data-name'),
        Elo: Number(e.target.getAttribute('data-elo')),
        "name:etymology:wikidata": e.target.getAttribute('data-wikidata')
      };
      openPopupFromSidebar(props);
    });
  });
}

map.on('moveend', updateSidebar);



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
      if (isSidebarOpen) {updateSidebar();}

      visibleLayer.redraw();
    });

    return container;
  }
});

map.addControl(new AccessibilityControl());
