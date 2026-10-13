import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage hook', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('initializes with fallback value when localStorage is empty', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial-fallback'));
    expect(result.current[0]).toBe('initial-fallback');
    expect(window.localStorage.getItem('test-key')).toBe(JSON.stringify('initial-fallback'));
  });

  it('initializes with existing value stored in localStorage', () => {
    window.localStorage.setItem('existing-key', JSON.stringify({ score: 100 }));
    const { result } = renderHook(() => useLocalStorage('existing-key', { score: 0 }));
    expect(result.current[0]).toEqual({ score: 100 });
  });

  it('updates state and persists new value to localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('tasks-key', []));

    act(() => {
      result.current[1]([{ id: 1, title: 'Learn TDD' }]);
    });

    expect(result.current[0]).toEqual([{ id: 1, title: 'Learn TDD' }]);
    expect(JSON.parse(window.localStorage.getItem('tasks-key'))).toEqual([{ id: 1, title: 'Learn TDD' }]);
  });

  it('supports functional updater pattern in state setter', () => {
    const { result } = renderHook(() => useLocalStorage('counter-key', 5));

    act(() => {
      result.current[1](prev => prev + 1);
    });

    expect(result.current[0]).toBe(6);
    expect(JSON.parse(window.localStorage.getItem('counter-key'))).toBe(6);
  });

  it('falls back to initialValue if localStorage contains corrupted JSON', () => {
    window.localStorage.setItem('corrupted-key', 'INVALID_JSON_OBJECT{{{');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() => useLocalStorage('corrupted-key', 'safe-fallback'));

    expect(result.current[0]).toBe('safe-fallback');
    expect(warnSpy).toHaveBeenCalled();
  });
});
