import React, { useMemo, useState } from "https://esm.sh/react@18";

const periods = ["Ancient Echo", "Industrial Dawn", "Far Future"];

const locations = [
  { id: "andes", name: "Andean Peaks", position: { top: "55%", left: "20%" } },
  { id: "cairo", name: "Cairo", position: { top: "48%", left: "46%" } },
  { id: "kyoto", name: "Kyoto", position: { top: "50%", left: "70%" } },
  { id: "lagos", name: "Lagos", position: { top: "58%", left: "40%" } },
  { id: "antarctica", name: "Antarctic Frontier", position: { top: "82%", left: "52%" } },
];

const sceneLibrary = {
  andes: {
    "Ancient Echo": {
      title: "Sun-Scribed Ridges",
      description:
        "Incan astronomers etch mirrored glyphs into mountain faces, guiding solar drones that weave glacial rainbows.",
      palette: ["#2a1e3f", "#6a3f84", "#f4d272"],
    },
    "Industrial Dawn": {
      title: "Steam Condor Works",
      description:
        "Copper-plated airships harvest thin air to power suspended cities linked by woven bridges of shimmering fiber.",
      palette: ["#1d1f2b", "#385468", "#9fc9d9"],
    },
    "Far Future": {
      title: "Quipu Nebulae",
      description:
        "Neutrino observatories float above peaks, their cables glowing like cosmic quipus whispering stellar forecasts.",
      palette: ["#0b1a2f", "#1f6b9a", "#73f2ff"],
    },
  },
  cairo: {
    "Ancient Echo": {
      title: "Phosphor Pyramids",
      description:
        "Hieroglyphic drones trace auroral sandstorms across the plateau while holographic sphinxes debate philosophy.",
      palette: ["#2b1507", "#8b451c", "#f5c67a"],
    },
    "Industrial Dawn": {
      title: "Clockwork Canals",
      description:
        "Steam towers distill Nile mist into resonant light, powering bazaars alive with kinetic calligraphy.",
      palette: ["#1d1f24", "#4b5f73", "#eac87a"],
    },
    "Far Future": {
      title: "Solar Mirage Bazaar",
      description:
        "Floating markets shimmer under adaptive sunscreens while AI-guided caravans ferry spices through the stratosphere.",
      palette: ["#0d1b2a", "#3a506b", "#f9d371"],
    },
  },
  kyoto: {
    "Ancient Echo": {
      title: "Lantern Grove",
      description:
        "Bamboo forests glow with bioluminescent haiku, synced to the rhythm of distant temple bells.",
      palette: ["#120c1b", "#3c245c", "#f2a7c5"],
    },
    "Industrial Dawn": {
      title: "Silk Circuit Gardens",
      description:
        "Mechanical koi weave through conductive streams, powering tea houses that remix weather into music.",
      palette: ["#0c1724", "#233d63", "#8fc1ff"],
    },
    "Far Future": {
      title: "Neon Torii Array",
      description:
        "Hovering torii gates map quantum pilgrimages, painting the sky with iterative fractal prayers.",
      palette: ["#050816", "#272b6a", "#b99dff"],
    },
  },
  lagos: {
    "Ancient Echo": {
      title: "River Oracle",
      description:
        "Griot-led canoes trail luminescent scripts that archive oral histories across tidal wetlands.",
      palette: ["#04160f", "#195338", "#7bdba9"],
    },
    "Industrial Dawn": {
      title: "Harbor of Harmonics",
      description:
        "Wave turbines tuned to talking drums power markets draped in woven copper photovoltaic cloth.",
      palette: ["#051b2c", "#134d73", "#67cff2"],
    },
    "Far Future": {
      title: "Lagoon Megapolis",
      description:
        "Bioengineered mangroves cradle levitating transit pods projecting ancestral constellations onto the surf.",
      palette: ["#021526", "#0f4c75", "#4fc0e5"],
    },
  },
  antarctica: {
    "Ancient Echo": {
      title: "Aurora Archives",
      description:
        "Glacial caverns preserve extinct choruses; sonic archaeologists translate them into prismatic sculptures.",
      palette: ["#01121f", "#134361", "#9be7ff"],
    },
    "Industrial Dawn": {
      title: "Steam Halo Stations",
      description:
        "Research domes emit rings of protective vapor, igniting borealis halos etched with navigation runes.",
      palette: ["#06192e", "#2f536d", "#d0f4ff"],
    },
    "Far Future": {
      title: "Crystalline Choir",
      description:
        "Quantum glaciers resonate with AI hymns, summoning light bridges for explorers charting subsurface oceans.",
      palette: ["#020b16", "#173b5f", "#7ec8f8"],
    },
  },
};

const WorldExplorerScreen = () => {
  const [selectedLocation, setSelectedLocation] = useState(locations[0].id);
  const [selectedPeriod, setSelectedPeriod] = useState(periods[0]);

  const scene = useMemo(() => sceneLibrary[selectedLocation][selectedPeriod], [selectedLocation, selectedPeriod]);

  const gradient = useMemo(() => {
    const [a, b, c] = scene.palette;
    return `linear-gradient(140deg, ${a}, ${b} 60%, ${c})`;
  }, [scene]);

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
            <span className="map-outline" aria-hidden />
            {locations.map((location) => (
              <button
                key={location.id}
                className={`map-marker${selectedLocation === location.id ? " active" : ""}`}
                style={location.position}
                onClick={() => setSelectedLocation(location.id)}
              >
                {location.name}
              </button>
            ))}
          </div>
        </div>

        <div className="explorer-panel">
          <div>
            <h3>Choose an Era</h3>
            <div className="period-tabs">
              {periods.map((period) => (
                <button
                  key={period}
                  className={period === selectedPeriod ? "active" : ""}
                  onClick={() => setSelectedPeriod(period)}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          <div className="visual-panel">
            <div className="visual-scene" style={{ background: gradient }}>
              <span>{scene.title}</span>
            </div>
            <div className="selection-summary">
              <h3>{scene.title}</h3>
              <p>{scene.description}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WorldExplorerScreen;
