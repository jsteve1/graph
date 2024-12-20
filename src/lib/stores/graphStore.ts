import { writable, derived, type Readable } from 'svelte/store';
import type { Graph, Node, Edge, AdjacencyList, AdjacencyMatrix, GraphRepresentation } from '$lib/types/graph';

function createGraphStore() {
  const graphStore = writable<Graph>({
    nodes: [],
    edges: []
  });

  const representation = writable<GraphRepresentation>('list');

  // Convert graph to adjacency list
  const adjacencyList = derived<Readable<Graph>, AdjacencyList>(
    graphStore,
    ($graph) => {
      const list: AdjacencyList = {};
      $graph.nodes.forEach((node: Node) => {
        list[node.id] = [];
      });
      
      $graph.edges.forEach((edge: Edge) => {
        list[edge.source].push({
          target: edge.target,
          weight: edge.weight
        });
        // For undirected graphs, add the reverse edge
        list[edge.target].push({
          target: edge.source,
          weight: edge.weight
        });
      });
      
      return list;
    }
  );

  // Convert graph to adjacency matrix
  const adjacencyMatrix = derived<Readable<Graph>, AdjacencyMatrix>(
    graphStore,
    ($graph) => {
      const nodes = $graph.nodes.map(n => n.id);
      const matrix: number[][] = Array(nodes.length)
        .fill(0)
        .map(() => Array(nodes.length).fill(Infinity));
      
      // Set diagonal to 0
      nodes.forEach((_: string, i: number) => {
        matrix[i][i] = 0;
      });
      
      $graph.edges.forEach((edge: Edge) => {
        const sourceIdx = nodes.indexOf(edge.source);
        const targetIdx = nodes.indexOf(edge.target);
        matrix[sourceIdx][targetIdx] = edge.weight;
        matrix[targetIdx][sourceIdx] = edge.weight; // For undirected graphs
      });
      
      return {
        nodes,
        matrix
      };
    }
  );

  return {
    subscribe: graphStore.subscribe,
    representation: {
      subscribe: representation.subscribe,
      set: representation.set
    },
    adjacencyList: {
      subscribe: adjacencyList.subscribe
    },
    adjacencyMatrix: {
      subscribe: adjacencyMatrix.subscribe
    },
    addNode: (node: Node) => graphStore.update(graph => ({
      ...graph,
      nodes: [...graph.nodes, node]
    })),
    updateNode: (id: string, updates: Partial<Node>) => graphStore.update(graph => ({
      ...graph,
      nodes: graph.nodes.map(n => n.id === id ? { ...n, ...updates } : n)
    })),
    removeNode: (id: string) => graphStore.update(graph => ({
      ...graph,
      nodes: graph.nodes.filter(n => n.id !== id),
      edges: graph.edges.filter(e => e.source !== id && e.target !== id)
    })),
    addEdge: (edge: Edge) => graphStore.update(graph => ({
      ...graph,
      edges: [...graph.edges, edge]
    })),
    updateEdge: (source: string, target: string, updates: Partial<Edge>) => graphStore.update(graph => ({
      ...graph,
      edges: graph.edges.map(e => 
        (e.source === source && e.target === target) ||
        (e.source === target && e.target === source)
          ? { ...e, ...updates }
          : e
      )
    })),
    removeEdge: (source: string, target: string) => graphStore.update(graph => ({
      ...graph,
      edges: graph.edges.filter(e => 
        !(e.source === source && e.target === target) &&
        !(e.source === target && e.target === source)
      )
    })),
    clear: () => graphStore.set({ nodes: [], edges: [] }),
    reset: () => graphStore.update(graph => ({
      ...graph,
      nodes: graph.nodes.map(n => ({
        ...n,
        color: undefined,
        visited: undefined,
        distance: undefined,
        parent: undefined
      })),
      edges: graph.edges.map(e => ({
        ...e,
        color: undefined
      }))
    }))
  };
}

export const graph = createGraphStore(); 