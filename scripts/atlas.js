const atlasData = {
  "north-america": {
    name: "Northern Sky Nations",
    palettes: {
      ancient: "linear-gradient(135deg, rgba(196, 129, 76, 0.8), rgba(44, 177, 188, 0.6))",
      renaissance: "linear-gradient(135deg, rgba(120, 177, 255, 0.75), rgba(239, 111, 217, 0.6))",
      industrial: "linear-gradient(135deg, rgba(95, 130, 160, 0.75), rgba(127, 90, 240, 0.55))",
      future: "linear-gradient(135deg, rgba(102, 255, 204, 0.75), rgba(72, 139, 255, 0.6))"
    },
    stories: {
      ancient: {
        description:
          "Mound astronomers align cedar observatories beneath polar auroras, mapping migrating constellations.",
        badges: ["Aurora Cartography", "Cedar Archives", "Sky Drums"]
      },
      renaissance: {
        description:
          "Sky nations choreograph air canoe ballets while crystal cities archive thunderstorm sonatas.",
        badges: ["Storm Libraries", "Wind Opera", "Crystal Nations"]
      },
      industrial: {
        description:
          "Electrum railways weave across boreal canopies, trading luminous seeds for harmonic engines.",
        badges: ["Boreal Rails", "Seed Exchange", "Harmonic Engines"]
      },
      future: {
        description:
          "Floating communes cultivate nebula farms in the ionosphere, nurturing cloud orchards for sky nomads.",
        badges: ["Nebula Farms", "Cloud Orchards", "Sky Nomads"]
      }
    }
  },
  europe: {
    name: "Continental Prism",
    palettes: {
      ancient: "linear-gradient(135deg, rgba(242, 200, 111, 0.75), rgba(127, 90, 240, 0.6))",
      renaissance: "linear-gradient(135deg, rgba(255, 153, 153, 0.7), rgba(255, 255, 204, 0.6))",
      industrial: "linear-gradient(135deg, rgba(115, 117, 192, 0.7), rgba(255, 186, 90, 0.6))",
      future: "linear-gradient(135deg, rgba(77, 255, 214, 0.75), rgba(132, 99, 255, 0.65))"
    },
    stories: {
      ancient: {
        description:
          "Marble harmonics flow through aqueducts where philosopher-engineers sculpt auric amphitheaters.",
        badges: ["Marble Harmonics", "Auric Amphitheaters", "Philosopher Guilds"]
      },
      renaissance: {
        description:
          "Clockwork ateliers orbit cathedral skylines as painters collaborate with alchemical choirs.",
        badges: ["Clockwork Ateliers", "Alchemical Choirs", "Orbiting Galleries"]
      },
      industrial: {
        description:
          "Steam vineyards produce chromatic fog, powering prism locomotives across crystalline bridges.",
        badges: ["Chromatic Fog", "Prism Locomotives", "Crystal Bridges"]
      },
      future: {
        description:
          "Quantum salons remix folklore with aurora choreography, weaving shared dream infrastructure.",
        badges: ["Quantum Salons", "Aurora Choreography", "Dream Infrastructure"]
      }
    }
  },
  africa: {
    name: "Solar Harmonic Belt",
    palettes: {
      ancient: "linear-gradient(135deg, rgba(255, 193, 94, 0.78), rgba(214, 74, 123, 0.6))",
      renaissance: "linear-gradient(135deg, rgba(255, 137, 102, 0.75), rgba(127, 90, 240, 0.55))",
      industrial: "linear-gradient(135deg, rgba(255, 226, 104, 0.75), rgba(95, 178, 255, 0.6))",
      future: "linear-gradient(135deg, rgba(255, 170, 124, 0.75), rgba(69, 214, 164, 0.65))"
    },
    stories: {
      ancient: {
        description:
          "Saharan resonant caravans project mirage gardens, guiding travelers through liquid light.",
        badges: ["Mirage Gardens", "Resonant Caravans", "Liquid Light"]
      },
      renaissance: {
        description:
          "Great lakes cities develop tidal observatories, translating hippo migration songs into navigation maps.",
        badges: ["Tidal Observatories", "Migration Songs", "Water Cartography"]
      },
      industrial: {
        description:
          "Solar loom foundries weave photonic textiles powering pan-continental knowledge caravans.",
        badges: ["Solar Looms", "Photonic Textiles", "Knowledge Caravans"]
      },
      future: {
        description:
          "Equatorial skyrails connect desert bloom sanctuaries where bioluminescent archives pulse at dusk.",
        badges: ["Skyrails", "Desert Bloom", "Bioluminescent Archives"]
      }
    }
  },
  "south-america": {
    name: "Emerald Circuit",
    palettes: {
      ancient: "linear-gradient(135deg, rgba(130, 232, 168, 0.75), rgba(46, 143, 255, 0.6))",
      renaissance: "linear-gradient(135deg, rgba(255, 180, 123, 0.75), rgba(118, 161, 255, 0.6))",
      industrial: "linear-gradient(135deg, rgba(255, 104, 176, 0.7), rgba(65, 205, 255, 0.6))",
      future: "linear-gradient(135deg, rgba(72, 255, 197, 0.75), rgba(255, 115, 168, 0.65))"
    },
    stories: {
      ancient: {
        description:
          "Rainforest astronomers engineer glowroot cathedrals synchronized with jaguar constellations.",
        badges: ["Glowroot Cathedrals", "Jaguar Constellations", "Rain Harps"]
      },
      renaissance: {
        description:
          "Floating terraces cultivate kaleidoscopic orchids powering river symphony workshops.",
        badges: ["Floating Terraces", "Orchid Reactors", "River Symphony"]
      },
      industrial: {
        description:
          "Volcanic turbines sculpt geothermal zeppelins ferrying storytellers across cloud forests.",
        badges: ["Geothermal Zeppelins", "Storyteller Guilds", "Cloud Forests"]
      },
      future: {
        description:
          "Bioelectric cities listen to rainforest neural networks, co-creating sentient canopy art.",
        badges: ["Bioelectric Cities", "Sentient Canopy", "Rainforest Networks"]
      }
    }
  },
  asia: {
    name: "Aurora Archipelago",
    palettes: {
      ancient: "linear-gradient(135deg, rgba(255, 190, 160, 0.75), rgba(140, 205, 255, 0.65))",
      renaissance: "linear-gradient(135deg, rgba(255, 220, 140, 0.7), rgba(158, 129, 255, 0.6))",
      industrial: "linear-gradient(135deg, rgba(255, 147, 211, 0.7), rgba(115, 236, 255, 0.6))",
      future: "linear-gradient(135deg, rgba(164, 255, 209, 0.75), rgba(160, 147, 255, 0.65))"
    },
    stories: {
      ancient: {
        description:
          "Archipelago scholars craft tidal libraries where robotic koi deliver coral manuscripts.",
        badges: ["Tidal Libraries", "Robotic Koi", "Coral Manuscripts"]
      },
      renaissance: {
        description:
          "Tea-weather guilds paint sky lantern forecasts while jade observatories pulse with starlight.",
        badges: ["Tea-Weather", "Sky Lanterns", "Jade Observatories"]
      },
      industrial: {
        description:
          "Silk maglev routes arc across desert clouds, carrying crystalline data scrolls.",
        badges: ["Silk Maglev", "Data Scrolls", "Desert Clouds"]
      },
      future: {
        description:
          "Sapphire megacities levitate over ocean mirrors, orchestrating climate symphonies for migrating reefs.",
        badges: ["Climate Symphonies", "Ocean Mirrors", "Migrating Reefs"]
      }
    }
  },
  oceania: {
    name: "Tidal Dreamspan",
    palettes: {
      ancient: "linear-gradient(135deg, rgba(255, 198, 133, 0.75), rgba(91, 190, 255, 0.65))",
      renaissance: "linear-gradient(135deg, rgba(118, 180, 255, 0.75), rgba(255, 135, 176, 0.6))",
      industrial: "linear-gradient(135deg, rgba(255, 153, 102, 0.7), rgba(105, 200, 255, 0.6))",
      future: "linear-gradient(135deg, rgba(88, 237, 198, 0.75), rgba(255, 166, 231, 0.65))"
    },
    stories: {
      ancient: {
        description:
          "Voyager choirs sculpt bioluminescent surf temples guided by whale constellations.",
        badges: ["Voyager Choirs", "Surf Temples", "Whale Constellations"]
      },
      renaissance: {
        description:
          "Polynesian cloud caravels harvest starlit mist for communal navigation rituals.",
        badges: ["Cloud Caravels", "Starlit Mist", "Navigation Rituals"]
      },
      industrial: {
        description:
          "Subaquatic foundries print coral alloys, anchoring tidal observatories beneath phosphor waves.",
        badges: ["Coral Alloys", "Tidal Observatories", "Phosphor Waves"]
      },
      future: {
        description:
          "Hovering atolls host dreamcartographers who sculpt holographic reefs for intertidal festivals.",
        badges: ["Dreamcartographers", "Holographic Reefs", "Intertidal Festivals"]
      }
    }
  }
};

