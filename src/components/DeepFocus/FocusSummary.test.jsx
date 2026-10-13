import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FocusSummary } from './FocusSummary';
import * as AppContextModule from '../../context/AppContext';

describe('FocusSummary Component', () => {
  it('renders zero/empty summary when there are no focus sessions today', () => {
    vi.spyOn(AppContextModule, 'useApp').mockReturnValue({
      focusSessions: [],
      getLocalDateString: () => '2026-10-13'
    });

    render(<FocusSummary />);

    expect(screen.getByText("Today's Focus")).toBeInTheDocument();
    expect(screen.getByText("Sessions")).toBeInTheDocument();
    expect(screen.getByText("Avg. Session")).toBeInTheDocument();
    expect(screen.getByText("Longest")).toBeInTheDocument();

    // With 0 sessions, count is 0 and times format to 0m
    expect(screen.getByText("0")).toBeInTheDocument();
    const zeroDurations = screen.getAllByText("0m");
    expect(zeroDurations.length).toBeGreaterThanOrEqual(3);
  });

  it('aggregates and formats sessions recorded for today', () => {
    const mockSessions = [
      { id: '1', timestamp: '2026-10-13T09:00:00Z', duration: 1800 }, // 30m
      { id: '2', timestamp: '2026-10-13T14:00:00Z', duration: 3600 }, // 60m (1h)
      { id: '3', timestamp: '2026-10-12T10:00:00Z', duration: 7200 }  // Yesterday -> excluded
    ];

    vi.spyOn(AppContextModule, 'useApp').mockReturnValue({
      focusSessions: mockSessions,
      getLocalDateString: () => '2026-10-13'
    });

    render(<FocusSummary />);

    // Count should be 2
    expect(screen.getByText("2")).toBeInTheDocument();

    // Total today = 1800 + 3600 = 5400s -> 1h 30m
    expect(screen.getByText("1h 30m")).toBeInTheDocument();

    // Avg today = 5400 / 2 = 2700s -> 45m
    expect(screen.getByText("45m")).toBeInTheDocument();

    // Longest today = 3600s -> 1h 0m
    expect(screen.getByText("1h 0m")).toBeInTheDocument();
  });
});
