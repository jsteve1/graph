<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { theme } from '$lib/stores/themeStore';
  let IconifyIcon: any;

  onMount(async () => {
    const module = await import('@iconify/svelte');
    IconifyIcon = module.default;
    theme.initialize();
  });
</script>

<button
  class="p-2 rounded-md hover:bg-light-border/10 dark:hover:bg-dark-border/10
         focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary"
  on:click={theme.toggle}
  aria-label="Toggle theme"
>
  {#if browser && IconifyIcon}
    {#if $theme === 'dark'}
      <svelte:component this={IconifyIcon} icon="ph:sun-bold" class="w-5 h-5 text-dark-text" />
    {:else}
      <svelte:component this={IconifyIcon} icon="ph:moon-bold" class="w-5 h-5 text-light-text" />
    {/if}
  {/if}
</button> 