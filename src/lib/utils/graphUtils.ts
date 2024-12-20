export function hasCycle(edges: Array<{ source: string; target: string }>, startNode: string | null): boolean {
  if (!startNode) return false;
  
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(node: string): boolean {
    visited.add(node);
    recursionStack.add(node);

    const neighbors = edges
      .filter(e => e.source === node)
      .map(e => e.target);

    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (recursionStack.has(neighbor)) {
        return true;
      }
    }

    recursionStack.delete(node);
    return false;
  }

  return dfs(startNode);
}

export function findNextAvailableLabel(
  currentLabels: Set<string>,
  preferredLabel: string
): string {
  // If the preferred label is not taken, use it
  if (!currentLabels.has(preferredLabel)) {
    return preferredLabel;
  }

  // Convert existing labels to numbers, filtering out non-numeric values
  const usedNumbers = new Set(
    Array.from(currentLabels)
      .map(label => parseInt(label))
      .filter(num => !isNaN(num))
  );

  // Try numbers from -100 to 100
  for (let i = -100; i <= 100; i++) {
    if (!usedNumbers.has(i)) {
      return i.toString();
    }
  }

  // If no numbers are available, swap with the preferred label
  return preferredLabel;
}

export function findCycles(edges: Array<{ source: string; target: string }>): Array<{ source: string; target: string }> {
  const cycleEdges = new Set<string>();
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const nodeMap = new Map<string, string[]>();

  // Build adjacency list
  edges.forEach(({ source, target }) => {
    if (!nodeMap.has(source)) nodeMap.set(source, []);
    nodeMap.get(source)!.push(target);
  });

  function dfs(node: string, parent: string | null = null): boolean {
    visited.add(node);
    recursionStack.add(node);

    const neighbors = nodeMap.get(node) || [];
    for (const neighbor of neighbors) {
      if (neighbor === parent) continue;
      
      const edgeKey = `${node}-${neighbor}`;
      if (!visited.has(neighbor)) {
        if (dfs(neighbor, node)) {
          cycleEdges.add(edgeKey);
          return true;
        }
      } else if (recursionStack.has(neighbor)) {
        cycleEdges.add(edgeKey);
        return true;
      }
    }

    recursionStack.delete(node);
    return false;
  }

  // Start DFS from each unvisited node
  Array.from(nodeMap.keys()).forEach(node => {
    if (!visited.has(node)) {
      dfs(node);
    }
  });

  // Convert edge keys back to edge objects
  return edges.filter(edge => 
    cycleEdges.has(`${edge.source}-${edge.target}`) ||
    cycleEdges.has(`${edge.target}-${edge.source}`)
  );
}

export function makeAcyclic(edges: Array<{ source: string; target: string }>): Array<{ source: string; target: string }> {
  const edgesToRemove = findCycles(edges);
  return edges.filter(edge => 
    !edgesToRemove.some(e => 
      (e.source === edge.source && e.target === edge.target) ||
      (e.source === edge.target && e.target === edge.source)
    )
  );
} 