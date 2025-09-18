import React, { useMemo, useState } from "https://esm.sh/react@18";

const timelineEvents = [
  {
    id: "alexandria",
    year: "-285",
    title: "Library of Alexandria",
    description:
      "Scholars safeguard the ancient world's knowledge repository, intertwining Greek, Egyptian, and Indian sciences.",
    counterfactuals: [
      {
        id: "alexandria-celestial",
        title: "Celestial Cartographers",
        summary: "Astrolabes guide star ships launched from the Nile delta into the Mediterranean skies.",
        narrative:
          "Preserved scrolls on optics and combustion inspire airborne observatories. Bronze gliders catch thermals over Alexandria, projecting constellations onto vast sails. Trade routes expand upward as scholars sketch the first orbital gardens.",
        palette: ["#191046", "#3b2d7b", "#83a4ff"],
      },
      {
        id: "alexandria-crystal",
        title: "Crystal Databanks",
        summary: "Alchemists encode stories within quartz matrices that sing when illuminated.",
        narrative:
          "Glassblowers craft translucent archives—columns of crystal resonating with recorded voices of poets and astronomers. Visitors wander aisles lit by bioluminescent canals while AI-guided caretakers translate lost dialects in real time.",
        palette: ["#1b233a", "#3e7ba6", "#a7f0ff"],
      },
    ],
  },
  {
    id: "kyoto",
    year: "1603",
    title: "Clockwork Edo",
    description: "Shogunate artisans merge precision mechanics with zen aesthetics across Kyoto's workshops.",
    counterfactuals: [
      {
        id: "kyoto-automata",
        title: "Gardens of Automata",
        summary: "Tea ceremonies guided by mechanical hosts choreographed to moon phases.",
        narrative:
          "Clockmakers craft lacquered androids whose joints whisper like wind chimes. They cultivate bonsai nebulae—trees suspended in glass orbs rotating through seasons overnight while guests sip luminous matcha distilled from comet dust.",
        palette: ["#1c0f1f", "#5e2f5c", "#f6ad9e"],
      },
      {
        id: "kyoto-lantern",
        title: "Lantern Network",
        summary: "Paper lanterns double as quantum relays pulsing poetry across archipelagos.",
        narrative:
          "Each lantern holds an origami processor trained on haiku. As night falls, the skyline glows with synchronized verses while koi ponds ripple with encoded messages guiding travelers through the neon mist.",
        palette: ["#100b23", "#4530a0", "#fdd35d"],
      },
    ],
  },
  {
    id: "lagos",
    year: "2120",
    title: "Neo-Lagos Delta",
    description: "Floating neighborhoods weave biomaterials with tidal computing reefs along West Africa.",
    counterfactuals: [
      {
        id: "lagos-reef",
        title: "Reef Choirs",
        summary: "Coral skyscrapers hum predictive rhythms that calm approaching storms.",
        narrative:
          "Architects cultivate living towers tuned with AI chorales. When monsoons rise, the reefs emit harmonic pulses, bending weather patterns while projecting holographic festivals that celebrate ancestral spirits above the waves.",
        palette: ["#041f1a", "#1f6f64", "#9bf2d2"],
      },
      {
        id: "lagos-market",
        title: "Tidal Markets",
        summary: "Liquid trading floors float between mangroves, forecasting harvests through bio-luminescent data.",
        narrative:
          "Markets built on kelp membranes drift with the tides. Vendors trade scent-based currencies while translucent screens display AI-painted futures of coastal life. Children pilot solar skiffs carrying aurora fabrics woven from algae.",
        palette: ["#021b34", "#155e8a", "#58c4ff"],
      },
    ],
  },
];

const TimelineScreen = () => {
  const [selectedEventId, setSelectedEventId] = useState(timelineEvents[0].id);
  const [selectedCounterfactualId, setSelectedCounterfactualId] = useState(timelineEvents[0].counterfactuals[0].id);

  const selectedEvent = useMemo(
    () => timelineEvents.find((event) => event.id === selectedEventId) ?? timelineEvents[0],
    [selectedEventId]
  );

  const selectedCounterfactual = useMemo(() => {
    const baseline = selectedEvent.counterfactuals[0];
    return selectedEvent.counterfactuals.find((item) => item.id === selectedCounterfactualId) ?? baseline;
  }, [selectedCounterfactualId, selectedEvent]);

  const gradient = useMemo(() => {
    const [a, b, c] = selectedCounterfactual.palette;
    return `linear-gradient(135deg, ${a}, ${b} 55%, ${c})`;
  }, [selectedCounterfactual]);

  return (
    <section className="timeline-screen">
      <header>
        <h2 className="section-title">Counterfactual Timeline</h2>
        <p className="visual-description">
          Move along pivotal moments and unfurl speculative branches. Each selection reveals a vignette imagined by a
          custom diffusion model blending historical research with generative storytelling.
        </p>
      </header>

      <div className="timeline-wrapper">
        <div className="timeline-track">
          <div className="timeline-markers">
            <div className="timeline-line" aria-hidden />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              {timelineEvents.map((event) => (
                <button
                  key={event.id}
                  className={`marker-button${event.id === selectedEvent.id ? " active" : ""}`}
                  onClick={() => {
                    setSelectedEventId(event.id);
                    setSelectedCounterfactualId(event.counterfactuals[0].id);
                  }}
                >
                  <span />
                  <span>
                    {event.year}
                    <br />
                    {event.title}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="timeline-details">
            <article className="card">
              <h3>{selectedEvent.title}</h3>
              <p>{selectedEvent.description}</p>
            </article>

            <div className="counterfactual-grid">
              {selectedEvent.counterfactuals.map((branch) => (
                <button
                  key={branch.id}
                  className={`counterfactual-card${branch.id === selectedCounterfactual.id ? " active" : ""}`}
                  onClick={() => setSelectedCounterfactualId(branch.id)}
                >
                  <h4>{branch.title}</h4>
                  <p>{branch.summary}</p>
                </button>
              ))}
            </div>

            <div className="visual-panel">
              <div className="visual-scene" style={{ background: gradient }}>
                <span>{selectedCounterfactual.title}</span>
              </div>
              <p className="visual-description">{selectedCounterfactual.narrative}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TimelineScreen;
