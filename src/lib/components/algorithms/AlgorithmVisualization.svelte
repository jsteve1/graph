<script lang="ts">
  import { algorithmStore } from '$lib/stores/algorithmStore';
  import Icon from '@iconify/svelte';
  import { onDestroy } from 'svelte';

  let timer: number;
  let isPaused = false;

  function handlePlayPause() {
    isPaused = !isPaused;
    if (!isPaused) {
      nextStep();
    }
  }

  function nextStep() {
    if (isPaused) return;
    
    algorithmStore.nextStep();
    const state = $algorithmStore;
    
    if (state.currentStep < state.steps.length - 1) {
      timer = setTimeout(nextStep, state.speed) as unknown as number;
    }
  }

  function previousStep() {
    algorithmStore.previousStep();
  }

  function handleStop() {
    clearTimeout(timer);
    algorithmStore.stop();
  }

  onDestroy(() => {
    clearTimeout(timer);
  });

  $: step = $algorithmStore.steps[$algorithmStore.currentStep];
  $: isRunning = $algorithmStore.isRunning;
  $: isLastStep = $algorithmStore.currentStep === $algorithmStore.steps.length - 1;
</script>

{#if isRunning}
  <div class="absolute bottom-4 left-4 right-4 flex flex-col gap-4">
    <!-- Message Box -->
    <div class="bg-light-surface/95 dark:bg-dark-surface/95
                border border-light-border dark:border-dark-border
                rounded-lg p-4 text-light-text dark:text-dark-text
                shadow-lg backdrop-blur-sm">
      {step?.message || 'Starting algorithm...'}
    </div>

    <!-- Controls -->
    <div class="flex items-center justify-center gap-4
                bg-light-surface/95 dark:bg-dark-surface/95
                border border-light-border dark:border-dark-border
                rounded-lg p-2 shadow-lg backdrop-blur-sm">
      <!-- Previous Step -->
      <button
        type="button"
        class="p-2 rounded-lg
               bg-light-surface dark:bg-dark-surface
               hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover
               text-light-text dark:text-dark-text
               border border-light-border dark:border-dark-border
               transition-colors duration-200
               disabled:opacity-50 disabled:cursor-not-allowed"
        on:click={previousStep}
        disabled={$algorithmStore.currentStep <= 0}
      >
        <Icon icon="mdi:skip-previous" class="w-5 h-5" />
      </button>

      <!-- Play/Pause -->
      <button
        type="button"
        class="p-2 rounded-lg
               bg-light-primary dark:bg-dark-primary
               hover:bg-light-accent dark:hover:bg-dark-accent
               text-white
               transition-colors duration-200"
        on:click={handlePlayPause}
      >
        <Icon icon={isPaused ? "mdi:play" : "mdi:pause"} class="w-5 h-5" />
      </button>

      <!-- Next Step -->
      <button
        type="button"
        class="p-2 rounded-lg
               bg-light-surface dark:bg-dark-surface
               hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover
               text-light-text dark:text-dark-text
               border border-light-border dark:border-dark-border
               transition-colors duration-200
               disabled:opacity-50 disabled:cursor-not-allowed"
        on:click={() => algorithmStore.nextStep()}
        disabled={isLastStep}
      >
        <Icon icon="mdi:skip-next" class="w-5 h-5" />
      </button>

      <!-- Stop -->
      <button
        type="button"
        class="p-2 rounded-lg
               bg-light-surface dark:bg-dark-surface
               hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover
               text-light-text dark:text-dark-text
               border border-light-border dark:border-dark-border
               transition-colors duration-200"
        on:click={handleStop}
      >
        <Icon icon="mdi:stop" class="w-5 h-5" />
      </button>

      <!-- Speed Control -->
      <div class="flex items-center gap-2">
        <Icon icon="mdi:speedometer" class="w-5 h-5 text-light-text dark:text-dark-text" />
        <input
          type="range"
          min="100"
          max="2000"
          step="100"
          class="w-32"
          bind:value={$algorithmStore.speed}
        />
      </div>

      <!-- Progress -->
      <div class="text-sm text-light-text/80 dark:text-dark-text/80">
        Step {$algorithmStore.currentStep + 1} of {$algorithmStore.steps.length}
      </div>
    </div>
  </div>
{/if} 