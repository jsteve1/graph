<script lang="ts">
  import Icon from '@iconify/svelte';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{
    select: { 
      algorithm: string;
      startNode?: string;
      endNode?: string;
      speed: number;
    };
  }>();

  interface Algorithm {
    id: string;
    name: string;
    icon: string;
    description: string;
    needsStart: boolean;
    needsEnd: boolean;
  }

  const algorithms: Algorithm[] = [
    { 
      id: 'dijkstra',
      name: 'Dijkstra\'s Algorithm',
      icon: 'mdi:graph-outline',
      description: 'Finds the shortest path between nodes in a graph, which may represent, for example, road networks. Works with non-negative edge weights.',
      needsStart: true,
      needsEnd: true
    },
    { 
      id: 'bellmanFord',
      name: 'Bellman-Ford Algorithm',
      icon: 'mdi:graph',
      description: 'Similar to Dijkstra\'s but can handle graphs with negative edge weights. Also detects negative cycles in the graph.',
      needsStart: true,
      needsEnd: true
    },
    { 
      id: 'kruskal',
      name: 'Kruskal\'s MST',
      icon: 'mdi:graph',
      description: 'Finds a minimum spanning tree for a connected weighted graph, adding the smallest possible edges while avoiding cycles.',
      needsStart: false,
      needsEnd: false
    },
    { 
      id: 'prim',
      name: 'Prim\'s MST',
      icon: 'mdi:graph',
      description: 'Another minimum spanning tree algorithm that grows the tree from a starting vertex, always adding the smallest edge connected to the current tree.',
      needsStart: true,
      needsEnd: false
    },
    { 
      id: 'dfs',
      name: 'Depth-First Search',
      icon: 'mdi:graph-outline',
      description: 'Explores as far as possible along each branch before backtracking. Useful for topological sorting, finding cycles, and solving mazes.',
      needsStart: true,
      needsEnd: false
    },
    { 
      id: 'bfs',
      name: 'Breadth-First Search',
      icon: 'mdi:graph-outline',
      description: 'Explores all vertices at the present depth before moving on to vertices at the next depth level. Finds shortest paths in unweighted graphs.',
      needsStart: true,
      needsEnd: false
    }
  ];

  let isOpen = false;
  let selectedAlgorithm: Algorithm | null = null;
  let showDescription = false;
  let startNode = '';
  let endNode = '';
  let speed = 500; // milliseconds

  function handleSelect(algorithm: Algorithm) {
    selectedAlgorithm = algorithm;
  }

  function handleStart() {
    if (!selectedAlgorithm) return;
    
    const params: {
      algorithm: string;
      speed: number;
      startNode?: string;
      endNode?: string;
    } = {
      algorithm: selectedAlgorithm.id,
      speed
    };

    if (selectedAlgorithm.needsStart) {
      params.startNode = startNode;
    }
    if (selectedAlgorithm.needsEnd) {
      params.endNode = endNode;
    }

    dispatch('select', params);
    isOpen = false;
    selectedAlgorithm = null;
    showDescription = false;
  }
</script>

<div class="relative">
  <!-- Toggle Button -->
  <button
    type="button"
    class="px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary
           hover:bg-light-accent dark:hover:bg-dark-accent
           text-white font-medium
           transition-colors duration-200
           flex items-center gap-2"
    on:click={() => isOpen = !isOpen}
  >
    <Icon icon="mdi:play" class="w-5 h-5" />
    Algorithms
  </button>

  <!-- Dropdown Menu -->
  {#if isOpen}
    <div
      class="absolute bottom-full right-0 mb-2 w-80
             bg-light-surface dark:bg-dark-surface
             border border-light-border dark:border-dark-border
             rounded-lg shadow-lg
             divide-y divide-light-border dark:divide-dark-border"
    >
      <!-- Algorithm Selection -->
      <div class="p-2 space-y-1">
        {#each algorithms as algorithm}
          <div
            class="w-full px-4 py-2 text-left rounded
                   text-light-text dark:text-dark-text
                   hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover
                   flex items-center gap-3
                   transition-colors duration-200
                   cursor-pointer
                   {selectedAlgorithm?.id === algorithm.id ? 'bg-light-surface-hover dark:bg-dark-surface-hover' : ''}"
            on:click={() => handleSelect(algorithm)}
            role="button"
            tabindex="0"
          >
            <Icon icon={algorithm.icon} class="w-5 h-5 flex-shrink-0" />
            <span class="flex-grow">{algorithm.name}</span>
            <div
              class="p-1 rounded-full hover:bg-light-border/20 dark:hover:bg-dark-border/20 cursor-pointer"
              on:click|stopPropagation={() => {
                selectedAlgorithm = algorithm;
                showDescription = true;
              }}
              role="button"
              tabindex="0"
              title="Show Description"
            >
              <Icon icon="mdi:help-circle-outline" class="w-4 h-4" />
            </div>
          </div>
        {/each}
      </div>

      <!-- Algorithm Controls -->
      {#if selectedAlgorithm}
        <div class="p-4 space-y-4">
          <!-- Description (if shown) -->
          {#if showDescription}
            <div class="text-sm text-light-text/80 dark:text-dark-text/80 bg-light-surface-hover dark:bg-dark-surface-hover p-3 rounded">
              {selectedAlgorithm.description}
            </div>
          {/if}

          <!-- Start Node -->
          {#if selectedAlgorithm.needsStart}
            <div class="space-y-1">
              <label class="text-sm text-light-text dark:text-dark-text">Start Node</label>
              <input
                type="text"
                bind:value={startNode}
                placeholder="Enter node label"
                class="w-full px-3 py-1.5 text-sm
                       bg-light-surface dark:bg-dark-surface
                       text-light-text dark:text-dark-text
                       border border-light-border dark:border-dark-border
                       rounded focus:outline-none focus:ring-1
                       focus:ring-light-primary dark:focus:ring-dark-primary"
              />
            </div>
          {/if}

          <!-- End Node -->
          {#if selectedAlgorithm.needsEnd}
            <div class="space-y-1">
              <label class="text-sm text-light-text dark:text-dark-text">End Node</label>
              <input
                type="text"
                bind:value={endNode}
                placeholder="Enter node label"
                class="w-full px-3 py-1.5 text-sm
                       bg-light-surface dark:bg-dark-surface
                       text-light-text dark:text-dark-text
                       border border-light-border dark:border-dark-border
                       rounded focus:outline-none focus:ring-1
                       focus:ring-light-primary dark:focus:ring-dark-primary"
              />
            </div>
          {/if}

          <!-- Speed Control -->
          <div class="space-y-1">
            <label class="text-sm text-light-text dark:text-dark-text">
              Animation Speed (ms)
            </label>
            <input
              type="range"
              bind:value={speed}
              min="100"
              max="2000"
              step="100"
              class="w-full"
            />
            <div class="text-sm text-light-text/80 dark:text-dark-text/80 text-center">
              {speed}ms per step
            </div>
          </div>

          <!-- Start Button -->
          <button
            type="button"
            class="w-full px-4 py-2 rounded
                   bg-light-primary dark:bg-dark-primary
                   hover:bg-light-accent dark:hover:bg-dark-accent
                   text-white font-medium
                   transition-colors duration-200
                   flex items-center justify-center gap-2"
            on:click={handleStart}
          >
            <Icon icon="mdi:play" class="w-5 h-5" />
            Start Algorithm
          </button>
        </div>
      {/if}
    </div>
  {/if}
</div> 