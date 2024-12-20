<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import Node from './Node.svelte';
  import Edge from './Edge.svelte';
  import { graph } from '$lib/stores/graphStore';
  import type { Node as NodeType } from '$lib/types/graph';
  import { hasCycle } from '$lib/utils/graphUtils';
  import { algorithmStore } from '$lib/stores/algorithmStore';

  export let width: number;
  export let height: number;
  export let directed: boolean = false;
  export let acyclic: boolean = false;
  export let maxEdgesPerNode: number = Infinity;
  export let selectedNode: string | null = null;
  export let selectedEdge: { source: string; target: string } | null = null;
  export let disabled: boolean = false;
  const dispatch = createEventDispatcher();

  let svg: SVGSVGElement;
  let draggingNode: string | null = null;
  let initialViewBox = { minX: -100, minY: -100, width: width + 200, height: height + 200 };
  let viewBox = { ...initialViewBox };

  // Calculate initial viewBox based on node positions
  $: {
    if ($graph.nodes.length > 0) {
      const padding = 100;
      const positions = $graph.nodes.map(n => ({ x: n.x, y: n.y }));
      
      // Find the bounds of all nodes
      const minX = Math.min(...positions.map(p => p.x));
      const maxX = Math.max(...positions.map(p => p.x));
      const minY = Math.min(...positions.map(p => p.y));
      const maxY = Math.max(...positions.map(p => p.y));
      
      // Calculate target size with padding
      const targetWidth = Math.max(width, maxX - minX + padding * 2);
      const targetHeight = Math.max(height, maxY - minY + padding * 2);
      const targetMinX = minX - padding;
      const targetMinY = minY - padding;
      
      // Apply very smooth damping to viewBox changes
      const damping = 0.05;
      viewBox = {
        minX: viewBox.minX + (targetMinX - viewBox.minX) * damping,
        minY: viewBox.minY + (targetMinY - viewBox.minY) * damping,
        width: viewBox.width + (targetWidth - viewBox.width) * damping,
        height: viewBox.height + (targetHeight - viewBox.height) * damping
      };
    }
  }

  // Bind selectedNode and selectedEdge for parent component
  $: if (selectedNode !== undefined) {
    dispatch('selectedNodeChange', selectedNode);
  }
  $: if (selectedEdge !== undefined) {
    dispatch('selectedEdgeChange', selectedEdge);
  }

  // Calculate distance between two points
  function calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.round(Math.sqrt(dx * dx + dy * dy) / 20); // Divide by 20 to scale the distance
  }

  // Calculate edge offset to prevent overlap
  function calculateEdgeOffset(source: string, target: string): { dx: number; dy: number } {
    const parallelEdges = $graph.edges.filter(e => 
      (e.source === source && e.target === target) ||
      (e.source === target && e.target === source)
    );
    
    if (parallelEdges.length <= 1) return { dx: 0, dy: 0 };
    
    const edgeIndex = parallelEdges.findIndex(e => 
      e.source === source && e.target === target
    );
    
    const offset = 10; // Base offset in pixels
    const angle = Math.PI / 4; // 45 degrees
    return {
      dx: Math.cos(angle) * offset * (edgeIndex - (parallelEdges.length - 1) / 2),
      dy: Math.sin(angle) * offset * (edgeIndex - (parallelEdges.length - 1) / 2)
    };
  }

  // Update edge weights based on node positions
  function updateEdgeWeights() {
    const edges = $graph.edges;
    const nodes = $graph.nodes;

    edges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      if (sourceNode && targetNode) {
        const weight = calculateDistance(sourceNode.x, sourceNode.y, targetNode.x, targetNode.y);
        if (weight !== edge.weight) {
          graph.updateEdge(edge.source, edge.target, { weight });
        }
      }
    });
  }

  // Handle node dragging
  function handleDragStart(event: CustomEvent<{ 
    id: string; 
    event: MouseEvent | TouchEvent; 
    rect: DOMRect;
    nodePos: { x: number; y: number };
  }>) {
    if (disabled) return;
    draggingNode = event.detail.id;
    const node = $graph.nodes.find(n => n.id === draggingNode);
    if (!node) return;

    const startEvent = event.detail.event;
    const containerRect = svg.getBoundingClientRect();
    const initialNodePos = event.detail.nodePos;
    
    // Calculate the SVG's scale factor
    const scaleX = containerRect.width / viewBox.width;
    const scaleY = containerRect.height / viewBox.height;

    // Get the initial cursor position
    const startX = startEvent instanceof MouseEvent ? startEvent.clientX : startEvent.touches[0].clientX;
    const startY = startEvent instanceof MouseEvent ? startEvent.clientY : startEvent.touches[0].clientY;

    // Calculate the initial offset in SVG coordinates
    const startPosX = (startX - containerRect.left) / scaleX + viewBox.minX;
    const startPosY = (startY - containerRect.top) / scaleY + viewBox.minY;
    const offsetX = startPosX - initialNodePos.x;
    const offsetY = startPosY - initialNodePos.y;

    console.log('Drag start:', {
      initialNodePos,
      startPos: { x: startPosX, y: startPosY },
      offset: { x: offsetX, y: offsetY },
      scale: { x: scaleX, y: scaleY }
    });

    function handleMove(e: MouseEvent | TouchEvent) {
      if (!draggingNode || !svg) return;

      const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
      const clientY = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;

      // Convert client coordinates to SVG coordinates
      const svgX = (clientX - containerRect.left) / scaleX + viewBox.minX - offsetX;
      const svgY = (clientY - containerRect.top) / scaleY + viewBox.minY - offsetY;

      // Update node position with minimal constraints
      graph.updateNode(draggingNode, {
        x: svgX,
        y: svgY
      });

      // Update edge weights while dragging
      updateEdgeWeights();
    }

    function handleEnd() {
      if (draggingNode) {
        updateEdgeWeights();
        draggingNode = null;
      }
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    }

    window.addEventListener('mousemove', handleMove, { passive: false });
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);
  }

  // Handle node selection
  function handleNodeSelect(event: CustomEvent<{ id: string }>) {
    if (disabled) return;
    const id = event.detail.id;
    selectedEdge = null; // Clear edge selection when selecting nodes
    
    if (selectedNode === null) {
      selectedNode = id;
    } else if (selectedNode === id) {
      selectedNode = null;
    } else {
      // Check if adding an edge would exceed the max edges per node
      const sourceEdges = $graph.edges.filter(e => 
        e.source === selectedNode || e.target === selectedNode
      ).length;
      const targetEdges = $graph.edges.filter(e => 
        e.source === id || e.target === id
      ).length;

      if (sourceEdges >= maxEdgesPerNode || targetEdges >= maxEdgesPerNode) {
        selectedNode = id;
        return;
      }

      // Check if adding the edge would create a cycle in acyclic mode
      if (acyclic) {
        const tempEdges = [...$graph.edges, { source: selectedNode, target: id }];
        if (selectedNode && hasCycle(tempEdges, selectedNode)) {
          // Flash the nodes red to indicate invalid edge
          const sourceNode = $graph.nodes.find(n => n.id === selectedNode);
          const targetNode = $graph.nodes.find(n => n.id === id);
          if (sourceNode && targetNode) {
            graph.updateNode(selectedNode, { color: 'red' });
            graph.updateNode(id, { color: 'red' });
            setTimeout(() => {
              if (selectedNode) {
                graph.updateNode(selectedNode, { color: undefined });
                graph.updateNode(id, { color: undefined });
              }
            }, 500);
          }
          selectedNode = id;
          return;
        }
      }

      // Create an edge between the two selected nodes
      const sourceNode = $graph.nodes.find(n => n.id === selectedNode);
      const targetNode = $graph.nodes.find(n => n.id === id);
      if (sourceNode && targetNode) {
        const weight = calculateDistance(sourceNode.x, sourceNode.y, targetNode.x, targetNode.y);
        graph.addEdge({
          source: selectedNode,
          target: id,
          weight
        });
      }
      selectedNode = null;
    }
  }

  // Handle edge selection
  function handleEdgeSelect(event: CustomEvent<{ source: string; target: string }>) {
    if (disabled) return;
    const { source, target } = event.detail;
    selectedNode = null; // Clear node selection when selecting edges

    if (selectedEdge?.source === source && selectedEdge?.target === target) {
      // If the same edge is clicked twice, remove it
      graph.removeEdge(source, target);
      selectedEdge = null;
    } else {
      selectedEdge = { source, target };
    }
  }

  // Handle keyboard shortcuts
  function handleKeydown(event: KeyboardEvent) {
    if (disabled) return;
    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (selectedNode) {
        graph.removeNode(selectedNode);
        selectedNode = null;
      } else if (selectedEdge) {
        graph.removeEdge(selectedEdge.source, selectedEdge.target);
        selectedEdge = null;
      }
    } else if (event.key === 'n' && event.ctrlKey) {
      const offset = 60;
      graph.addNode({
        id: `node-${$graph.nodes.length}`,
        x: width - offset,
        y: offset,
        label: `${$graph.nodes.length + 1}`
      });
    } else if (event.key === 'Tab') {
      event.preventDefault();
      if ($graph.nodes.length === 0) return;

      const currentIndex = selectedNode 
        ? $graph.nodes.findIndex(n => n.id === selectedNode)
        : -1;
      const nextIndex = event.shiftKey
        ? (currentIndex - 1 + $graph.nodes.length) % $graph.nodes.length
        : (currentIndex + 1) % $graph.nodes.length;
      
      selectedNode = $graph.nodes[nextIndex].id;
      selectedEdge = null;
    }
  }

  // Add these handlers to the existing script
  function handleEdgeWeightUpdate(event: CustomEvent<{ source: string; target: string; weight: number }>) {
    const { source, target, weight } = event.detail;
    graph.updateEdge(source, target, { weight });
  }

  function handleNodeLabelUpdate(event: CustomEvent<{ id: string; label: string }>) {
    const { id, label } = event.detail;
    graph.updateNode(id, { label });
  }

  // Algorithm visualization states
  $: currentStep = $algorithmStore.steps[$algorithmStore.currentStep];
  $: visitedNodes = new Set(currentStep?.nodes || []);
  $: highlightedEdges = new Set(
    (currentStep?.edges || []).map(e => `${e.source}-${e.target}`)
  );

  // Node colors based on algorithm state
  function getNodeColor(nodeId: string): string {
    if (!$algorithmStore.isRunning) {
      return nodeId === selectedNode ? 'var(--color-primary)' : 'var(--color-surface)';
    }

    if (!currentStep) return 'var(--color-surface)';

    switch (currentStep.type) {
      case 'select':
        return visitedNodes.has(nodeId) ? 'var(--color-primary)' : 'var(--color-surface)';
      case 'visit':
        return visitedNodes.has(nodeId) ? 'var(--color-accent)' : 'var(--color-surface)';
      case 'explore':
        return visitedNodes.has(nodeId) ? 'var(--color-warning)' : 'var(--color-surface)';
      case 'finish':
        return visitedNodes.has(nodeId) ? 'var(--color-success)' : 'var(--color-surface)';
      case 'skip':
        return visitedNodes.has(nodeId) ? 'var(--color-error)' : 'var(--color-surface)';
      default:
        return 'var(--color-surface)';
    }
  }

  // Edge colors based on algorithm state
  function getEdgeColor(source: string, target: string): string {
    if (!$algorithmStore.isRunning) {
      return selectedEdge?.source === source && selectedEdge?.target === target
        ? 'var(--color-primary)'
        : 'var(--color-text)';
    }

    if (!currentStep) return 'var(--color-text)';

    const edgeKey = `${source}-${target}`;
    if (!highlightedEdges.has(edgeKey)) return 'var(--color-text)';

    switch (currentStep.type) {
      case 'select':
        return 'var(--color-primary)';
      case 'explore':
        return 'var(--color-warning)';
      case 'finish':
        return 'var(--color-success)';
      case 'skip':
        return 'var(--color-error)';
      default:
        return 'var(--color-text)';
    }
  }

  // Initialize some example nodes with proper scaling
  onMount(() => {
    // Add some initial nodes in a circle
    const padding = 100;
    const usableWidth = width - padding * 2;
    const usableHeight = height - padding * 2;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(usableWidth, usableHeight) / 3;
    const nodeCount = 5;

    // Set initial viewBox to match container with padding
    viewBox = {
      minX: -padding,
      minY: -padding,
      width: width + padding * 2,
      height: height + padding * 2
    };

    // Clear any existing nodes
    graph.clear();

    // Add nodes in a circle with proper scaling
    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * 2 * Math.PI;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      graph.addNode({
        id: `node-${i}`,
        x,
        y,
        label: `${i + 1}`
      });
    }

    // Add some example edges with calculated weights
    const nodes = $graph.nodes;
    [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 0]
    ].forEach(([source, target]) => {
      const sourceNode = nodes[source];
      const targetNode = nodes[target];
      const weight = calculateDistance(sourceNode.x, sourceNode.y, targetNode.x, targetNode.y);
      graph.addEdge({
        source: sourceNode.id,
        target: targetNode.id,
        weight
      });
    });

    // Add keyboard event listener
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  });
</script>

