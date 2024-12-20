import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function createThemeStore() {
  const { subscribe, set } = writable<'light' | 'dark'>('light');

  return {
    subscribe,
    toggle: () => {
      if (browser) {
        const root = document.documentElement;
        const isDark = root.classList.contains('dark');
        
        if (isDark) {
          root.classList.remove('dark');
          localStorage.theme = 'light';
          set('light');
        } else {
          root.classList.add('dark');
          localStorage.theme = 'dark';
          set('dark');
        }
      }
    },
    initialize: () => {
      if (browser) {
        const isDark = localStorage.theme === 'dark' || 
          (!('theme' in localStorage) && 
           window.matchMedia('(prefers-color-scheme: dark)').matches);
        
        if (isDark) {
          document.documentElement.classList.add('dark');
          set('dark');
        } else {
          document.documentElement.classList.remove('dark');
          set('light');
        }
      }
    }
  };
}

export const theme = createThemeStore(); 