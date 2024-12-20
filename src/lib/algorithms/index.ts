import type { AlgorithmStep } from '../stores/algorithmStore';
import type { Edge, Node } from '../types/graph';

interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

// Helper function to get node by label
function getNodeById(nodes: Node[], label: string): Node | undefined {
  return nodes.find(n => n.label === label || n.id === label);
}

// Helper function to get edges for a node
function getEdgesForNode(edges: Edge[], nodeId: string): Edge[] {
  return edges.filter(e => e.source === nodeId || e.target === nodeId);
}

// Helper function to get neighbor nodes
function getNeighbors(edges: Edge[], nodeId: string): string[] {
  return edges
    .filter(e => e.source === nodeId || e.target === nodeId)
    .map(e => e.source === nodeId ? e.target : e.source);
}

export function bfs(graph: GraphData, startLabel: string): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const startNode = getNodeById(graph.nodes, startLabel);
  if (!startNode) return steps;

  const visited = new Set<string>();
  const queue: string[] = [startNode.id];
  visited.add(startNode.id);

  steps.push({
    type: 'select',
    nodes: [startNode.id],
    edges: [],
    message: `Starting BFS from node ${startNode.label}`
  });

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const current = graph.nodes.find(n => n.id === currentId)!;
    
    steps.push({
      type: 'visit',
      nodes: [currentId],
      edges: [],
      message: `Visiting node ${current.label}`
    });

    const neighbors = getNeighbors(graph.edges, currentId);
    for (const neighborId of neighbors) {
      const neighbor = graph.nodes.find(n => n.id === neighborId)!;
      
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        queue.push(neighborId);
        
        steps.push({
          type: 'explore',
          nodes: [neighborId],
          edges: [{ source: currentId, target: neighborId }],
          message: `Discovered node ${neighbor.label} from ${current.label}`
        });
      } else {
        steps.push({
          type: 'skip',
          nodes: [neighborId],
          edges: [{ source: currentId, target: neighborId }],
          message: `Node ${neighbor.label} already visited`
        });
      }
    }

    steps.push({
      type: 'finish',
      nodes: [currentId],
      edges: [],
      message: `Finished processing node ${current.label}`
    });
  }

  return steps;
}

export function dfs(graph: GraphData, startLabel: string): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const startNode = getNodeById(graph.nodes, startLabel);
  if (!startNode) return steps;

  const visited = new Set<string>();

  steps.push({
    type: 'select',
    nodes: [startNode.id],
    edges: [],
    message: `Starting DFS from node ${startNode.label}`
  });

  function dfsVisit(nodeId: string) {
    const current = graph.nodes.find(n => n.id === nodeId)!;
    visited.add(nodeId);

    steps.push({
      type: 'visit',
      nodes: [nodeId],
      edges: [],
      message: `Visiting node ${current.label}`
    });

    const neighbors = getNeighbors(graph.edges, nodeId);
    for (const neighborId of neighbors) {
      const neighbor = graph.nodes.find(n => n.id === neighborId)!;
      
      if (!visited.has(neighborId)) {
        steps.push({
          type: 'explore',
          nodes: [neighborId],
          edges: [{ source: nodeId, target: neighborId }],
          message: `Exploring edge to node ${neighbor.label}`
        });
        dfsVisit(neighborId);
      } else {
        steps.push({
          type: 'skip',
          nodes: [neighborId],
          edges: [{ source: nodeId, target: neighborId }],
          message: `Node ${neighbor.label} already visited`
        });
      }
    }

    steps.push({
      type: 'finish',
      nodes: [nodeId],
      edges: [],
      message: `Finished exploring node ${current.label}`
    });
  }

  dfsVisit(startNode.id);
  return steps;
}

