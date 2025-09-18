import React, { useEffect, useMemo, useRef, useState } from "https://esm.sh/react@18";
import * as L from "https://esm.sh/leaflet@1.9.4";

const periods = ["antiquity", "modern", "future"];

const locations = [
  { id: "rome", name: "Rome, Italy", position: { top: "45%", left: "45%" }, coords: [41.9028, 12.4964] },
  { id: "istanbul", name: "Istanbul, Türkiye", position: { top: "42%", left: "50%" }, coords: [41.0082, 28.9784] },
  { id: "timbuktu", name: "Timbuktu, Mali", position: { top: "55%", left: "38%" }, coords: [16.7666, -3.0026] },
  { id: "mexico", name: "Mexico City, Mexico", position: { top: "52%", left: "18%" }, coords: [19.4326, -99.1332] },
  { id: "tokyo", name: "Tokyo, Japan", position: { top: "48%", left: "72%" }, coords: [35.6762, 139.6503] },
];

const sceneLibrary = {
  rome: {
    antiquity: {
      title: "Colosseum Echoes",
      description:
        "Spectral gladiators conduct symphonies in marble amphitheaters while AI emperors debate eternal governance.",
      image: "./images/space_time/rome-antiquity.png",
      palette: ["#2a1e3f", "#6a3f84", "#f4d272"],
    },
    modern: {
      title: "Steam Aqueducts",
      description:
        "Victorian engineers extend Roman waterways with copper pipes and steam-driven fountains throughout the city.",
      image: "./images/space_time/rome-modern.png",
      palette: ["#1d1f2b", "#385468", "#9fc9d9"],
    },
    future: {
      title: "Quantum Forum",
      description:
        "Holographic senators debate in floating basilicas while ancient algorithms govern digital citizenship.",
      image: "./images/space_time/rome-future.png",
      palette: ["#0b1a2f", "#1f6b9a", "#73f2ff"],
    },
  },
  istanbul: {
    antiquity: {
      title: "Byzantine Bridges",
      description:
        "Golden mosaics float across the Bosphorus as mechanical muezzins call faithful drones to luminous minarets.",
      image: "./images/space_time/istanbul-antiquity.png",
      palette: ["#2b1507", "#8b451c", "#f5c67a"],
    },
    modern: {
      title: "Ottoman Clockwork",
      description:
        "Steam-powered ferries navigate between copper-domed bazaars where mechanical artisans craft kinetic carpets.",
      image: "./images/space_time/istanbul-modern.png",
      palette: ["#1d1f24", "#4b5f73", "#eac87a"],
    },
    future: {
      title: "Bosphorus Portal",
      description:
        "Quantum tunnels connect continents while AI sultans govern from crystalline palaces spanning dimensions.",
      image: "./images/space_time/istanbul-future.png",
      palette: ["#0d1b2a", "#3a506b", "#f9d371"],
    },
  },
  timbuktu: {
    antiquity: {
      title: "Desert Manuscript",
      description:
        "Sand scribes etch holographic texts on dunes while caravans of light traverse ancient trade algorithms.",
      image: "./images/space_time/timbuktu-antiquity.png",
      palette: ["#120c1b", "#3c245c", "#f2a7c5"],
    },
    modern: {
      title: "Salt Steam Mills",
      description:
        "Victorian salt traders power their machinery with Saharan winds, creating oasis factories from desert mirages.",
      image: "./images/space_time/timbuktu-modern.png",
      palette: ["#0c1724", "#233d63", "#8fc1ff"],
    },
    future: {
      title: "Quantum Caravan",
      description:
        "Nomadic data streams cross digital deserts while AI griots preserve humanity's stories in crystalline libraries.",
      image: "./images/space_time/timbuktu-future.png",
      palette: ["#050816", "#272b6a", "#b99dff"],
    },
  },
  mexico: {
    antiquity: {
      title: "Feathered Circuits",
      description:
        "Quetzal-winged drones spiral around pyramid antennas broadcasting ancestral knowledge through jade networks.",
      image: "./images/space_time/mexico-antiquity.png",
      palette: ["#04160f", "#195338", "#7bdba9"],
    },
    modern: {
      title: "Volcanic Foundries",
      description:
        "Steam-powered chinampas float on engineered lakes while copper suns power the mechanical heart of the valley.",
      image: "./images/space_time/mexico-modern.png",
      palette: ["#051b2c", "#134d73", "#67cff2"],
    },
    future: {
      title: "Tenochtitlan Rising",
      description:
        "Floating pyramids orbit the stratosphere while quantum priests conduct ceremonies in zero-gravity temples.",
      image: "./images/space_time/mexico-future.png",
      palette: ["#021526", "#0f4c75", "#4fc0e5"],
    },
  },
  tokyo: {
    antiquity: {
      title: "Neon Bamboo",
      description:
        "Bioluminescent cherry blossoms sync with ancient temple bells while robotic geishas perform in holographic gardens.",
      image: "./images/space_time/tokyo-antiquity.png",
      palette: ["#01121f", "#134361", "#9be7ff"],
    },
    modern: {
      title: "Meiji Mechanisms",
      description:
        "Steam-driven rickshaws navigate copper-plated districts where mechanical craftsmen weave electric silk.",
      image: "./images/space_time/tokyo-modern.png",
      palette: ["#06192e", "#2f536d", "#d0f4ff"],
    },
    future: {
      title: "Cyber Shrine",
      description:
        "Neural torii gates map digital pilgrimages while AI spirits inhabit quantum shrines in the metaverse.",
      image: "./images/space_time/tokyo-future.png",
      palette: ["#020b16", "#173b5f", "#7ec8f8"],
    },
  },
};

