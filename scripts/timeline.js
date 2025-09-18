const timelineData = [
  {
    id: "alexandria",
    year: "0475",
    title: "Library of Alexandria Restored",
    summary: "Scholars preserve solar maps and proto-astronautical treatises.",
    counterfactual: {
      title: "The Helios Guild",
      tone: "Luminous, scholarly optimism",
      artDirection: "Golden manuscripts levitating amid mirrored observatories",
      imageGradient: "linear-gradient(135deg, rgba(224, 182, 56, 0.75), rgba(88, 142, 255, 0.65))",
      beats: [
        "Oracles of light craft solar sails for Mediterranean couriers.",
        "Street theatres perform mathematical operas under prism domes.",
        "A planetary academy sketches star harbors for future pilgrims."
      ]
    }
  },
  {
    id: "benin",
    year: "1520",
    title: "Bronze Casters of Benin",
    summary: "Engineers fuse metallurgy with harmonic resonators.",
    counterfactual: {
      title: "The Resonant Empire",
      tone: "Vibrant, ceremonial futurism",
      artDirection: "Verdigris plazas, sound-sculpted palaces, iridescent regalia",
      imageGradient: "linear-gradient(140deg, rgba(33, 200, 160, 0.7), rgba(127, 90, 240, 0.6))",
      beats: [
        "Resonance towers broadcast protective symphonies across forests.",
        "Guilds choreograph sonic diplomacy with luminescent drums.",
        "Floating market barges glow with holographic bronze reliefs."
      ]
    }
  },
  {
    id: "kyoto",
    year: "1785",
    title: "Kyoto Automaton Garden",
    summary: "Artificers weave clockwork ecology lessons for nobles.",
    counterfactual: {
      title: "The Lantern Biome",
      tone: "Mystic, tranquil biopunk",
      artDirection: "Bioluminescent carp ponds reflecting origami drones",
      imageGradient: "linear-gradient(125deg, rgba(255, 141, 197, 0.68), rgba(71, 215, 183, 0.62))",
      beats: [
        "Children pilot petal-shaped automata during lantern festivals.",
        "Temple roofs blossom into greenhouse observatories.",
        "Silk guilds cultivate reactive fabrics that echo seasonal poems."
      ]
    }
  },
  {
    id: "patagonia",
    year: "1908",
    title: "Patagonian Signal Array",
    summary: "Tehuelche navigators map aurora currents for explorers.",
    counterfactual: {
      title: "The Skyroot Network",
      tone: "Ethereal, frontier modernism",
      artDirection: "Glacier antennas braided with luminous fibers and ice harbors",
      imageGradient: "linear-gradient(130deg, rgba(101, 199, 255, 0.7), rgba(255, 105, 180, 0.6))",
      beats: [
        "Polar caravans ride magnetic sleighs between crystalline relay towers.",
        "Night markets trade aurora pigments and whispering instruments.",
        "Cartographers chart stratospheric trade winds with light kites."
      ]
    }
  }
];

const timelineList = document.getElementById("timeline-list");
const branchContent = document.getElementById("branch-content");

function renderTimeline() {
  const fragment = document.createDocumentFragment();

  timelineData.forEach((event, index) => {
    const item = document.createElement("article");
    item.className = "timeline-item";
    item.dataset.year = event.year;
    item.dataset.id = event.id;
    item.tabIndex = 0;

    const title = document.createElement("h3");
    title.textContent = event.title;

    const summary = document.createElement("p");
    summary.textContent = event.summary;

    item.append(title, summary);

    item.addEventListener("click", () => selectBranch(event.id));
    item.addEventListener("keypress", (eventKey) => {
      if (eventKey.key === "Enter" || eventKey.key === " ") {
        eventKey.preventDefault();
        selectBranch(event.id);
      }
    });

    if (index === 0) {
      item.classList.add("active");
      requestAnimationFrame(() => selectBranch(event.id));
    }

    fragment.appendChild(item);
  });

  timelineList.appendChild(fragment);
}

function selectBranch(id) {
  const event = timelineData.find((entry) => entry.id === id);
  if (!event) return;

  document.querySelectorAll(".timeline-item").forEach((item) => {
    if (item.dataset.id === id) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  const { counterfactual } = event;

  const branchHTML = `
    <div>
      <h2 class="branch-title">${counterfactual.title}</h2>
      <div class="branch-meta">
        <span><strong>Year:</strong> ${event.year}</span>
        <span><strong>Tone:</strong> ${counterfactual.tone}</span>
      </div>
      <p>${event.summary}</p>
      <p><strong>Art direction:</strong> ${counterfactual.artDirection}</p>
      <div class="branch-image" style="background-image: ${counterfactual.imageGradient};"></div>
      <div class="branch-log">
        <h4>Branch cascade</h4>
        <ol>
          ${counterfactual.beats.map((beat) => `<li>${beat}</li>`).join("")}
        </ol>
      </div>
    </div>
  `;

  branchContent.innerHTML = branchHTML;
}

renderTimeline();
