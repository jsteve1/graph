<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';

  onMount(() => {
    // Check for user's theme preference
    if (localStorage.theme === 'dark' || 
        (!('theme' in localStorage) && 
         window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  });
</script>

<div class="min-h-screen transition-colors duration-200">
  <slot />
</div> 