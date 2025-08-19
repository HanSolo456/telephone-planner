import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import Papa from 'papaparse';
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

function LocationSearch({ onSelect, placeholder, disabled }: { onSelect: (location: any) => void; placeholder: string; disabled: boolean }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      return;
    }
    const handler = setTimeout(async () => {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=5`);
      const data = await response.json();
      setResults(data);
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
      <input disabled={disabled} type="text" placeholder={placeholder} value={query} onChange={(e) => setQuery(e.target.value)} className="w-full p-2 mt-2 border border-slate-300 rounded-lg outline-none disabled:bg-slate-200" />
      {results.length > 0 && (
        <ul className="absolute w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg z-10">
          {results.map((loc: any) => <li key={loc.osm_id} onClick={() => handleSelect(loc)} className="p-2 border-b border-slate-100 cursor-pointer hover:bg-slate-50">{loc.display_name}</li>)}
        </ul>
      )}
    </div>
  );
}

function App() {
  const [mode, setMode] = useState<'search' | 'csv'>('search');
  
  const [searchOtherNodes, setSearchOtherNodes] = useState<Village[]>([]);
  const [searchStartNodeId, setSearchStartNodeId] = useState<number | null>(null);
  
  const [csvData, setCsvData] = useState<Village[]>([]);
  const [csvStartNodeId, setCsvStartNodeId] = useState<number | null>(null);

  const [villages, setVillages] = useState<Village[]>([]);
  const [startNodeId, setStartNodeId] = useState<number | null>(null);
  
  const [animationStep, setAnimationStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleSelectSearchNode = (loc: any) => {
    if (searchOtherNodes.length >= 5) return;
    setSearchOtherNodes([...searchOtherNodes, { id: loc.osm_id, name: loc.display_name.split(',')[0], lat: parseFloat(loc.lat), lon: parseFloat(loc.lon), population: 100000 }]);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        dynamicTyping: false,
        complete: (results) => {
          const mappedData: Village[] = (results.data as any[]).map(row => {
            const id = Number(row['Id']);
            const name = row['Village'] || '';
            const lat = Number(row['Latitude']);
            const lon = Number(row['Longitude']);
            let populationRaw = row['Estimated Population (Approx.)'] || '0';
            if (typeof populationRaw === 'string') {
              populationRaw = populationRaw.replace(/,/g, '');
            }
            const population = Number(populationRaw);
            return { id, name, lat, lon, population };
          }).filter(v => !isNaN(v.id) && v.name && !isNaN(v.lat) && !isNaN(v.lon) && !isNaN(v.population));
          setCsvData(mappedData);
        },
      });
    }
  };
  
  const handleStartAlgorithm = () => {
    setIsPlaying(false);
    setAnimationStep(0);
    if (mode === 'csv' && csvData.length > 0 && csvStartNodeId) {
      setVillages(csvData);
      setStartNodeId(csvStartNodeId);
    } else if (mode === 'search' && searchOtherNodes.length > 0 && searchStartNodeId) {
      setVillages(searchOtherNodes);
      setStartNodeId(searchStartNodeId);
    } else {
      alert("Please select your locations and a starting point.");
      setVillages([]);
      setStartNodeId(null);
    }
  };

  const { animationSequence } = useMemo(() => {
    if (villages.length < 2 || !startNodeId) return { animationSequence: [] };
    const allPossibleEdges = [];
    for (let i = 0; i < villages.length; i++) {
      for (let j = i + 1; j < villages.length; j++) {
        const v1 = villages[i]; const v2 = villages[j];
        const distance = haversineDistance(v1.lat, v1.lon, v2.lat, v2.lon);
        allPossibleEdges.push({ from: v1.id, to: v2.id, weight: distance, distance: distance });
      }
    }
    const { sequence } = runPrimsAlgorithm(villages, allPossibleEdges, startNodeId);
    return { animationSequence: sequence };
  }, [villages, startNodeId]);
  
  useEffect(() => {
    if (isPlaying && animationStep < animationSequence.length) {
      const timer = setTimeout(() => { setAnimationStep(prev => prev + 1) }, 300);
      return () => clearTimeout(timer);
    }
  }, [isPlaying, animationStep, animationSequence]);

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleReset = () => {
    setIsPlaying(false);
    setAnimationStep(0);
    setVillages([]);
    setSearchOtherNodes([]);
    setSearchStartNodeId(null);
    setCsvData([]);
    setCsvStartNodeId(null);
    setStartNodeId(null);
  };
  
  const edgesToDraw = animationSequence.slice(0, animationStep);
  const totalLength = edgesToDraw.reduce((sum, edge) => sum + (edge.distance || 0), 0);

  const canStart =
    (mode === 'csv' && csvData.length > 0 && csvStartNodeId !== null) ||
    (mode === 'search' && searchOtherNodes.length > 0 && searchStartNodeId !== null);

  return (
    <div className="flex h-screen">
      <aside className="w-96 flex flex-col bg-slate-50 border-r border-slate-200 p-4">
        <h1 className="text-2xl font-bold text-slate-800">Prim's Algorithm Planner</h1>

        <div className="mt-4">
          <h2 className="font-semibold text-slate-700">1. Choose Input Method</h2>
          <div className="flex space-x-4 mt-2">
            <label className="cursor-pointer">
              <input type="radio" name="mode" value="search" checked={mode === 'search'} onChange={() => setMode('search')} className="mr-1" /> Search Places
            </label>
            <label className="cursor-pointer">
              <input type="radio" name="mode" value="csv" checked={mode === 'csv'} onChange={() => setMode('csv')} className="mr-1" /> Upload CSV
            </label>
          </div>
        </div>

        {/* Search Mode UI */}
        <div className={`mt-4 p-3 rounded-lg border ${mode === 'search' ? 'border-blue-500 bg-white' : 'border-transparent bg-gray-100 opacity-50'}`}>
          <h2 className="font-semibold text-slate-700 mb-2">Search Locations</h2>
          <div className="mb-2">
            <LocationSearch onSelect={handleSelectSearchNode} placeholder={`Search places to add... (${searchOtherNodes.length}/5)`} disabled={mode !== 'search'} />
          </div>
          {searchOtherNodes.length > 0 && (
            <div className="mt-2 p-2 bg-slate-100 rounded-lg max-h-40 overflow-y-auto border border-slate-300">
              <h3 className="font-semibold mb-1">Select Starting Node:</h3>
              {searchOtherNodes.map((v) => (
                <label key={v.id} className="flex items-center space-x-2 mb-1 cursor-pointer">
                  <input
                    type="radio"
                    name="searchStartNode"
                    value={v.id}
                    checked={searchStartNodeId === v.id}
                    onChange={() => setSearchStartNodeId(v.id)}
                    disabled={mode !== 'search'}
                  />
                  <span>📍 {v.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        
        {/* CSV Mode UI */}
        <div className={`mt-4 p-3 rounded-lg border ${mode === 'csv' ? 'border-blue-500 bg-white' : 'border-transparent bg-gray-100 opacity-50'}`}>
          <h2 className="font-semibold text-slate-700">Upload Locations</h2>
          <div className="mt-2 p-2 border border-slate-300 rounded-lg bg-white">
            <input type="file" accept=".csv" onChange={handleFileUpload} disabled={mode !== 'csv'} className="w-full text-sm" />
          </div>
          
          {mode === 'csv' && csvData.length > 0 && (
            <div className="mt-2">
              <h3 className="font-semibold">Select Starting Node:</h3>
              <div className="mt-2 space-y-1 bg-slate-100 p-2 rounded-lg max-h-32 overflow-y-auto border border-slate-300">
                {csvData.map(v => (
                  <label key={v.id} className="block cursor-pointer">
                    <input type="radio" name="startNode" value={v.id} onChange={() => setCsvStartNodeId(v.id)} checked={csvStartNodeId === v.id} /> {v.name}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <button
          onClick={handleStartAlgorithm}
          className={`mt-4 w-full font-bold py-3 rounded-lg transition-colors ${
            canStart
              ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
              : 'bg-blue-300 text-white cursor-not-allowed'
          }`}
          disabled={!canStart}
        >
          Select Start Node
        </button>
        
        <div className="mt-auto pt-4 border-t border-slate-200">
          <div className="mb-4">
            <h2 className="font-semibold text-slate-700">Animation Controls</h2>
            <div className="flex space-x-2 mt-2">
              <button
                onClick={handlePlay}
                disabled={isPlaying || villages.length < 2}
                className={`px-4 py-2 rounded-lg font-semibold border transition-colors ${
                  isPlaying || villages.length < 2
                    ? 'bg-gray-300 border-gray-300 cursor-not-allowed text-gray-600'
                    : 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700 hover:border-blue-700 cursor-pointer'
                }`}
              >
                Play
              </button>
              <button
                onClick={handlePause}
                disabled={!isPlaying}
                className={`px-4 py-2 rounded-lg font-semibold border transition-colors ${
                  !isPlaying
                    ? 'bg-gray-300 border-gray-300 cursor-not-allowed text-gray-600'
                    : 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700 hover:border-blue-700 cursor-pointer'
                }`}
              >
                Pause
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-lg font-semibold border border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:border-blue-700 cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>
          <div>
            <h2 className="font-semibold text-slate-700">Network Insights</h2>
            <div className="mt-2 p-3 bg-white rounded-lg">
              <p>Connections: {animationStep} / {animationSequence.length}</p>
              <p>Total Length: <strong>{totalLength.toFixed(2)} km</strong></p>
            </div>
          </div>
        </div>
      </aside>
      
      <main className="flex-1">
        <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' />
          <FitBounds villages={villages} />
          {edgesToDraw.map(edge => {
            const from = villages.find(v => v.id === edge.from)!; const to = villages.find(v => v.id === edge.to)!;
            return <Polyline key={`${edge.from}-${edge.to}`} positions={[[from.lat, from.lon], [to.lat, to.lon]]} color="limegreen" weight={3} />;
          })}
          {villages.map(v => (
  <CircleMarker
    key={`${v.id}-${startNodeId ?? 'none'}`} // force remount when start changes
    center={[v.lat, v.lon]}
    radius={8}
    pathOptions={{
      color: v.id === startNodeId ? 'crimson' : 'royalblue',
      fillColor: v.id === startNodeId ? 'crimson' : 'royalblue',
      weight: 2
    }}
    fillOpacity={0.7}
  >
    <Tooltip>
      {v.name}{v.id === startNodeId ? ' (Start)' : ''}
    </Tooltip>
  </CircleMarker>
))}
        </MapContainer>
      </main>
    </div>
  );
}

export default App;