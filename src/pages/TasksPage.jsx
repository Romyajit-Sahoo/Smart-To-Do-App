import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { TaskCard } from '../components/Tasks/TaskCard';
import { TaskModal } from '../components/Tasks/TaskModal';
import { PRIORITIES, SORT_OPTIONS } from '../constants/constants';
import { 
  Plus, 
  SlidersHorizontal, 
  ArrowUpDown,
  SearchCheck
} from 'lucide-react';
import './TasksPage.css';

export const TasksPage = () => {
  const { 
    tasks, 
    categories, 
    searchQuery, 
    filters, 
    setFilters, 
    sortBy, 
    setSortBy,
    getLocalDateString
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  const handleEditClick = (task) => {
    setTaskToEdit(task);
    setIsModalOpen(true);
  };

  const handleCreateClick = () => {
    setTaskToEdit(null);
    setIsModalOpen(true);
  };

  // 1. Date calculation variables
  const dates = useMemo(() => {
    const today = new Date();
    const todayStr = getLocalDateString(today);

    const tom = new Date();
    tom.setDate(today.getDate() + 1);
    const tomorrowStr = getLocalDateString(tom);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
    const startOfWeekStr = getLocalDateString(startOfWeek);

    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() - today.getDay() + 6); // Saturday
    const endOfWeekStr = getLocalDateString(endOfWeek);

    const monthStr = todayStr.substring(0, 7); // YYYY-MM

    return { todayStr, tomorrowStr, startOfWeekStr, endOfWeekStr, monthStr };
  }, [getLocalDateString]);

  // 2. Filter & Sort Tasks
  const processedTasks = useMemo(() => {
    let list = [...tasks];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(task => {
        const catName = categories.find(c => c.id === task.category)?.name.toLowerCase() || '';
        return (
          task.title.toLowerCase().includes(q) ||
          task.description.toLowerCase().includes(q) ||
          task.priority.toLowerCase().includes(q) ||
          catName.includes(q)
        );
      });
    }

    // Status Filter
    if (filters.status !== 'All') {
      if (filters.status === 'Completed') {
        list = list.filter(t => t.completed);
      } else if (filters.status === 'Pending') {
        list = list.filter(t => !t.completed && !t.missed);
      } else if (filters.status === 'Missed') {
        list = list.filter(t => t.missed);
      } else if (filters.status === 'Overdue') {
        list = list.filter(t => !t.completed && t.dueDate && t.dueDate < dates.todayStr);
      }
    }

    // Category Filter
    if (filters.category !== 'All') {
      list = list.filter(t => t.category === filters.category);
    }

    // Priority Filter
    if (filters.priority !== 'All') {
      list = list.filter(t => t.priority === filters.priority);
    }

    // TimeRange Filter
    if (filters.timeRange !== 'All') {
      if (filters.timeRange === 'Today') {
        list = list.filter(t => t.dueDate === dates.todayStr);
      } else if (filters.timeRange === 'Tomorrow') {
        list = list.filter(t => t.dueDate === dates.tomorrowStr);
      } else if (filters.timeRange === 'Week') {
        list = list.filter(t => t.dueDate >= dates.startOfWeekStr && t.dueDate <= dates.endOfWeekStr);
      } else if (filters.timeRange === 'Month') {
        list = list.filter(t => t.dueDate && t.dueDate.startsWith(dates.monthStr));
      }
    }

    // Sorting logic
    list.sort((a, b) => {
      switch (sortBy) {
        case SORT_OPTIONS.OLDEST:
          return new Date(a.createdDate) - new Date(b.createdDate);
        case SORT_OPTIONS.PRIORITY: {
          const pA = PRIORITIES[a.priority]?.value || 0;
          const pB = PRIORITIES[b.priority]?.value || 0;
          return pB - pA; // High priority first
        }
        case SORT_OPTIONS.DUE_DATE:
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.localeCompare(b.dueDate);
        case SORT_OPTIONS.ALPHABETICAL:
          return a.title.localeCompare(b.title);
        case SORT_OPTIONS.STATUS:
          // Completed first
          return (b.completed ? 1 : 0) - (a.completed ? 1 : 0);
        case SORT_OPTIONS.NEWEST:
        default:
          return new Date(b.createdDate) - new Date(a.createdDate);
      }
    });

    return list;
  }, [tasks, searchQuery, filters, sortBy, categories, dates]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      status: 'All',
      category: 'All',
      priority: 'All',
      timeRange: 'All',
    });
  };

  return (
    <div className="page-container">
      {/* Top Toolbar */}
      <section className="tasks-toolbar" aria-label="Toolbar controls">
        <div className="toolbar-left">
          <button 
            className={`toolbar-btn ${showFiltersPanel ? 'active' : ''}`}
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
          >
            <SlidersHorizontal size={18} />
            <span>Filters</span>
          </button>

          <div className="sort-select-wrap">
            <ArrowUpDown size={16} className="sort-icon" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="toolbar-select"
              aria-label="Sort options"
            >
              {Object.values(SORT_OPTIONS).map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>

        <button className="add-task-primary-btn" onClick={handleCreateClick}>
          <Plus size={20} />
          <span>Add Task</span>
        </button>
      </section>

      {/* Expandable Filter Panel */}
      {showFiltersPanel && (
        <section className="filter-panel-card glass-panel" aria-label="Filter parameters">
          <div className="filters-grid">
            {/* Status Filter */}
            <div className="filter-item-group">
              <label className="filter-label">Status</label>
              <div className="filter-pills-row">
                {['All', 'Pending', 'Completed', 'Missed', 'Overdue'].map(st => (
                  <button
                    key={st}
                    className={`filter-pill ${filters.status === st ? 'active' : ''}`}
                    onClick={() => handleFilterChange('status', st)}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* TimeRange Filter */}
            <div className="filter-item-group">
              <label className="filter-label">Due Date</label>
              <div className="filter-pills-row">
                {['All', 'Today', 'Tomorrow', 'Week', 'Month'].map(tr => (
                  <button
                    key={tr}
                    className={`filter-pill ${filters.timeRange === tr ? 'active' : ''}`}
                    onClick={() => handleFilterChange('timeRange', tr)}
                  >
                    {tr}
                  </button>
                ))}
              </div>
            </div>

            <div className="filters-double-col">
              {/* Category Filter */}
              <div className="filter-item-group flex-1">
                <label className="filter-label">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="filter-select-input"
                >
                  <option value="All">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Priority Filter */}
              <div className="filter-item-group flex-1">
                <label className="filter-label">Priority</label>
                <select
                  value={filters.priority}
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                  className="filter-select-input"
                >
                  <option value="All">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
          </div>

          <div className="filter-panel-actions">
            <button className="reset-filters-btn" onClick={handleResetFilters}>
              Reset Filters
            </button>
          </div>
        </section>
      )}

      {/* Task List */}
      <main className="tasks-list-container" aria-label="Tasks list">
        {processedTasks.length > 0 ? (
          <div className="tasks-cards-grid">
            {processedTasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onEdit={handleEditClick} 
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="tasks-empty-state glass-panel">
            <div className="empty-icon-wrap">
              <SearchCheck size={48} className="empty-icon" />
            </div>
            <h3 className="empty-title">No tasks found</h3>
            <p className="empty-desc">
              Try adjusting your search query, clearing active filters, or add a brand new task.
            </p>
            <button className="empty-action-btn" onClick={handleCreateClick}>
              Create Task
            </button>
          </div>
        )}
      </main>

      {/* Create / Edit Dialog */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        taskToEdit={taskToEdit}
      />
    </div>
  );
};
export default TasksPage;
