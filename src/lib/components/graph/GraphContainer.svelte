<script lang="ts">
  //@ts-ignore
  import { onMount } from 'svelte';
  import Graph from './Graph.svelte';
  import { browser } from '$app/environment';
  import { graph } from '$lib/stores/graphStore';
  import Icon from '@iconify/svelte';
  import { findNextAvailableLabel, hasCycle, makeAcyclic } from '$lib/utils/graphUtils';
  import DataStructureView from '../visualization/DataStructureView.svelte';
  import AlgorithmsMenu from '../algorithms/AlgorithmsMenu.svelte';
  import { algorithmStore } from '$lib/stores/algorithmStore';
  import AlgorithmVisualization from '../algorithms/AlgorithmVisualization.svelte';
  import * as algorithms from '$lib/algorithms';

  export let directed: boolean = false;
  export let acyclic: boolean = false;

  let container: HTMLDivElement;
  let width = 0;
  let height = 0;
  let selectedNode: string | null = null;
  let selectedEdge: { source: string; target: string } | null = null;
  let isEditing = false;
  let editValue = '';
  let errorMessage: string | null = null;
  let showDataStructure = false;

  function updateDimensions() {
    if (!container) return;
    const rect = container.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
  }

  function handleAddNode() {
    const offset = 60;
    graph.addNode({
      id: `node-${$graph.nodes.length}`,
      x: width - offset,
      y: offset,
      label: `${$graph.nodes.length + 1}`
    });
  }

  function handleRotateEdge() {
    if (selectedEdge) {
      const { source, target } = selectedEdge;
      const oldEdge = $graph.edges.find(e => 
        e.source === source && e.target === target
      );
      if (oldEdge) {
        // Remove the old edge
        graph.removeEdge(source, target);
        // Add the new edge in reverse direction
        graph.addEdge({
          source: target,
          target: source,
          weight: oldEdge.weight
        });
        // Update selection
        selectedEdge = { source: target, target: source };
      }
    }
  }

  function handleDelete() {
    if (selectedNode) {
      graph.removeNode(selectedNode);
      selectedNode = null;
    } else if (selectedEdge) {
      graph.removeEdge(selectedEdge.source, selectedEdge.target);
      selectedEdge = null;
    }
  }

  function startEditing() {
    if (selectedNode) {
      const node = $graph.nodes.find(n => n.id === selectedNode);
      if (node) {
        editValue = node.label || '';
        isEditing = true;
      }
    } else if (selectedEdge) {
      const edge = $graph.edges.find(e => 
        e.source === (selectedEdge && selectedEdge.source) && e.target === (selectedEdge && selectedEdge.target)  
      );
      if (edge) {
        editValue = edge.weight.toString();
        isEditing = true;
      }
    }
  }

  function cancelEdit() {
    isEditing = false;
    editValue = '';
    errorMessage = null;
  }

  function handleEdit() {
    if (selectedNode) {
      const value = editValue.trim();
      const numValue = parseInt(value);
      
      // Validate input
      if (!value) {
        errorMessage = "Label cannot be empty";
        return;
      }
      if (!isNaN(numValue) && (numValue < -100 || numValue > 100)) {
        errorMessage = "Number must be between -100 and 100";
        return;
      }

      // Get current node labels, filtering out undefined values
      const currentLabels = new Set(
        $graph.nodes
          .map(n => n.label)
          .filter((label): label is string => label !== undefined)
      );
      const currentNode = $graph.nodes.find(n => n.id === selectedNode);
      if (currentNode?.label) {
        currentLabels.delete(currentNode.label);
      }

      // If label exists, find a new label for the conflicting node
      if (currentLabels.has(value)) {
        const conflictingNode = $graph.nodes.find(n => n.id !== selectedNode && n.label === value);
        if (conflictingNode) {
          const newLabel = findNextAvailableLabel(currentLabels, value);
          graph.updateNode(conflictingNode.id, { label: newLabel });
        }
      }

      graph.updateNode(selectedNode, { label: value });
      errorMessage = null;
    } else if (selectedEdge?.source && selectedEdge?.target) {
      const value = parseInt(editValue);
      if (isNaN(value) || value <= 0) {
        errorMessage = "Weight must be a positive number";
        return;
      }
      graph.updateEdge(selectedEdge.source, selectedEdge.target, { weight: value });
      errorMessage = null;
    }
    isEditing = false;
    editValue = '';
  }

  // Handle acyclic toggle
  $: if (acyclic) {
    const newEdges = makeAcyclic($graph.edges);
    const removedEdges = $graph.edges.filter(edge => 
      !newEdges.some(e => 
        e.source === edge.source && e.target === edge.target
      )
    );
    
    // Remove edges that create cycles
    removedEdges.forEach(edge => {
      graph.removeEdge(edge.source, edge.target);
    });
  }

  function handleAlgorithmSelect(event: CustomEvent<{ 
    algorithm: string;
    startNode?: string;
    endNode?: string;
    speed: number;
  }>) {
    const { algorithm, startNode, endNode, speed } = event.detail;
    let steps;

    switch (algorithm) {
      case 'bfs':
        steps = algorithms.bfs($graph, startNode!);
        break;
      case 'dfs':
        steps = algorithms.dfs($graph, startNode!);
        break;
      case 'dijkstra':
        steps = algorithms.dijkstra($graph, startNode!, endNode!);
        break;
      case 'bellmanFord':
        steps = algorithms.bellmanFord($graph, startNode!, endNode!);
        break;
      case 'kruskal':
        steps = algorithms.kruskal($graph);
        break;
      case 'prim':
        steps = algorithms.prim($graph, startNode!);
        break;
      default:
        console.error('Unknown algorithm:', algorithm);
        return;
    }

    algorithmStore.start(steps, speed, startNode, endNode);
  }

  onMount(() => {
    if (browser) {
      updateDimensions();
      
      // Create ResizeObserver for more accurate size tracking
      const resizeObserver = new ResizeObserver(() => {
        updateDimensions();
      });
      
      resizeObserver.observe(container);
      window.addEventListener('resize', updateDimensions);
      
      return () => {
        resizeObserver.disconnect();
        window.removeEventListener('resize', updateDimensions);
      };
    }
  });