<div class="w-full h-full">
  <svg
    bind:this={svg}
    {width}
    {height}
    viewBox="{viewBox.minX} {viewBox.minY} {viewBox.width} {viewBox.height}"
    preserveAspectRatio="xMidYMid meet"
    class="w-full h-full bg-light-surface dark:bg-dark-surface"
    role="application"
    aria-label="Graph visualization"
  >
    <g role="list" aria-label="Graph edges">
      <!-- Edges -->
      {#each $graph.edges as edge (edge.source + edge.target)}
        {@const sourceNode = $graph.nodes.find(n => n.id === edge.source)}
        {@const targetNode = $graph.nodes.find(n => n.id === edge.target)}
        {#if sourceNode && targetNode}
          {@const offset = calculateEdgeOffset(edge.source, edge.target)}
          <Edge
            {edge}
            sourceNode={{
              ...sourceNode,
              x: sourceNode.x + offset.dx,
              y: sourceNode.y + offset.dy
            }}
            targetNode={{
              ...targetNode,
              x: targetNode.x + offset.dx,
              y: targetNode.y + offset.dy
            }}
            {directed}
            selected={selectedEdge?.source === edge.source && 
                     selectedEdge?.target === edge.target}
            on:select={handleEdgeSelect}
            on:updateWeight={handleEdgeWeightUpdate}
          />
        {/if}
      {/each}
    </g>

    <g role="list" aria-label="Graph nodes">
      <!-- Nodes -->
      {#each $graph.nodes as node (node.id)}
        <Node
          {node}
          selected={selectedNode === node.id}
          dragging={draggingNode === node.id}
          on:dragstart={handleDragStart}
          on:select={handleNodeSelect}
          on:updateLabel={handleNodeLabelUpdate}
        />
      {/each}
    </g>
  </svg>
</div> 