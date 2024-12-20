export interface Node {
  id: string;
  x: number;
  y: number;
  label?: string;
  color?: string;
  visited?: boolean;
  distance?: number;
  parent?: string;
}

export interface Edge {
  source: string;
  target: string;
  weight: number;
  color?: string;
}

export interface Graph {
  nodes: Node[];
  edges: Edge[];
}

export type GraphRepresentation = 'matrix' | 'list';

export interface AdjacencyList {
  [key: string]: Array<{
    target: string;
    weight: number;
  }>;
}

export interface AdjacencyMatrix {
  nodes: string[];
  matrix: number[][];
}

export type AlgorithmType = 
  | 'bfs'
  | 'dfs'
  | 'dijkstra'
  | 'betweenness'
  | 'tsp'
  | 'mst';

export interface AlgorithmStep {
  type: 'visit' | 'explore' | 'complete' | 'path';
  nodeId?: string;
  edgeIds?: string[];
  message: string;
} 