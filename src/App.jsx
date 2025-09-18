import React from "https://esm.sh/react@18";
import { Routes, Route } from "https://esm.sh/react-router-dom@6?deps=react@18,react-dom@18";
import Navigation from "./components/Navigation.jsx";
import HomeScreen from "./screens/HomeScreen.jsx";
import TimelineScreen from "./screens/TimelineScreen.jsx";
import WorldExplorerScreen from "./screens/WorldExplorerScreen.jsx";

const App = () => {
  return (
    <div className="app">
      <Navigation />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/timeline" element={<TimelineScreen />} />
          <Route path="/worlds" element={<WorldExplorerScreen />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
