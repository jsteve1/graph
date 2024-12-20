<script lang="ts">
  import Navbar from '$lib/components/nav/Navbar.svelte';
  import GraphContainer from '$lib/components/graph/GraphContainer.svelte';
  import { writable } from 'svelte/store';

  const isDirected = writable(false);
  const isAcyclic = writable(false);
</script>

<div class="min-h-screen bg-light-bg dark:bg-dark-bg">
  <Navbar />
  <main class="container-responsive py-8 space-y-8">
    <div class="space-y-4">
      <div class="space-y-2">
        <h1 class="text-3xl font-bold text-light-text dark:text-dark-text">
          Graph Visualizer
        </h1>
        <p class="text-light-text/80 dark:text-dark-text/80">
          Click nodes to select them. Select two nodes to create an edge. Drag nodes to reposition them.
          Edge weights are automatically calculated based on distance.
        </p>
      </div>

      <div class="flex items-center space-x-4">
        <label class="flex items-center space-x-2 text-light-text dark:text-dark-text">
          <input
            type="checkbox"
            bind:checked={$isDirected}
            class="w-4 h-4 rounded border-light-border dark:border-dark-border
                   text-light-primary dark:text-dark-primary
                   focus:ring-light-primary dark:focus:ring-dark-primary
                   bg-light-surface dark:bg-dark-surface"
          />
          <span>Directed Graph</span>
        </label>
        <label class="flex items-center gap-2 text-sm text-light-text dark:text-dark-text">
          <input
            type="checkbox"
            bind:checked={$isAcyclic}
            class="w-4 h-4 rounded border-light-border dark:border-dark-border
                  text-light-primary dark:text-dark-primary
                  focus:ring-light-primary dark:focus:ring-dark-primary
                  bg-light-surface dark:bg-dark-surface"
          />
          Acyclic
        </label>
      </div>
        <!-- Add to the template section, after the controls div -->
    </div>

    <GraphContainer directed={$isDirected} acyclic={$isAcyclic} />
  </main>
</div>
