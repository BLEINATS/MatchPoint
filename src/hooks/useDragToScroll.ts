import { useRef, useEffect, useCallback } from 'react';

export const useDragToScroll = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);

  const onMouseDown = useCallback((e: MouseEvent) => {
    const el = ref.current;
    if (!el) return;

    const state = {
      isDown: true,
      startX: e.pageX - el.offsetLeft,
      scrollLeft: el.scrollLeft,
    };

    el.dataset.dragState = JSON.stringify(state);
    el.classList.add('cursor-grabbing');
    el.classList.remove('cursor-grab');
  }, []);

  const onMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    const state = JSON.parse(el.dataset.dragState || '{}');
    if (state.isDown) {
        el.dataset.dragState = JSON.stringify({ ...state, isDown: false });
        el.classList.remove('cursor-grabbing');
        el.classList.add('cursor-grab');
    }
  }, []);

  const onMouseUp = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    
    const state = JSON.parse(el.dataset.dragState || '{}');
    if (state.isDown) {
        el.dataset.dragState = JSON.stringify({ ...state, isDown: false });
        el.classList.remove('cursor-grabbing');
        el.classList.add('cursor-grab');
    }
  }, []);

  const onMouseMove = useCallback((e: MouseEvent) => {
    const el = ref.current;
    if (!el) return;

    const state = JSON.parse(el.dataset.dragState || '{}');
    if (!state.isDown) return;

    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - state.startX) * 2; // scroll-fast
    el.scrollLeft = state.scrollLeft - walk;
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Initialize state
    el.dataset.dragState = JSON.stringify({ isDown: false, startX: 0, scrollLeft: 0 });
    el.classList.add('cursor-grab');

    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mouseleave', onMouseLeave);
    el.addEventListener('mouseup', onMouseUp);
    el.addEventListener('mousemove', onMouseMove);

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mouseleave', onMouseLeave);
      el.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('mousemove', onMouseMove);
    };
  }, [onMouseDown, onMouseLeave, onMouseUp, onMouseMove]);

  return ref;
};