export function dijkstra(graph: GraphData, startLabel: string, endLabel: string): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const startNode = getNodeById(graph.nodes, startLabel);
  const endNode = getNodeById(graph.nodes, endLabel);
  if (!startNode || !endNode) return steps;

  const distances = new Map<string, number>();
  const previous = new Map<string, string>();
  const unvisited = new Set<string>();

  // Initialize distances
  for (const node of graph.nodes) {
    distances.set(node.id, Infinity);
    unvisited.add(node.id);
  }
  distances.set(startNode.id, 0);

  steps.push({
    type: 'select',
    nodes: [startNode.id],
    edges: [],
    message: `Starting Dijkstra's algorithm from node ${startNode.label}`
  });

  while (unvisited.size > 0) {
    // Find node with minimum distance
    let minDistance = Infinity;
    let current: string | null = null;
    
    for (const nodeId of unvisited) {
      const distance = distances.get(nodeId)!;
      if (distance < minDistance) {
        minDistance = distance;
        current = nodeId;
      }
    }

    if (!current || minDistance === Infinity) break;
    const currentNode = graph.nodes.find(n => n.id === current)!;

    steps.push({
      type: 'visit',
      nodes: [current],
      edges: [],
      message: `Visiting node ${currentNode.label} (distance: ${minDistance})`
    });

    if (current === endNode.id) {
      // Reconstruct path
      const path: string[] = [current];
      let prev = previous.get(current);
      while (prev) {
        path.unshift(prev);
        prev = previous.get(prev);
      }

      // Add path to steps
      for (let i = 0; i < path.length - 1; i++) {
        steps.push({
          type: 'finish',
          nodes: [path[i], path[i + 1]],
          edges: [{ source: path[i], target: path[i + 1] }],
          message: `Shortest path found! Total distance: ${minDistance}`
        });
      }
      break;
    }

    unvisited.delete(current);
    const edges = getEdgesForNode(graph.edges, current);

    for (const edge of edges) {
      const neighborId = edge.source === current ? edge.target : edge.source;
      if (!unvisited.has(neighborId)) continue;

      const neighbor = graph.nodes.find(n => n.id === neighborId)!;
      const newDistance = distances.get(current)! + edge.weight;

      steps.push({
        type: 'explore',
        nodes: [neighborId],
        edges: [{ source: current, target: neighborId }],
        message: `Checking distance to ${neighbor.label}: ${newDistance}`
      });

      if (newDistance < distances.get(neighborId)!) {
        distances.set(neighborId, newDistance);
        previous.set(neighborId, current);
        
        steps.push({
          type: 'select',
          nodes: [neighborId],
          edges: [{ source: current, target: neighborId }],
          message: `Updated distance to ${neighbor.label}: ${newDistance}`
        });
      } else {
        steps.push({
          type: 'skip',
          nodes: [neighborId],
          edges: [{ source: current, target: neighborId }],
          message: `Keeping current distance to ${neighbor.label}: ${distances.get(neighborId)}`
        });
      }
    }
  }

  return steps;
}

export function bellmanFord(graph: GraphData, startLabel: string, endLabel: string): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const startNode = getNodeById(graph.nodes, startLabel);
  const endNode = getNodeById(graph.nodes, endLabel);
  if (!startNode || !endNode) return steps;

  const distances = new Map<string, number>();
  const previous = new Map<string, string>();

  // Initialize distances
  for (const node of graph.nodes) {
    distances.set(node.id, Infinity);
  }
  distances.set(startNode.id, 0);

  steps.push({
    type: 'select',
    nodes: [startNode.id],
    edges: [],
    message: `Starting Bellman-Ford algorithm from node ${startNode.label}`
  });

  // Relax edges |V| - 1 times
  for (let i = 0; i < graph.nodes.length - 1; i++) {
    steps.push({
      type: 'visit',
      nodes: [],
      edges: [],
      message: `Starting iteration ${i + 1}`
    });

    for (const edge of graph.edges) {
      const sourceDistance = distances.get(edge.source)!;
      const targetDistance = distances.get(edge.target)!;
      const newDistance = sourceDistance + edge.weight;

      steps.push({
        type: 'explore',
        nodes: [edge.source, edge.target],
        edges: [{ source: edge.source, target: edge.target }],
        message: `Checking edge ${graph.nodes.find(n => n.id === edge.source)?.label} → ${graph.nodes.find(n => n.id === edge.target)?.label}`
      });

      if (sourceDistance !== Infinity && newDistance < targetDistance) {
        distances.set(edge.target, newDistance);
        previous.set(edge.target, edge.source);

        steps.push({
          type: 'select',
          nodes: [edge.target],
          edges: [{ source: edge.source, target: edge.target }],
          message: `Updated distance to ${graph.nodes.find(n => n.id === edge.target)?.label}: ${newDistance}`
        });
      }
    }
  }

  // Check for negative cycles
  for (const edge of graph.edges) {
    const sourceDistance = distances.get(edge.source)!;
    const targetDistance = distances.get(edge.target)!;
    
    if (sourceDistance !== Infinity && sourceDistance + edge.weight < targetDistance) {
      steps.push({
        type: 'finish',
        nodes: [edge.source, edge.target],
        edges: [{ source: edge.source, target: edge.target }],
        message: 'Negative cycle detected!'
      });
      return steps;
    }
  }

  // Reconstruct path to end node
  const path: string[] = [endNode.id];
  let current = endNode.id;
  while (previous.has(current)) {
    current = previous.get(current)!;
    path.unshift(current);
  }

  // Add path to steps
  for (let i = 0; i < path.length - 1; i++) {
    steps.push({
      type: 'finish',
      nodes: [path[i], path[i + 1]],
      edges: [{ source: path[i], target: path[i + 1] }],
      message: `Shortest path found! Total distance: ${distances.get(endNode.id)}`
    });
  }

  return steps;
}

