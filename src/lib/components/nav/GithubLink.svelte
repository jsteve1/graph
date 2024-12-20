<script lang="ts">
  import { browser } from '$app/environment';
  let IconifyIcon: any;

  if (browser) {
    import('@iconify/svelte').then(module => {
      IconifyIcon = module.default;
    });
  }
</script>

<a
  href="https://github.com"
  target="_blank"
  rel="noopener noreferrer"
  class="p-2 rounded-full hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover transition-colors duration-200"
>
  {#if browser && IconifyIcon}
    <svelte:component this={IconifyIcon} icon="mdi:github" class="w-5 h-5 text-light-text dark:text-dark-text" />
  {/if}
</a> 