// src/lib/logic.ts

export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

interface Village {
  id: number;
  lat: number;
  lon: number;
}

interface Edge {
  from: number;
  to: number;
  weight: number;
  distance?: number;
}

export function runPrimsAlgorithm(villages: Village[], allEdges: Edge[], startNodeId?: number): { mst: Edge[], sequence: Edge[] } {
  if (villages.length === 0) return { mst: [], sequence: [] };

  const mst: Edge[] = [];
  const sequence: Edge[] = [];
  const visited = new Set<number>();

  const startingPoint = startNodeId ?? villages[0].id;
  visited.add(startingPoint);

  while (visited.size < villages.length) {
    let minEdge: Edge | null = null;
    for (const edge of allEdges) {
      const fromVisited = visited.has(edge.from);
      const toVisited = visited.has(edge.to);
      if ((fromVisited && !toVisited) || (!fromVisited && toVisited)) {
        if (minEdge === null || edge.weight < minEdge.weight) {
          minEdge = edge;
        }
      }
    }
    if (minEdge) {
      mst.push(minEdge);
      sequence.push(minEdge);
      visited.add(visited.has(minEdge.from) ? minEdge.to : minEdge.from);
    } else {
      break;
    }
  }

  return { mst, sequence };
}