import { writable } from 'svelte/store';

export interface AlgorithmStep {
  type: 'visit' | 'explore' | 'select' | 'finish' | 'skip';
  nodes: string[];
  edges: Array<{ source: string; target: string }>;
  message: string;
}

interface AlgorithmState {
  isRunning: boolean;
  currentStep: number;
  steps: AlgorithmStep[];
  speed: number;
  startNode?: string;
  endNode?: string;
}

function createAlgorithmStore() {
  const { subscribe, set, update } = writable<AlgorithmState>({
    isRunning: false,
    currentStep: -1,
    steps: [],
    speed: 500
  });

  return {
    subscribe,
    start: (steps: AlgorithmStep[], speed: number, startNode?: string, endNode?: string) => {
      set({
        isRunning: true,
        currentStep: -1,
        steps,
        speed,
        startNode,
        endNode
      });
    },
    nextStep: () => {
      update(state => ({
        ...state,
        currentStep: Math.min(state.currentStep + 1, state.steps.length - 1)
      }));
    },
    previousStep: () => {
      update(state => ({
        ...state,
        currentStep: Math.max(state.currentStep - 1, -1)
      }));
    },
    stop: () => {
      set({
        isRunning: false,
        currentStep: -1,
        steps: [],
        speed: 500
      });
    },
    setSpeed: (speed: number) => {
      update(state => ({ ...state, speed }));
    }
  };
}

export const algorithmStore = createAlgorithmStore(); 