// leaflet
async function renderMap(imgPath, mapHeight, mapWidth) {
  var map = L.map("map", {
    crs: L.CRS.Simple,
    minZoom: -4,
    maxZoom: 0,
    zoomSnap: 0.5,
    attributionControl: false,
  });

  var bounds = [
    [0, 0],
    [mapHeight, mapWidth],
  ];
  var image = L.imageOverlay(imgPath, bounds).addTo(map);
  map.fitBounds(bounds);
  image.getElement().style.border = "4px double white";
  image.getElement().style.boxSizing = "border-box";

  // split this code out of the render method
  const polygons = []

  // for the current poly
  let paulie
  let points = []

  // Events
  map.on('click', (e) => {
    const { lat, lng } = e.latlng
    // store in polygon
    points.push([lat.toFixed(3), lng.toFixed(3)])

    if (points.length > 2) {
      // Clear existing polygon
      if (paulie) {
        paulie.removeFrom(map)
      }
      // Attempt to render polygon
      paulie = L.polygon(points, { color: 'blue' })
      paulie.addTo(map)
    }
  })

  // on 'right click'
  map.on('contextmenu', () => {
    // Don't add invalid entries; polygons must have at least 3 points
    if (points.length < 2) {
      return
    }
    // take our existing polygon and save it to localstorage for now 
    polygons.push(points)
    localStorage.setItem("polygons", JSON.stringify(polygons))

    // clear our memory and allow for a new polygon to be added
    points = []
    paulie = undefined
  })

  const existingPolys = localStorage.getItem("polygons")
  if (existingPolys) {
    const polygons = JSON.parse(existingPolys)
    for (const polygon of polygons) {
      L.polygon(polygon, { color: 'blue' }).addTo(map)
    }
  }
}