export function kruskal(graph: GraphData): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  
  // Initialize disjoint set for each node
  const parent = new Map<string, string>();
  const rank = new Map<string, number>();

  function find(nodeId: string): string {
    if (!parent.has(nodeId)) {
      parent.set(nodeId, nodeId);
      rank.set(nodeId, 0);
      return nodeId;
    }
    
    if (parent.get(nodeId) !== nodeId) {
      parent.set(nodeId, find(parent.get(nodeId)!));
    }
    return parent.get(nodeId)!;
  }

  function union(x: string, y: string) {
    const rootX = find(x);
    const rootY = find(y);

    if (rootX !== rootY) {
      const rankX = rank.get(rootX)!;
      const rankY = rank.get(rootY)!;
      
      if (rankX < rankY) {
        parent.set(rootX, rootY);
      } else if (rankX > rankY) {
        parent.set(rootY, rootX);
      } else {
        parent.set(rootY, rootX);
        rank.set(rootX, rankX + 1);
      }
    }
  }

  // Sort edges by weight
  const sortedEdges = [...graph.edges].sort((a, b) => a.weight - b.weight);

  steps.push({
    type: 'select',
    nodes: [],
    edges: [],
    message: "Starting Kruskal's algorithm"
  });

  const mst: Edge[] = [];
  for (const edge of sortedEdges) {
    steps.push({
      type: 'explore',
      nodes: [edge.source, edge.target],
      edges: [{ source: edge.source, target: edge.target }],
      message: `Checking edge ${graph.nodes.find(n => n.id === edge.source)?.label} → ${graph.nodes.find(n => n.id === edge.target)?.label} (weight: ${edge.weight})`
    });

    if (find(edge.source) !== find(edge.target)) {
      union(edge.source, edge.target);
      mst.push(edge);
      
      steps.push({
        type: 'select',
        nodes: [edge.source, edge.target],
        edges: [{ source: edge.source, target: edge.target }],
        message: `Added edge to MST (total weight: ${mst.reduce((sum, e) => sum + e.weight, 0)})`
      });
    } else {
      steps.push({
        type: 'skip',
        nodes: [edge.source, edge.target],
        edges: [{ source: edge.source, target: edge.target }],
        message: 'Edge would create a cycle, skipping'
      });
    }
  }

  // Show final MST
  steps.push({
    type: 'finish',
    nodes: graph.nodes.map(n => n.id),
    edges: mst.map(e => ({ source: e.source, target: e.target })),
    message: `MST completed! Total weight: ${mst.reduce((sum, e) => sum + e.weight, 0)}`
  });

  return steps;
}

export function prim(graph: GraphData, startLabel: string): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const startNode = getNodeById(graph.nodes, startLabel);
  if (!startNode) return steps;

  const visited = new Set<string>();
  const mst: Edge[] = [];
  
  // Priority queue for edges (using array for simplicity)
  const pq: Array<{ source: string; target: string; weight: number }> = [];

  steps.push({
    type: 'select',
    nodes: [startNode.id],
    edges: [],
    message: "Starting Prim's algorithm"
  });

  // Add all edges from start node
  visited.add(startNode.id);
  const startEdges = getEdgesForNode(graph.edges, startNode.id);
  for (const edge of startEdges) {
    pq.push(edge);
  }

  while (pq.length > 0 && visited.size < graph.nodes.length) {
    // Get minimum weight edge
    pq.sort((a, b) => a.weight - b.weight);
    const edge = pq.shift()!;

    const target = !visited.has(edge.target) ? edge.target : 
                  !visited.has(edge.source) ? edge.source : null;

    if (!target) {
      steps.push({
        type: 'skip',
        nodes: [edge.source, edge.target],
        edges: [{ source: edge.source, target: edge.target }],
        message: 'Both nodes already in MST, skipping'
      });
      continue;
    }

    steps.push({
      type: 'explore',
      nodes: [edge.source, edge.target],
      edges: [{ source: edge.source, target: edge.target }],
      message: `Checking edge to ${graph.nodes.find(n => n.id === target)?.label} (weight: ${edge.weight})`
    });

    // Add edge to MST
    mst.push(edge);
    visited.add(target);

    steps.push({
      type: 'select',
      nodes: [target],
      edges: [{ source: edge.source, target: edge.target }],
      message: `Added node ${graph.nodes.find(n => n.id === target)?.label} to MST`
    });

    // Add all edges from new node
    const newEdges = getEdgesForNode(graph.edges, target);
    for (const newEdge of newEdges) {
      if (!visited.has(newEdge.source) || !visited.has(newEdge.target)) {
        pq.push(newEdge);
      }
    }
  }

  // Show final MST
  steps.push({
    type: 'finish',
    nodes: Array.from(visited),
    edges: mst.map(e => ({ source: e.source, target: e.target })),
    message: `MST completed! Total weight: ${mst.reduce((sum, e) => sum + e.weight, 0)}`
  });

  return steps;
} 