const periodSelect = document.getElementById("period-select");
const atlasVisual = document.getElementById("atlas-visual");
const atlasDescription = document.getElementById("atlas-description");
const badgesContainer = document.getElementById("period-badges");
let activeRegion = null;

function updateAtlas(regionId) {
  const period = periodSelect.value;
  const region = atlasData[regionId];
  if (!region) {
    atlasDescription.textContent = "Choose a region and era to reveal an AI art vignette.";
    atlasVisual.style.backgroundImage = "";
    badgesContainer.innerHTML = "";
    return;
  }

  const story = region.stories[period];
  atlasDescription.textContent = `${region.name} — ${story.description}`;
  atlasVisual.style.backgroundImage = region.palettes[period];

  badgesContainer.innerHTML = story.badges
    .map((badge) => `<span class="badge">${badge}</span>`)
    .join("");
}

function handleRegionSelection(regionId) {
  activeRegion = regionId;
  document.querySelectorAll(".region").forEach((regionEl) => {
    if (regionEl.id === regionId) {
      regionEl.classList.add("active");
    } else {
      regionEl.classList.remove("active");
    }
  });
  updateAtlas(regionId);
}

periodSelect.addEventListener("change", () => {
  if (activeRegion) {
    updateAtlas(activeRegion);
  }
});

document.querySelectorAll(".region").forEach((regionEl) => {
  regionEl.addEventListener("click", () => handleRegionSelection(regionEl.id));
  regionEl.addEventListener("keypress", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleRegionSelection(regionEl.id);
    }
  });
});

// Initialize with a default selection for immediate feedback
handleRegionSelection("europe");
