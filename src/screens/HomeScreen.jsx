import React from "https://esm.sh/react@18";
import { Link } from "https://esm.sh/react-router-dom@6?deps=react@18,react-dom@18";

const experiences = [
  {
    title: "Counterfactual Timeline",
    description:
      "Travel along curated historical moments, then branch off to see alternate realities illustrated with AI imagery.",
    path: "/timeline",
  },
  {
    title: "World Explorer",
    description:
      "Jump across continents and eras, remixing geography with speculative futures rendered by neural artists.",
    path: "/worlds",
  },
  {
    title: "Coming Soon",
    description:
      "Generative galleries, audio-reactive poetry, collaborative sketchpads, and more experiments in machine-made myth.",
    path: "/",
  },
];

const HomeScreen = () => {
  return (
    <section className="home-screen">
      <div className="hero">
        <div>
          <h1>AI Art Atlas</h1>
          <p>
            A living museum where machine imagination collides with human history. Wander through branching timelines,
            discover speculative geographies, and expand your sense of what the past and future could look like.
          </p>
          <Link className="hero-cta" to="/timeline">
            Start Exploring
          </Link>
        </div>
        <div className="showcase-grid">
          {experiences.map((experience) => (
            <article key={experience.title} className="card">
              <h3>{experience.title}</h3>
              <p>{experience.description}</p>
              <Link to={experience.path} aria-label={`Open ${experience.title}`}>
                Explore →
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeScreen;
