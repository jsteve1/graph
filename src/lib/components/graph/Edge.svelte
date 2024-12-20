<script lang="ts">
  import { spring } from 'svelte/motion';
  import type { Edge as EdgeType, Node } from '$lib/types/graph';
  import { createEventDispatcher } from 'svelte';

  export let edge: EdgeType;
  export let sourceNode: Node;
  export let targetNode: Node;
  export let selected: boolean = false;
  export let directed: boolean = false;
  export let disabled: boolean = false;

  const dispatch = createEventDispatcher<{
    select: { source: string; target: string };
  }>();

  const sourceCoords = spring(
    { x: sourceNode.x, y: sourceNode.y },
    {
      stiffness: 0.2,
      damping: 0.7
    }
  );

  const targetCoords = spring(
    { x: targetNode.x, y: targetNode.y },
    {
      stiffness: 0.2,
      damping: 0.7
    }
  );

  $: sourceCoords.set({ x: sourceNode.x, y: sourceNode.y });
  $: targetCoords.set({ x: targetNode.x, y: targetNode.y });

  $: dx = $targetCoords.x - $sourceCoords.x;
  $: dy = $targetCoords.y - $sourceCoords.y;
  $: angle = Math.atan2(dy, dx) * 180 / Math.PI;
  $: distance = Math.sqrt(dx * dx + dy * dy);
  
  // Calculate the points for the edge line, leaving space for the arrow
  $: {
    const nodeRadius = 20;
    const arrowLength = directed ? 15 : 0;
    const ratio = (distance - nodeRadius - arrowLength) / distance;
    
    endX = $sourceCoords.x + dx * ratio;
    endY = $sourceCoords.y + dy * ratio;
  }
  
  // Calculate the midpoint for the weight label
  $: midX = ($sourceCoords.x + endX) / 2;
  $: midY = ($sourceCoords.y + endY) / 2;

  // Offset the label slightly above the line
  $: labelOffsetX = -10 * Math.sin(angle * Math.PI / 180);
  $: labelOffsetY = 10 * Math.cos(angle * Math.PI / 180);

  let endX: number;
  let endY: number;

  function handleClick() {
    if (!disabled) {
      dispatch('select', { source: edge.source, target: edge.target });
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (disabled) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  }
</script>

<g 
  class="edge-group cursor-pointer"
  on:click={handleClick}
  role="button"
  tabindex="0"
  on:keydown={e => e.key === 'Enter' && handleClick()}
  aria-label="Edge from {edge.source} to {edge.target} with weight {edge.weight}"
>
  <!-- Edge line -->
  <line
    x1={$sourceCoords.x}
    y1={$sourceCoords.y}
    x2={endX}
    y2={endY}
    class="stroke-2 transition-colors duration-200
           {selected ? 'stroke-light-primary dark:stroke-dark-primary' : 
                      'stroke-light-border dark:border-dark-border'}
           {edge.color ? `stroke-${edge.color}-500` : ''}"
  />

  <!-- Weight label -->
  <text
    x={midX + labelOffsetX}
    y={midY + labelOffsetY}
    text-anchor="middle"
    dominant-baseline="middle"
    class="select-none fill-light-text dark:fill-dark-text text-xs font-medium"
  >
    {edge.weight}
  </text>

  <!-- Arrow marker for directed graphs -->
  {#if directed}
    <path
      d="M-8,-4L0,0L-8,4"
      class="fill-none stroke-2 transition-colors duration-200
             {selected ? 'stroke-light-primary dark:stroke-dark-primary' : 
                        'stroke-light-border dark:border-dark-border'}
             {edge.color ? `stroke-${edge.color}-500` : ''}"
      transform="translate({endX},{endY}) rotate({angle})"
    />
  {/if}
</g> 