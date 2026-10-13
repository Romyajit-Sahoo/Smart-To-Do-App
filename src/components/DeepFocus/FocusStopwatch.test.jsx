import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FocusStopwatch } from './FocusStopwatch';
import * as AppContextModule from '../../context/AppContext';

describe('FocusStopwatch Component', () => {
  const mockSetRunningSession = vi.fn();
  const mockSetDistractions = vi.fn();
  const mockOnStop = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders idle state with start button and 00:00:00 display', () => {
    vi.spyOn(AppContextModule, 'useApp').mockReturnValue({
      runningFocusSession: { status: 'idle', task: { id: 't1', title: 'Task 1' } },
      setRunningFocusSession: mockSetRunningSession,
      setFocusDistractions: mockSetDistractions
    });

    render(<FocusStopwatch onSessionStop={mockOnStop} elapsed={0} />);

    expect(screen.getByText('Start')).toBeInTheDocument();
    const zeros = screen.getAllByText('00');
    expect(zeros.length).toBe(3); // 00 : 00 : 00
  });

  it('formats large multi-hour elapsed durations (e.g., 182h 47m 12s) accurately across segments', () => {
    // 182 hours, 47 minutes, 12 seconds = 182 * 3600 + 47 * 60 + 12 = 658032 seconds
    const elapsedSeconds = 658032;

    vi.spyOn(AppContextModule, 'useApp').mockReturnValue({
      runningFocusSession: { status: 'running', task: { id: 't1', title: 'Leet Code' } },
      setRunningFocusSession: mockSetRunningSession,
      setFocusDistractions: mockSetDistractions
    });

    render(<FocusStopwatch onSessionStop={mockOnStop} elapsed={elapsedSeconds} />);

    expect(screen.getByText('182')).toBeInTheDocument();
    expect(screen.getByText('47')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    const colons = screen.getAllByText(':');
    expect(colons.length).toBe(2);
    expect(screen.getByText('Pause')).toBeInTheDocument();
    expect(screen.getByText('Stop')).toBeInTheDocument();
  });

  it('handles pause and resume transitions', () => {
    vi.spyOn(AppContextModule, 'useApp').mockReturnValue({
      runningFocusSession: { status: 'paused', task: { id: 't1', title: 'Leet Code' } },
      setRunningFocusSession: mockSetRunningSession,
      setFocusDistractions: mockSetDistractions
    });

    render(<FocusStopwatch onSessionStop={mockOnStop} elapsed={300} />);

    const resumeBtn = screen.getByText('Resume');
    expect(resumeBtn).toBeInTheDocument();
    fireEvent.click(resumeBtn);

    expect(mockSetRunningSession).toHaveBeenCalled();
  });
});
