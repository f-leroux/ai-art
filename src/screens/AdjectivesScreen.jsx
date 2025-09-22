import React, { useState, useEffect } from "https://esm.sh/react@18";

const AdjectivesScreen = () => {
  const [adjectives, setAdjectives] = useState([]);
  const [selectedAdjective, setSelectedAdjective] = useState("cozy");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load the adjectives from the text file
    fetch("/images/adjectives/adjectives.txt")
      .then(response => response.text())
      .then(text => {
        const adjectiveList = text.split('\n').filter(adj => adj.trim() !== '');
        setAdjectives(adjectiveList);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error loading adjectives:", error);
        setLoading(false);
      });
  }, []);

  const handleAdjectiveClick = (adjective) => {
    setSelectedAdjective(adjective);
  };

  const getImagePath = (adjective) => {
    return `/images/adjectives/house_variations/${adjective}.png`;
  };

  if (loading) {
    return (
      <section className="adjectives-screen">
        <div className="loading">Loading adjectives...</div>
      </section>
    );
  }

  return (
    <section className="adjectives-screen">
      <div className="adjectives-hero">
        <h1>House of Adjectives</h1>
        <p>
          Click on any adjective to transform the house. 
          Watch as AI reimagines architecture through the lens of language.
        </p>
      </div>

      <div className="adjectives-layout">
        <div className="adjectives-side adjectives-left">
          {Array.from({length: 4}, (_, colIndex) => (
            <div key={colIndex} className="adjectives-column">
              {adjectives.slice(colIndex * 10, (colIndex + 1) * 10).map((adjective) => (
                <button
                  key={adjective}
                  className={`adjective-button ${selectedAdjective === adjective ? 'active' : ''}`}
                  onClick={() => handleAdjectiveClick(adjective)}
                >
                  {adjective}
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="house-display">
          <div className="house-container">
            <img 
              src={getImagePath(selectedAdjective)} 
              alt={`${selectedAdjective} house`}
              className="house-image"
              onError={(e) => {
                // Fallback to cozy if the selected image doesn't exist
                if (selectedAdjective !== "cozy") {
                  setSelectedAdjective("cozy");
                }
              }}
            />
          </div>
          <div className="current-adjective">
            <span>{selectedAdjective}</span>
          </div>
        </div>

        <div className="adjectives-side adjectives-right">
          {Array.from({length: 4}, (_, colIndex) => (
            <div key={colIndex} className="adjectives-column">
              {adjectives.slice(40 + colIndex * 10, 40 + (colIndex + 1) * 10).map((adjective) => (
                <button
                  key={adjective}
                  className={`adjective-button ${selectedAdjective === adjective ? 'active' : ''}`}
                  onClick={() => handleAdjectiveClick(adjective)}
                >
                  {adjective}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AdjectivesScreen; 