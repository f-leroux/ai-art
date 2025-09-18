import React, { useMemo, useState, useEffect, useLayoutEffect, useRef } from "https://esm.sh/react@18";

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

  // Shared styling for timeline + branch
  const LINE_THICKNESS = 8;
  const LINE_COLOR = "#C9CBD6"; // opaque so it matches exactly regardless of background
  const DOT_BORDER = Math.max(2, Math.floor(LINE_THICKNESS / 2));

  // Animation + layout refs/state
  const trackRef = useRef(null);
  const pathRef = useRef(null);
  const markerDotRefs = useRef({});
  const [trackWidth, setTrackWidth] = useState(0);
  const [trackHeight, setTrackHeight] = useState(0);
  const [branchAnim, setBranchAnim] = useState({ key: 0, startX: 0, startY: 0, direction: 1 });
  const [hasInteracted, setHasInteracted] = useState(false);

  useLayoutEffect(() => {
    const update = () => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      setTrackWidth(rect.width);
      setTrackHeight(rect.height);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const branchPath = useMemo(() => {
    if (!trackWidth || !trackHeight) return "";
    const startX = Math.round(Math.max(8, Math.min(trackWidth - 8, branchAnim.startX)));
    const startY = Math.round(Math.max(8, Math.min(trackHeight - 8, branchAnim.startY)));
    const endX = Math.round(Math.max(8, Math.min(trackWidth - 12, startX + 160)));
    const endY = Math.round(Math.max(8, Math.min(trackHeight - 12, startY + 140)));
    return `M ${startX} ${startY} L ${startX} ${endY} L ${endX} ${endY}`;
  }, [branchAnim, trackWidth, trackHeight]);

  const branchEnd = useMemo(() => {
    if (!trackWidth || !trackHeight) return null;
    const startX = Math.round(Math.max(8, Math.min(trackWidth - 8, branchAnim.startX)));
    const startY = Math.round(Math.max(8, Math.min(trackHeight - 8, branchAnim.startY)));
    const endX = Math.round(Math.max(8, Math.min(trackWidth - 12, startX + 160)));
    const endY = Math.round(Math.max(8, Math.min(trackHeight - 12, startY + 140)));
    return { x: endX, y: endY };
  }, [branchAnim, trackWidth, trackHeight]);

  useEffect(() => {
    if (!pathRef.current) return;
    const path = pathRef.current;
    const length = path.getTotalLength();
    path.style.transition = "none";
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;
    // force reflow
    path.getBoundingClientRect();
    path.style.transition = "stroke-dashoffset 700ms ease-out";
    path.style.strokeDashoffset = "0";
  }, [branchAnim.key]);

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
        <div className="timeline-track" ref={trackRef} style={{ position: "relative" }}>
          {/* Base line layer as SVG for perfect match with branch */}
          <svg
            width="100%"
            height={trackHeight || 0}
            viewBox={`0 0 ${trackWidth} ${trackHeight || 0}`}
            preserveAspectRatio="none"
            style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }}
            aria-hidden
          >
            {trackWidth > 0 && trackHeight > 0 && (
              <path d={`M 8 ${Math.round(trackHeight / 2)} H ${Math.max(8, trackWidth - 8)}`} stroke={LINE_COLOR} strokeWidth={LINE_THICKNESS} strokeLinecap="round" fill="none" />
            )}
          </svg>

          <div className="timeline-markers" style={{ position: "relative", height: 96, zIndex: 3 }}>
            <div style={{ display: "flex", justifyContent: "space-between", height: "100%" }}>
              {timelineEvents.map((event) => (
                <button
                  key={event.id}
                  className={`marker-button`}
                  style={{
                    position: "relative",
                    background: "transparent",
                    border: 0,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                    color: "#ffffff",
                    height: "100%",
                    outline: "none",
                  }}
                  onClick={() => {
                    setSelectedEventId(event.id);
                    setSelectedCounterfactualId(event.counterfactuals[0].id);
                    setHasInteracted(true);
                    if (trackRef.current) {
                      const trackRect = trackRef.current.getBoundingClientRect();
                      const dotEl = markerDotRefs.current[event.id];
                      const dotRect = dotEl ? dotEl.getBoundingClientRect() : null;
                      const startX = dotRect ? Math.round(dotRect.left + dotRect.width / 2 - trackRect.left) : 0;
                      const startY = dotRect ? Math.round(dotRect.top + dotRect.height / 2 - trackRect.top) : 0;
                      const direction = startX < trackRect.width / 2 ? 1 : -1;
                      setBranchAnim({ key: Date.now(), startX, startY, direction });
                    }
                  }}
                >
                  <span style={{ position: "absolute", left: "50%", bottom: "calc(50% + 30px)", transform: "translateX(-50%)", fontSize: 12, lineHeight: 1, color: "#ffffff", pointerEvents: "none" }}>{event.year}</span>
                  <span
                    ref={(el) => {
                      markerDotRefs.current[event.id] = el;
                    }}
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(0%, -115%)",
                      width: LINE_THICKNESS * 2,
                      height: LINE_THICKNESS * 2,
                      borderRadius: 9999,
                      backgroundColor: "#0b0b0c",
                      border: `${DOT_BORDER}px solid #ffffff`,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                    }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Branch animation overlay spanning the whole track */}
          {hasInteracted && branchPath && (
            <svg
              key={branchAnim.key}
              width="100%"
              height={trackHeight || 0}
              viewBox={`0 0 ${trackWidth} ${trackHeight || 0}`}
              preserveAspectRatio="none"
              style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 2 }}
              aria-hidden
            >
              <path
                ref={pathRef}
                d={branchPath}
                stroke={LINE_COLOR}
                strokeWidth={LINE_THICKNESS}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              {branchEnd && (
                <circle cx={branchEnd.x} cy={branchEnd.y} r={LINE_THICKNESS*0.8} fill="#0b0b0c" stroke="#ffffff" strokeWidth={DOT_BORDER} />
              )}
            </svg>
          )}
        </div>
      </div>

      {hasInteracted && (
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
      )}
    </section>
  );
};

export default TimelineScreen;
