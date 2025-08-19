// src/App.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { haversineDistance, runPrimsAlgorithm } from './lib/logic';

interface Village {
  id: number;
  name: string;
  lat: number;
  lon: number;
  population: number;
}

function FitBounds({ villages }: { villages: Village[] }) {
  const map = useMap();
  useEffect(() => {
    if (villages.length === 0) return;
    const bounds = villages.map(v => [v.lat, v.lon] as [number, number]);
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [villages, map]);
  return null;
}

function LocationSearch({ onSelect, placeholder }: { onSelect: (location: any) => void; placeholder: string; }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      return;
    }
    const handler = setTimeout(async () => {
      setIsLoading(true);
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=5`);
      const data = await response.json();
      setResults(data);
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(handler);
  }, [query]);

  const handleSelect = (location: any) => {
    onSelect(location);
    setQuery("");
    setResults([]);
  };

  return (
    <div className="relative">
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full p-2 mt-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
      />
      {isLoading && <p className="p-2 text-slate-500">Searching...</p>}
      {results.length > 0 && (
        <ul className="absolute w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg z-10">
          {results.map((loc: any) => (
            <li
              key={loc.osm_id}
              onClick={() => handleSelect(loc)}
              className="p-2 border-b border-slate-100 cursor-pointer hover:bg-slate-50"
            >
              {loc.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


function App() {
  const [startNode, setStartNode] = useState<Village | null>(null);
  const [otherNodes, setOtherNodes] = useState<Village[]>([]);
  const villages = useMemo(() => (startNode ? [startNode, ...otherNodes] : otherNodes), [startNode, otherNodes]);
  
  const [animationStep, setAnimationStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleSelectStartNode = (location: any) => {
    setStartNode({
      id: location.osm_id,
      name: location.display_name.split(',')[0],
      lat: parseFloat(location.lat),
      lon: parseFloat(location.lon),
      population: 100000,
    });
  };

  const handleSelectOtherNode = (location: any) => {
    if (otherNodes.length >= 4) { // 4 other nodes + 1 start node = 5 total
      alert("You can add a maximum of 4 other locations.");
      return;
    }
    const newNode: Village = {
      id: location.osm_id,
      name: location.display_name.split(',')[0],
      lat: parseFloat(location.lat),
      lon: parseFloat(location.lon),
      population: 100000,
    };
    setOtherNodes([...otherNodes, newNode]);
  };

  const clearAll = () => {
    setStartNode(null);
    setOtherNodes([]);
    handleReset();
  };

  const { mstEdges, animationSequence } = useMemo(() => {
    if (villages.length < 2 || !startNode) return { mstEdges: [], animationSequence: [] };
    const allPossibleEdges = [];
    for (let i = 0; i < villages.length; i++) {
      for (let j = i + 1; j < villages.length; j++) {
        const fromVillage = villages[i];
        const toVillage = villages[j];
        const distance = haversineDistance(fromVillage.lat, fromVillage.lon, toVillage.lat, toVillage.lon);
        allPossibleEdges.push({ from: fromVillage.id, to: toVillage.id, weight: distance, distance: distance });
      }
    }
    const { mst, sequence } = runPrimsAlgorithm(villages, allPossibleEdges, startNode.id);
    return { mstEdges: mst, animationSequence: sequence };
  }, [villages, startNode]);
  
  useEffect(() => {
    if (isPlaying && animationStep < animationSequence.length) {
      const timer = setTimeout(() => { setAnimationStep(prev => prev + 1) }, 300);
      return () => clearTimeout(timer);
    }
  }, [isPlaying, animationStep, animationSequence]);

  const handlePlay = () => {
    if (animationStep >= animationSequence.length) { setAnimationStep(0) }
    setIsPlaying(true);
  };
  const handlePause = () => setIsPlaying(false);
  const handleReset = () => {
    setIsPlaying(false);
    setAnimationStep(0);
  };

  const edgesToDraw = animationSequence.slice(0, animationStep);
  const totalLength = edgesToDraw.reduce((sum, edge) => sum + (edge.distance || edge.weight), 0);

  return (
    <div className="flex h-screen">
      <aside className="w-96 flex flex-col bg-slate-50 border-r border-slate-200 p-4">
        <h1 className="text-2xl font-bold text-slate-800">Prim's Algorithm Planner</h1>

        <div className="mt-4 border-2 border-blue-500 rounded-lg p-3 bg-white shadow-sm">
          <h2 className="font-semibold text-slate-700">1. Choose Starting Location</h2>
          {startNode ? (
            <p className="mt-2 text-lg">📍 <span className="font-bold text-blue-600">{startNode.name}</span> (Start)</p>
          ) : (
            <LocationSearch onSelect={handleSelectStartNode} placeholder="Search for a start point..." />
          )}
        </div>

        <div className="mt-4">
          <h2 className="font-semibold text-slate-700">2. Add Other Locations ({otherNodes.length}/4)</h2>
          {startNode ? (
            <LocationSearch onSelect={handleSelectOtherNode} placeholder="Search for other points..." />
          ) : (
            <p className="text-sm text-slate-500 mt-2">Please select a starting location first.</p>
          )}
          <ul className="mt-2 space-y-1">
            {otherNodes.map(v => (
              <li key={v.id} className="text-slate-800">📍 {v.name}</li>
            ))}
          </ul>
        </div>
        
        <button 
          onClick={clearAll} 
          className="mt-4 w-full bg-red-500 text-white font-semibold py-2 rounded-lg hover:bg-red-600 transition-colors"
        >
          Clear All
        </button>

        <div className="mt-auto pt-4 border-t border-slate-200">
          <div className="mb-4">
            <h2 className="font-semibold text-slate-700">Animation Controls</h2>
            <div className="flex space-x-2 mt-2">
              <button onClick={handlePlay} disabled={isPlaying || villages.length < 2} className="flex-1 bg-green-500 text-white font-semibold py-2 rounded-lg hover:bg-green-600 disabled:bg-slate-300 transition-colors">Play</button>
              <button onClick={handlePause} disabled={!isPlaying} className="flex-1 bg-yellow-500 text-white font-semibold py-2 rounded-lg hover:bg-yellow-600 disabled:bg-slate-300 transition-colors">Pause</button>
              <button onClick={handleReset} className="flex-1 bg-gray-500 text-white font-semibold py-2 rounded-lg hover:bg-gray-600 transition-colors">Reset</button>
            </div>
          </div>
          <div>
            <h2 className="font-semibold text-slate-700">Network Insights</h2>
            <div className="mt-2 p-3 bg-white rounded-lg shadow-sm">
              <p className="text-slate-600">Connections: <span className="font-bold text-slate-800">{animationStep} / {mstEdges.length}</span></p>
              <p className="text-slate-600">Total Length: <strong className="text-slate-800">{totalLength.toFixed(2)} km</strong></p>
            </div>
          </div>
        </div>
      </aside>
      
      <main className="flex-1">
        <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' />
          <FitBounds villages={villages} />
          {edgesToDraw.map(edge => {
            const fromVillage = villages.find(v => v.id === edge.from)!;
            const toVillage = villages.find(v => v.id === edge.to)!;
            if (!fromVillage || !toVillage) return null;
            return <Polyline key={`${edge.from}-${edge.to}`} positions={[[fromVillage.lat, fromVillage.lon], [toVillage.lat, toVillage.lon]]} color="limegreen" weight={3} />;
          })}
          {villages.map(village => (
            <CircleMarker key={village.id} center={[village.lat, village.lon]} radius={8} color={village.id === startNode?.id ? 'crimson' : 'royalblue'} fillOpacity={0.7}>
              <Tooltip>{village.name}{village.id === startNode?.id ? ' (Start)' : ''}</Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>
      </main>
    </div>
  );
}

export default App;