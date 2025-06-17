// PAGE ELEMENTS
const popup = document.querySelector(".popup-overlay");
const closeBtn = document.querySelector(".close-btn");
const gridWrapper = document.getElementById("grid-wrapper");
const sidebarContainer = document.querySelector(".sidebar-container");
const sidebarContent = document.querySelector(".sidebar-content");

async function loadPlaceInfo() {
  const res = await fetch("./assets/localStorageBackup.json");
  return res.json();
}

// Click Handler
function getInfo(info) {
  clear();
  sidepanel("open");
  const Header = document.createElement("h3");
  Header.innerHTML = info.place;
  sidebarContent.appendChild(Header);

  if (info.leader != undefined) {
    const Leader = document.createElement("h4");
    Leader.innerHTML = info.leader;
    sidebarContent.appendChild(Leader);
  }

  const Content = document.createElement("p");
  Content.innerHTML = info.description;
  sidebarContent.appendChild(Content);
}

// Info sidepanel
let isSidepanelClosed = true;

function clear() {
  sidebarContent.innerHTML = "";
}

closeBtn.addEventListener("click", () => {
  if (isSidepanelClosed) {
    sidepanel("open");
  } else {
    sidepanel("close");
  }
});

function sidepanel(action) {
  if (action === "open") {
    if (!isSidepanelClosed) {
      return;
    }
    closeBtn.textContent = ">";
    closeBtn.style.transform = "translateX(-48px)";
    gridWrapper.style.gridTemplateColumns = "1fr 350px";
    sidebarContainer.style.padding = "48px 24px";
    isSidepanelClosed = false;
  } else if (action === "close") {
    if (isSidepanelClosed) {
      return;
    }
    closeBtn.textContent = "<";
    closeBtn.style.transform = "translateX(-24px)";
    gridWrapper.style.gridTemplateColumns = "1fr 0px";
    sidebarContainer.style.padding = "48px 0";
    isSidepanelClosed = true;
  }
  return;
}

// Call renderMap after DOM is ready and polygons are loaded
let CreateMode;
let EditMode;

window.onload = async function () {
  imageMap = new Image();
  imageMap.src = "assets/image.png";
  const MAP_HEIGHT = imageMap.height;
  const MAP_WIDTH = imageMap.width;

  let polygons = [];
  const stored = localStorage.getItem("polygons");
  if (stored) {
    try {
      polygons = JSON.parse(stored);
    } catch (err) {
      console.error("Failed to parse stored polygons:", err);
    }
  }

  CreateMode = true;
  console.log("Beginning in creation mode:");
  await renderMap(imageMap, MAP_HEIGHT, MAP_WIDTH, polygons);
};

function EnableCreateMode() {
  CreateMode = true;
  EditMode = false;
  console.log("Entering Create mode..");
}
function EnableEditMode() {
  CreateMode = false;
  EditMode = true;
  console.log("Entering Edit mode..");
}
function EnableViewMode() {
  EditMode = false;
  CreateMode = false;
  console.log("Entering View mode. look around!");
}

