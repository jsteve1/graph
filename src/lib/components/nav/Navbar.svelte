<script lang="ts">
  import ThemeToggle from './ThemeToggle.svelte';
  import GithubLink from './GithubLink.svelte';
</script>

<nav class="w-full border-b border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg">
  <div class="container-responsive h-16 flex items-center justify-between">
    <div class="flex items-center space-x-2">
      <img src="/logo.svg" alt="Graph Visualizer Logo" class="w-8 h-8 dark:invert" />
      <span class="text-xl font-semibold text-light-text dark:text-dark-text">
        Graph Visualizer
      </span>
    </div>

    <div class="flex items-center space-x-2">
      <GithubLink />
      <div class="w-px h-6 bg-light-border dark:bg-dark-border"></div>
      <ThemeToggle />
    </div>
  </div>
</nav> 