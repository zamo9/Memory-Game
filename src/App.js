import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const PAIRS = 6; // at least 6 pairs
const TILE_FLIP_DELAY = 900; // ms

function shuffle(array) {
  // Fisher-Yates shuffle (stable, better than sort trick)
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeTiles() {
  // numbers 1..PAIRS, two tiles each
  const tiles = [];
  for (let i = 1; i <= PAIRS; i++) {
    tiles.push({ id: `${i}-a`, value: i });
    tiles.push({ id: `${i}-b`, value: i });
  }
  return shuffle(tiles);
}

function Tile({ tile, onActivate, flipped, matched, index }) {
  // keyboard: activate on Enter / Space
  return (
    <button
      className={`tile ${flipped || matched ? 'flipped' : ''}`}
      onClick={() => onActivate(tile)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onActivate(tile);
        }
      }}
      aria-pressed={flipped || matched}
      aria-label={`Tile ${index + 1}`}
    >
      <div className="tile-inner">
        <div className="front" />
        <div className="back">{tile.value}</div>
      </div>
    </button>
  );
}

export default function App() {
  const [tiles, setTiles] = useState(makeTiles);
  const [first, setFirst] = useState(null);
  const [second, setSecond] = useState(null);
  const [matchesFound, setMatchesFound] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [startedAt, setStartedAt] = useState(null);
  const [completed, setCompleted] = useState(false);
  const lockRef = useRef(false);

  useEffect(() => {
    // when first flip occurs -> dispatch bm_game_start
    if (startedAt === null && (first || second)) {
      setStartedAt(Date.now());
      window.dispatchEvent(new CustomEvent('bm_game_start'));
    }
  }, [first, second, startedAt]);

  useEffect(() => {
    if (!first || !second) return;

    lockRef.current = true;
    const a = first;
    const b = second;

    // increment attempts on each pair flip
    setAttempts((prev) => prev + 1);

    if (a.value === b.value) {
      // match
      setMatchesFound((prev) => {
        const next = prev + 1;
        // dispatch pair match event
        window.dispatchEvent(new CustomEvent('bm_pair_match', {
          detail: { pairsFound: next, attempts: attempts + 1 }
        }));
        return next;
      });

      // short delay to show match, then clear turn
      setTimeout(() => {
        setFirst(null);
        setSecond(null);
        lockRef.current = false;
      }, 300);
    } else {
      // not match -> flip back after delay
      setTimeout(() => {
        setFirst(null);
        setSecond(null);
        lockRef.current = false;
      }, TILE_FLIP_DELAY);
    }
  }, [first, second]); 

  useEffect(() => {
    if (matchesFound === PAIRS && startedAt) {
      const timeMs = Date.now() - startedAt;
      setCompleted(true);
      window.dispatchEvent(new CustomEvent('bm_game_complete', {
        detail: { attempts, timeMs }
      }));
    }
  }, [matchesFound, startedAt, attempts]);

  const handleActivate = (tile) => {
    if (lockRef.current) return;
    
    if (first && tile.id === first.id) return;

    if (!first) {
      setFirst(tile);
      return;
    }
    if (!second) {
      setSecond(tile);
      return;
    }
  };

  const isTileMatched = (tile) => {
    
    return false; 
  };

 
  return <MemoryApp
    tiles={tiles}
    setTiles={setTiles}
    first={first}
    setFirst={setFirst}
    second={second}
    setSecond={setSecond}
    attempts={attempts}
    setAttempts={setAttempts}
    matchesFound={matchesFound}
    setMatchesFound={setMatchesFound}
    startedAt={startedAt}
    setStartedAt={setStartedAt}
    completed={completed}
    setCompleted={setCompleted}
    lockRef={lockRef}
  />;
}


function MemoryApp(props) {
  // Unpack props
  const {
    tiles, setTiles,
    first, setFirst,
    second, setSecond,
    attempts, setAttempts,
    matchesFound, setMatchesFound,
    startedAt, setStartedAt,
    completed, setCompleted,
    lockRef
  } = props;

  // track which values have been permanently matched
  const [matchedValues, setMatchedValues] = useState([]);

  // handle activation with matchedValues support
  const handleActivate = (tile) => {
    if (lockRef.current) return;
    if (matchedValues.includes(tile.value)) return; // already matched permanent
    if (first && tile.id === first.id) return;
    if (!first) {
      setFirst(tile);
      if (!startedAt) {
        setStartedAt(Date.now());
        window.dispatchEvent(new CustomEvent('bm_game_start'));
      }
      return;
    }
    if (!second) {
      setSecond(tile);
      // increment attempts
      setAttempts((p) => p + 1);
    }
  };

  
  useEffect(() => {
    if (!first || !second) return;
    lockRef.current = true;
    if (first.value === second.value) {
      // match
      setMatchedValues((prev) => {
        const next = [...prev, first.value];
        window.dispatchEvent(new CustomEvent('bm_pair_match', {
          detail: { pairsFound: next.length, attempts: attempts }
        }));
        return next;
      });
      setTimeout(() => {
        setFirst(null);
        setSecond(null);
        lockRef.current = false;
      }, 300);
    } else {
      setTimeout(() => {
        setFirst(null);
        setSecond(null);
        lockRef.current = false;
      }, TILE_FLIP_DELAY);
    }
  }, [first, second]); 

  useEffect(() => {
    if (matchedValues.length === PAIRS && startedAt) {
      const timeMs = Date.now() - startedAt;
      setCompleted(true);
      window.dispatchEvent(new CustomEvent('bm_game_complete', {
        detail: { attempts, timeMs }
      }));
    }
  }, [matchedValues, startedAt, attempts, setCompleted]);

  const replay = () => {
    setTiles(makeTiles());
    setFirst(null); setSecond(null);
    setAttempts(0); setMatchedValues([]); setMatchesFound(0);
    setStartedAt(null); setCompleted(false);
  };

  const exitClick = () => {
    window.dispatchEvent(new CustomEvent('bm_exit_click'));
    
  };

  return (
    <div className="App">
      <h1>Memory — Numbers</h1>
      <div className="meta">
        <div>Attempts: {attempts}</div>
        <div>Pairs found: {matchedValues.length}/{PAIRS}</div>
      </div>

      <div className="grid" role="grid" aria-label="Memory tiles">
        {tiles.map((tile, idx) => {
          const flipped = (first && first.id === tile.id) || (second && second.id === tile.id);
          const matched = matchedValues.includes(tile.value);
          return (
            <Tile
              key={tile.id}
              tile={tile}
              onActivate={handleActivate}
              flipped={flipped}
              matched={matched}
              index={idx}
            />
          );
        })}
      </div>

      {matchedValues.length === PAIRS && (
        <div className="end-state" role="status" aria-live="polite">
          <p>All pairs found — well done!</p>
          <p>Attempts: {attempts}</p>
          <button className="replay" onClick={replay}>Replay</button>
          <button className="cta" onClick={exitClick}>Click here</button>
        </div>
      )}

      <footer className="app-footer">By Zamokuhle Mbonambi @2025</footer>
    </div>
  );
}