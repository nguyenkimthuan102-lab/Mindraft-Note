import { create } from 'zustand';

interface ScrollState {
  scrollToTopTrigger: number;
  triggerScrollToTop: () => void;
}

export const useScrollStore = create<ScrollState>((set) => ({
  scrollToTopTrigger: 0,
  triggerScrollToTop: () =>
    set((state) => ({ scrollToTopTrigger: state.scrollToTopTrigger + 1 })),
}));