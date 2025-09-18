import React from "https://esm.sh/react@18";
import { NavLink } from "https://esm.sh/react-router-dom@6?deps=react@18,react-dom@18";

const Navigation = () => {
  return (
    <header className="top-bar">
      <nav className="nav">
        <div className="brand">
          <span>AI</span>
          <span>Atlas</span>
        </div>
        <div className="nav-links">
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/timeline">Counterfactual Timeline</NavLink>
          <NavLink to="/worlds">World Explorer</NavLink>
        </div>
      </nav>
    </header>
  );
};

export default Navigation;
