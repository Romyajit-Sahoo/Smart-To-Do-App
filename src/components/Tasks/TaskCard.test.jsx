import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskCard } from './TaskCard';
import * as AppContextModule from '../../context/AppContext';

describe('TaskCard Component', () => {
  const mockToggle = vi.fn();
  const mockDelete = vi.fn();
  const mockDuplicate = vi.fn();
  const mockOnEdit = vi.fn();

  const baseTask = {
    id: 'task-123',
    title: 'Complete TDD Implementation',
    description: 'Ensure 100% test passing across the suite',
    category: 'work',
    priority: 'high',
    dueDate: '2026-10-13',
    completed: false,
    missed: false,
    tags: ['coding', 'tests']
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AppContextModule, 'useApp').mockReturnValue({
      toggleTaskCompletion: mockToggle,
      deleteTask: mockDelete,
      duplicateTask: mockDuplicate,
      categories: [
        { id: 'work', name: 'Work', color: '#3b82f6', icon: 'Briefcase' }
      ],
      getLocalDateString: () => '2026-10-13'
    });
  });

  it('renders task details accurately including tags, title and priority', () => {
    render(<TaskCard task={baseTask} onEdit={mockOnEdit} />);

    expect(screen.getByText('Complete TDD Implementation')).toBeInTheDocument();
    expect(screen.getByText('Ensure 100% test passing across the suite')).toBeInTheDocument();
    expect(screen.getByText('high')).toBeInTheDocument();
    expect(screen.getByText('#coding')).toBeInTheDocument();
    expect(screen.getByText('#tests')).toBeInTheDocument();
  });

  it('triggers toggleTaskCompletion when checkbox is clicked', () => {
    render(<TaskCard task={baseTask} onEdit={mockOnEdit} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(mockToggle).toHaveBeenCalledWith('task-123');
  });

  it('triggers onEdit callback when edit button is clicked on an active task', () => {
    render(<TaskCard task={baseTask} onEdit={mockOnEdit} />);

    const editBtn = screen.getByLabelText('Edit task');
    fireEvent.click(editBtn);

    expect(mockOnEdit).toHaveBeenCalledWith(baseTask);
  });

  it('locks checkbox and edit button for historical tasks', () => {
    const historicalTask = {
      ...baseTask,
      id: 'task-hist',
      dueDate: '2026-10-01' // Past date
    };

    render(<TaskCard task={historicalTask} onEdit={mockOnEdit} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();

    const editBtn = screen.getByLabelText('Edit task');
    expect(editBtn).toBeDisabled();

    fireEvent.click(editBtn);
    expect(mockOnEdit).not.toHaveBeenCalled();
  });

  it('displays overdue badge when task is past due date and incomplete', () => {
    const overdueTask = {
      ...baseTask,
      dueDate: '2026-10-10',
      completed: false
    };

    render(<TaskCard task={overdueTask} onEdit={mockOnEdit} />);
    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });
});