// leaflet setup and interaction logic
async function renderMap(imageMap, MAP_HEIGHT, MAP_WIDTH, polygons) {
  const placesInfo = await loadPlaceInfo();
  const map = L.map("map", {
    crs: L.CRS.Simple,
    minZoom: -3,
    maxZoom: 1.75,
    zoomSnap: 0.5,
    attributionControl: false,
  });

  const bounds = [
    [0, 0],
    [MAP_HEIGHT, MAP_WIDTH],
  ];

  //Generate the Map
  const image = L.imageOverlay(imageMap.src, bounds).addTo(map);
  map.fitBounds(bounds);
  image.getElement().style.border = "4px double white";
  image.getElement().style.boxSiz;

  // for the current polying = "border-box";
  let creatingPoly = false;
  let paulie;
  let points = [];

  // Draw any existing polygons from localStorage
  for (const polygon of polygons) {
    L.polygon(polygon.coords, {
      color: "",
      fillColor: "",
      fillOpacity: 0,
      stroke: false,
    }).addTo(map);
  }

  // Events

  // LEFT-CLICK: Start or extend a new polygon
  map.on("click", (e) => {
    console.log(e.latlng);
    let clickedInside = false;

    if (CreateMode) {
      if (clickedInside) return;

      if (points.length < 1) {
        console.log("Begun polygon creation.");
        creatingPoly = true;
      }

      const { lat, lng } = e.latlng;
      points.push([lat.toFixed(3), lng.toFixed(3)]);
      console.log("polygon points: ", points.length);

      if (points.length > 2) {
        if (paulie) paulie.removeFrom(map);
        paulie = L.polygon(points, { color: "green" }).addTo(map);
      }
    } else {
      if (!EditMode && !CreateMode) {
        //ENTER CODE HERE to pull the area data
        for (const polygon of polygons) {
          const polyLayer = L.polygon(polygon.coords);
          if (polyLayer.getBounds().contains(e.latlng)) {
            console.log(`You clicked on: ${polygon.name}`);
            break;
          } else {
            console.log(
              "You don't seem to have clicked on anything. Keep looking around!"
            );
          }
        }
        return;
      }
    }
  });

  //ESC Key
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      savePoints();
    }
  });

  //Take created polygon and save it to array.
  function savePoints() {
    if (points.length >= 3) {
      const response = prompt("What would you like to name this polygon?");

      if (response) {
        //Check if response = name of any other polygon
        if (polygons.some((poly) => poly.name === response)) {
          alert(
            "A polygon with that name already exists. Please choose a different name."
          );
          return;
        }

        console.log(response);
        polygons.push({ name: response, coords: points });
        console.log("Polygon created");
        paulie.setStyle({ fillColor: "blue", color: "blue" });
        localStorage.setItem("polygons", JSON.stringify(polygons));
      } else {
        if (paulie) paulie.removeFrom(map);
      }
      creatingPoly = false;
      points = [];
      paulie = undefined;
    }
  }

  // RIGHT-CLICK: Delete existing polygon or complete the current polygon creation
  map.on("contextmenu", (e) => {
    //Code for CREATE Mode
    const clickedLatLng = e.latlng;
    if (CreateMode) {
      if (EditMode) {
        console.log(
          "Error. Should be one or the other. Disabling Edit Mode. Please try again."
        );
        EditMode = false;
        return;
      }
      if (!creatingPoly) {
        let polygonDeleted = false;

        // Find and delete the polygon that was right-clicked
        for (let i = 0; i < polygons.length; i++) {
          const polygon = polygons[i];
          if (L.polygon(polygon.coords).getBounds().contains(clickedLatLng)) {
            if (confirm(`Are you sure you want to delete ${polygon.name}?`)) {
              polygons.splice(i, 1);
              localStorage.setItem("polygons", JSON.stringify(polygons));
              console.log(`${polygon.name} deleted`);

              // Remove all existing polygon layers from the map
              map.eachLayer((layer) => {
                if (layer instanceof L.Polygon) {
                  map.removeLayer(layer);
                }
              });

              polygonDeleted = true;
            }

            break; // Exit loop after handling the clicked polygon
          }
        }

        // Redraw polygons only if one was deleted
        if (polygonDeleted) {
          for (const poly of polygons) {
            L.polygon(poly.coords, { color: "blue" }).addTo(map);
          }
        }

        return;
      }
      if (points.length >= 3) {
        savePoints();
      }

      // Finalize and save new polygon
    }
    if (EditMode) {
      for (let i = 0; i < polygons.length; i++) {
        const polygon = polygons[i];
        if (L.polygon(polygon.coords).getBounds().contains(clickedLatLng)) {
          let response = prompt(
            `What would you like to rename ${polygon.name} this as?`
          );
          if (response) {
            //Check if response = name of any other polygon
            if (polygons.some((poly) => poly.name === response)) {
              alert(
                "A polygon with that name already exists. Please choose a different name."
              );
              return;
            }
            polygons[i].name = response;
            localStorage.setItem("polygons", JSON.stringify(polygons));

            // Optionally, redraw polygons to reflect changes
            map.eachLayer((layer) => {
              if (layer instanceof L.Polygon) {
                map.removeLayer(layer);
              }
            });
            for (const poly of polygons) {
              L.polygon(poly.coords, { color: "blue" }).addTo(map);
            }
            break;
          }
        }
      }
    }
  });
}

//Take the current localstorage and download it to the PC. Must move to VS Code folder to see it on next load.
function saveToLocalStorage() {
  const data = {};

  // Extract all keys and parse values
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    try {
      data[key] = JSON.parse(value);
    } catch {
      data[key] = value; // Fallback for plain strings
    }
  }

  // Create JSON blob
  const jsonData = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonData], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  // Create and trigger download link
  const a = document.createElement("a");
  a.href = url;
  a.download = "localStorageBackup.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Revoke object URL to free memory
  URL.revokeObjectURL(url);
}

//Funtion to load the saved file from folder storage to localstorage
async function loadToLocalStorage() {
  const res = await fetch("./assets/localStorageBackup.json");
  const data = await res.json();

  localStorage.clear();

  for (const key in data) {
    localStorage.setItem(key, JSON.stringify(data[key]));
  }
  window.location.reload();
  console.log("localStorage restored from JSON.");
}

/* FEATURE REQUESTS:
-high:  DONE  Cursor want to not be a hand
-low:   DONE  Escape key also stops polygon creation
-low:         Hover-over for 0.52 seconds, give small text box of name/descritpion
-med:   DONE  click on polygon, return name
-high:  DONE  Create create/edit/view mode -> create - creeate new polygons | Edit - change existing polygon | view - click on poly to immediately get information
-med          add sidebar to summarize data - Like matteo's Pyre website 
-low          Layer management - locations in ocean, locations in land, etc. eg. City in kingdom
-low:         highlight poly on hover. only for testing and fun/experience, not for final use.
*/
