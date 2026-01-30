import { act, renderHook, waitFor } from '@testing-library/react';
import { MOCK_PROPERTIES } from 'public/mock-data';
import { describe, expect, it, vi } from 'vitest';
import { useProperties } from '../useProperties';

// Mock the timeout to make tests faster
vi.useFakeTimers();

describe('useProperties', () => {
  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useProperties());

    expect(result.current.properties).toEqual([]);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should fetch properties successfully', async () => {
    const { result } = renderHook(() => useProperties());

    // Fast-forward through the timeout
    vi.advanceTimersByTime(800);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.properties).toEqual(MOCK_PROPERTIES);
    expect(result.current.error).toBeNull();
  });

  it('should refresh properties when refresh is called', async () => {
    const { result } = renderHook(() => useProperties());

    vi.advanceTimersByTime(800);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Call refresh
    act(() => {
      result.current.refresh();
    });

    expect(result.current.isLoading).toBe(true);

    vi.advanceTimersByTime(800);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.properties).toEqual(MOCK_PROPERTIES);
  });
});
