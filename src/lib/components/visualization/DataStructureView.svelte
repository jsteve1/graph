<script lang="ts">
  import { graph } from '$lib/stores/graphStore';
  import Icon from '@iconify/svelte';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{
    close: void;
  }>();

  interface Neighbor {
    label: string;
    weight: number;
    direction: 'in' | 'out';
  }

  type AdjacencyList = Record<string, Neighbor[]>;

  // Format adjacency list
  $: adjacencyList = $graph.nodes.reduce<AdjacencyList>((acc, node) => {
    const edges = $graph.edges.filter(e => e.source === node.id || e.target === node.id);
    const neighbors = edges.map(e => {
      const isSource = e.source === node.id;
      const neighborId = isSource ? e.target : e.source;
      const neighborNode = $graph.nodes.find(n => n.id === neighborId);
      return {
        label: neighborNode?.label || neighborId,
        weight: e.weight,
        direction: isSource ? 'out' as const : 'in' as const
      };
    });
    return { ...acc, [node.label || node.id]: neighbors };
  }, {});

  interface EdgeListItem {
    source: string;
    target: string;
    weight: number;
  }

  // Format edge list
  $: edgeList = $graph.edges.map<EdgeListItem>(e => {
    const sourceNode = $graph.nodes.find(n => n.id === e.source);
    const targetNode = $graph.nodes.find(n => n.id === e.target);
    return {
      source: sourceNode?.label || e.source,
      target: targetNode?.label || e.target,
      weight: e.weight
    };
  });
</script>

<div class="p-4 space-y-6 bg-light-surface dark:bg-dark-surface rounded-lg">
  <!-- Header with Back Button -->
  <div class="flex items-center justify-between mb-6">
    <h2 class="text-xl font-semibold text-light-text dark:text-dark-text">
      Graph Data Structure
    </h2>
    <button
      type="button"
      class="p-2 rounded-lg
             bg-light-surface dark:bg-dark-surface
             hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover
             text-light-text dark:text-dark-text
             border border-light-border dark:border-dark-border
             transition-colors duration-200
             flex items-center gap-2 mt-10"
      on:click={() => dispatch('close')}
    >
      <Icon icon="mdi:arrow-left" class="w-5 h-5" />
      <span>Back to Graph</span>
    </button>
  </div>

  <!-- Adjacency List -->
  <div>
    <h3 class="text-lg font-semibold mb-2 text-light-text dark:text-dark-text">
      Adjacency List
    </h3>
    <div class="space-y-2 font-mono text-sm">
      {#each Object.entries(adjacencyList) as [node, neighbors]}
        <div class="flex items-start gap-2">
          <span class="text-light-text dark:text-dark-text">{node}:</span>
          <span class="text-light-text/80 dark:text-dark-text/80">
            [{#each neighbors as neighbor, i}
              {neighbor.direction === 'out' ? `→${neighbor.label}(${neighbor.weight})` : `←${neighbor.label}(${neighbor.weight})`}
              {i < neighbors.length - 1 ? ', ' : ''}
            {/each}]
          </span>
        </div>
      {/each}
    </div>
  </div>

  <!-- Edge List -->
  <div>
    <h3 class="text-lg font-semibold mb-2 text-light-text dark:text-dark-text">
      Edge List
    </h3>
    <div class="space-y-1 font-mono text-sm">
      {#each edgeList as {source, target, weight}}
        <div class="text-light-text/80 dark:text-dark-text/80">
          ({source}, {target}, {weight})
        </div>
      {/each}
    </div>
  </div>
</div> 