</script>

<div class="relative">
  <!-- Controls -->
  <div class="absolute top-4 right-4 flex items-center gap-2 z-10">
    <!-- Add Node Button -->
    <button
      type="button"
      class="p-2 rounded-full bg-light-surface dark:bg-dark-surface
             hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover
             text-light-text dark:text-dark-text
             border border-light-border dark:border-dark-border
             transition-colors duration-200
             disabled:opacity-50 disabled:cursor-not-allowed"
      on:click={handleAddNode}
      title="Add Node (Ctrl+N)"
      disabled={isEditing}
    >
      <Icon icon="mdi:plus" class="w-5 h-5" />
    </button>

    <!-- Edit Button (only shown when something is selected and not editing) -->
    {#if (selectedNode || selectedEdge) && !isEditing}
      <button
        type="button"
        class="p-2 rounded-full bg-light-surface dark:bg-dark-surface
               hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover
               text-light-text dark:text-dark-text
               border border-light-border dark:border-dark-border
               transition-colors duration-200"
        on:click={startEditing}
        title="Edit {selectedNode ? 'Node Label' : 'Edge Weight'}"
      >
        <Icon icon="mdi:pencil" class="w-5 h-5" />
      </button>
    {/if}

    <!-- Rotate Edge Button (only shown when edge is selected) -->
    {#if selectedEdge && directed && !isEditing}
      <button
        type="button"
        class="p-2 rounded-full bg-light-surface dark:bg-dark-surface
               hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover
               text-light-text dark:text-dark-text
               border border-light-border dark:border-dark-border
               transition-colors duration-200"
        on:click={handleRotateEdge}
        title="Rotate Edge Direction"
      >
        <Icon icon="mdi:rotate-right" class="w-5 h-5" />
      </button>
    {/if}

    <!-- Delete Button (only shown when something is selected) -->
    {#if (selectedNode || selectedEdge) && !isEditing}
      <button
        type="button"
        class="p-2 rounded-full bg-light-surface dark:bg-dark-surface
               hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover
               text-light-text dark:text-dark-text
               border border-light-border dark:border-dark-border
               transition-colors duration-200"
        on:click={handleDelete}
        title="Delete Selected (Delete)"
      >
        <Icon icon="mdi:trash-can" class="w-5 h-5" />
      </button>
    {/if}
  </div>

  <!-- Edit Modal (shown when editing) -->
  {#if isEditing}
    <div class="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
      <input
        type={selectedNode ? "text" : "number"}
        min={selectedEdge ? "1" : undefined}
        class="w-32 px-3 py-2 text-center bg-light-surface dark:bg-dark-surface
               text-light-text dark:text-dark-text text-sm font-medium
               border border-light-border dark:border-dark-border rounded
               focus:outline-none focus:ring-1 focus:ring-light-primary dark:focus:ring-dark-primary"
        bind:value={editValue}
        placeholder={selectedNode ? "Node Label" : "Edge Weight"}
      />
      <button
        type="button"
        class="p-2 rounded-full bg-light-primary dark:bg-dark-primary
               hover:bg-light-accent dark:hover:bg-dark-accent
               text-white"
        on:click={handleEdit}
        title="Save"
      >
        <Icon icon="mdi:check" class="w-5 h-5" />
      </button>
      <button
        type="button"
        class="p-2 rounded-full bg-light-surface dark:bg-dark-surface
               hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover
               text-light-text dark:text-dark-text
               border border-light-border dark:border-dark-border"
        on:click={cancelEdit}
        title="Cancel"
      >
        <Icon icon="mdi:close" class="w-5 h-5" />
      </button>
    </div>
  {/if}

  <!-- Graph Container -->
  <div
    bind:this={container}
    class="w-full max-w-[1200px] mx-auto aspect-[4/3] md:aspect-[16/9]
           bg-light-surface dark:bg-dark-surface rounded-lg shadow-lg
           border border-light-border dark:border-dark-border
           transition-colors duration-200"
  >
    {#if width > 0 && height > 0}
      <Graph
        {width}
        {height}
        {directed}
        {acyclic}
        bind:selectedNode
        bind:selectedEdge
        disabled={isEditing}
      />
    {/if}
  </div>

  <!-- Bottom Controls -->
  {#if !showDataStructure}
    <div class="absolute bottom-4 right-4 flex items-center gap-4">
      <!-- View Toggle -->
      <button
        type="button"
        class="px-4 py-2 rounded-lg bg-light-surface dark:bg-dark-surface
               hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover
               text-light-text dark:text-dark-text
               border border-light-border dark:border-dark-border
               transition-colors duration-200
               flex items-center gap-2"
        on:click={() => showDataStructure = !showDataStructure}
      >
        <Icon icon={showDataStructure ? "mdi:graph" : "mdi:code-json"} class="w-5 h-5" />
        {showDataStructure ? 'Show Graph' : 'See Data'}
      </button>

      <!-- Algorithms Menu -->
      <AlgorithmsMenu on:select={handleAlgorithmSelect} />
    </div>
  {/if}

  <!-- Algorithm Visualization -->
  <AlgorithmVisualization />

  <!-- Data Structure View (Overlay) -->
  {#if showDataStructure}
    <div class="absolute inset-4 bg-light-background/95 dark:bg-dark-background/95 rounded-lg overflow-auto">
      <DataStructureView on:close={() => showDataStructure = false} />
    </div>
  {/if}

  <!-- Add error message display -->
  {#if errorMessage}
    <div class="absolute top-16 left-1/2 -translate-x-1/2 z-20
                px-4 py-2 rounded-md bg-red-500 text-white text-sm">
      {errorMessage}
    </div>
  {/if}
</div> 