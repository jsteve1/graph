<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Node as NodeType } from '$lib/types/graph';
  import { spring } from 'svelte/motion';

  export let node: NodeType;
  export let selected: boolean = false;
  export let dragging: boolean = false;
  export let disabled: boolean = false;

  const dispatch = createEventDispatcher<{
    select: { id: string };
    dragstart: { id: string, event: MouseEvent | TouchEvent, rect: DOMRect, nodePos: { x: number, y: number } };
  }>();

  const coords = spring(
    { x: node.x, y: node.y },
    {
      stiffness: 0.1,
      damping: 0.8
    }
  );

  $: coords.set({ x: node.x, y: node.y });
  $: if (dragging) {
    console.log(`Node ${node.id} position:`, { x: node.x, y: node.y });
  }

  let longPressTimeout: number;
  let isDragging = false;
  let touchStartPos = { x: 0, y: 0 };

  function handleMouseDown(event: MouseEvent) {
    if (disabled || event.button !== 0) return;
    
    longPressTimeout = window.setTimeout(() => {
      const rect = (event.target as Element).getBoundingClientRect();
      dispatch('dragstart', { 
        id: node.id, 
        event, 
        rect,
        nodePos: { x: node.x, y: node.y }
      });
      isDragging = true;
    }, 500);
  }

  function handleTouchStart(event: TouchEvent) {
    if (disabled) return;
    event.preventDefault();
    
    const touch = event.touches[0];
    touchStartPos = { x: touch.clientX, y: touch.clientY };
    
    longPressTimeout = window.setTimeout(() => {
      const rect = (event.target as Element).getBoundingClientRect();
      console.log('Touch start position:', touchStartPos);
      console.log('Node initial position:', { x: node.x, y: node.y });
      console.log('Rect:', rect);
      
      dispatch('dragstart', { 
        id: node.id, 
        event, 
        rect,
        nodePos: { x: node.x, y: node.y }
      });
      isDragging = true;
    }, 500);
  }

  function handleTouchMove(event: TouchEvent) {
    if (!isDragging) {
      const touch = event.touches[0];
      const deltaX = Math.abs(touch.clientX - touchStartPos.x);
      const deltaY = Math.abs(touch.clientY - touchStartPos.y);
      
      // If moved more than 10px during long press, cancel it
      if (deltaX > 10 || deltaY > 10) {
        clearTimeout(longPressTimeout);
      }
    }
  }

  function handleMouseUp() {
    clearTimeout(longPressTimeout);
    if (!isDragging) {
      dispatch('select', { id: node.id });
    }
    isDragging = false;
  }

  function handleTouchEnd() {
    clearTimeout(longPressTimeout);
    if (!isDragging) {
      dispatch('select', { id: node.id });
    }
    isDragging = false;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (disabled) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      dispatch('select', { id: node.id });
    }
  }
</script>

<g
  class="cursor-pointer"
  transform="translate({$coords.x},{$coords.y})"
  on:mousedown={handleMouseDown}
  on:mouseup={handleMouseUp}
  on:mouseleave={() => clearTimeout(longPressTimeout)}
  on:touchstart={handleTouchStart}
  on:touchmove={handleTouchMove}
  on:touchend={handleTouchEnd}
  on:touchcancel={() => clearTimeout(longPressTimeout)}
  role="button"
  tabindex="0"
  on:keydown={handleKeydown}
  aria-label="Node {node.label}"
>
  <!-- Node circle -->
  <circle
    r="20"
    class="fill-light-surface dark:fill-dark-surface stroke-2
           {selected ? 'stroke-light-primary dark:stroke-dark-primary' : 
                      'stroke-light-border dark:border-dark-border'}
           {node.color ? `fill-${node.color}-500` : ''}"
    class:animate-pulse={dragging}
  />

  <!-- Node label -->
  <text
    dy=".35em"
    text-anchor="middle"
    class="select-none fill-light-text dark:fill-dark-text text-sm font-medium"
  >
    {node.label}
  </text>

  <!-- Distance label (for algorithms) -->
  {#if node.distance !== undefined}
    <text
      dy="-25"
      text-anchor="middle"
      class="select-none fill-light-text dark:fill-dark-text text-xs"
    >
      {node.distance === Infinity ? '∞' : node.distance}
    </text>
  {/if}
</g> 