const WorldExplorerScreen = () => {
  const [selectedLocation, setSelectedLocation] = useState("rome");
  const [selectedPeriod, setSelectedPeriod] = useState("modern");

  const scene = useMemo(() => sceneLibrary[selectedLocation][selectedPeriod], [selectedLocation, selectedPeriod]);

  const gradient = useMemo(() => {
    const [a, b, c] = scene.palette;
    return `linear-gradient(140deg, ${a}, ${b} 60%, ${c})`;
  }, [scene]);

  const mapElementRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerByIdRef = useRef({});

  useEffect(() => {
    if (!mapElementRef.current || mapInstanceRef.current) {
      return;
    }

    const map = L.map(mapElementRef.current, {
      center: [0, 0],
      zoom: 1.8,
      minZoom: 1.8,
      maxZoom: 1.8,
      worldCopyJump: false,
      attributionControl: true,
      zoomControl: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      touchZoom: false,
      keyboard: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors",
      maxZoom: 19,
      noWrap: true,
    }).addTo(map);

    const defaultStyle = { radius: 6, color: "#7f5eff", weight: 2, fillColor: "#ffffff", fillOpacity: 0.9 };
    const activeStyle = { radius: 8, color: "#ffffff", weight: 3, fillColor: "#7f5eff", fillOpacity: 0.95 };

    const markers = locations.map((loc) => {
      const marker = L.circleMarker(loc.coords, defaultStyle)
        .addTo(map)
        .bindTooltip(loc.name, { direction: "top", offset: [0, -6] })
        .on("click", () => setSelectedLocation(loc.id));
      markerByIdRef.current[loc.id] = marker;
      return marker;
    });

    // Removed initial fitBounds to keep a world view at a fixed zoom

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerByIdRef.current = {};
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const defaultStyle = { radius: 6, color: "#7f5eff", weight: 2, fillColor: "#ffffff", fillOpacity: 0.9 };
    const activeStyle = { radius: 8, color: "#ffffff", weight: 3, fillColor: "#7f5eff", fillOpacity: 0.95 };

    Object.entries(markerByIdRef.current).forEach(([id, marker]) => {
      marker.setStyle(id === selectedLocation ? activeStyle : defaultStyle);
    });
  }, [selectedLocation]);

  return (
    <section className="world-explorer">
      <header>
        <h2 className="section-title">World Explorer</h2>
        <p className="visual-description">
          Choose a destination and era to generate a bespoke AI tableau. Each vignette merges cultural research with
          dreamlike inference to hint at futures that never were—and might yet be.
        </p>
      </header>

      <div className="explorer-layout">
        <div className="map-panel">
          <h3>Select a Location</h3>
          <div className="map-canvas">
            <div ref={mapElementRef} className="leaflet-map" aria-label="World map" />
          </div>
        </div>

        <div className="explorer-panel">
          <div>
            <h3>Choose an Era</h3>
            <div className="period-slider-container">
              <input
                type="range"
                min="0"
                max="2"
                step="1"
                value={periods.indexOf(selectedPeriod)}
                onChange={(e) => setSelectedPeriod(periods[parseInt(e.target.value)])}
                className="period-slider"
              />
              <div className="slider-labels">
                <span>Antiquity</span>
                <span>Modern</span>
                <span>Future</span>
              </div>
            </div>
          </div>

          <div className="visual-panel">
            <div className="visual-scene" style={{ 
              backgroundImage: `url(${scene.image})`, 
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WorldExplorerScreen;
