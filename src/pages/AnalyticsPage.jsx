import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  calculateTodayStats, 
  calculateProductivityScore, 
  calculateStreaks, 
  calculateTrendData, 
  calculateWeekdayPerformance, 
  calculateWeeklyMonthlyMilestones, 
  calculateCategoryPerformance, 
  calculatePriorityBreakdown, 
  calculateHabitConsistency, 
  generateSmartInsights,
  formatTime
} from '../utils/productivityUtils';
import { 
  Download, 
  Flame, 
  Activity, 
  Filter, 
  Sparkles, 
  AlertCircle, 
  CheckCircle, 
  HelpCircle, 
  Clock, 
  Layers, 
  Brain 
} from 'lucide-react';
import { FocusAnalytics } from '../components/DeepFocus/FocusAnalytics';
import './AnalyticsPage.css';

export const AnalyticsPage = () => {
  const { tasks, categories, focusSessions } = useApp();

  // Local state scopes
  const [trendDays, setTrendDays] = useState(7); // 7 | 30 | 90
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [hoveredPoint, setHoveredPoint] = useState(null); // tooltip hover state for line chart
  const [hoveredHeatmap, setHoveredHeatmap] = useState(null); // tooltip hover state for heatmap

  // Apply basic toolbar filters to the tasks list for overall stats calculation
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchCat = filterCategory === 'All' || t.category === filterCategory;
      const matchPrio = filterPriority === 'All' || t.priority === filterPriority;
      return matchCat && matchPrio;
    });
  }, [tasks, filterCategory, filterPriority]);

  // Compute Core Metrics
  const todayStats = useMemo(() => calculateTodayStats(filteredTasks), [filteredTasks]);
  const overallStats = useMemo(() => calculateProductivityScore(filteredTasks), [filteredTasks]);
  const streakStats = useMemo(() => calculateStreaks(filteredTasks), [filteredTasks]);
  
  const trendData = useMemo(() => calculateTrendData(filteredTasks, trendDays), [filteredTasks, trendDays]);
  const weekdayData = useMemo(() => calculateWeekdayPerformance(filteredTasks), [filteredTasks]);
  const milestoneStats = useMemo(() => calculateWeeklyMonthlyMilestones(filteredTasks), [filteredTasks]);
  const categoryStats = useMemo(() => calculateCategoryPerformance(filteredTasks, categories), [filteredTasks, categories]);
  const priorityStats = useMemo(() => calculatePriorityBreakdown(filteredTasks), [filteredTasks]);
  const habitStats = useMemo(() => calculateHabitConsistency(filteredTasks), [filteredTasks]);
  
  const smartInsights = useMemo(() => generateSmartInsights(filteredTasks, categories, streakStats), [filteredTasks, categories, streakStats]);

  // Perfect vs Missed Days counts
  const perfectDaysCount = useMemo(() => {
    // Unique dates in history
    const uniqueDates = Array.from(new Set(filteredTasks.map(t => t.dueDate).filter(Boolean)));
    return uniqueDates.filter(dateStr => {
      const dayTasks = filteredTasks.filter(t => t.dueDate === dateStr);
      return dayTasks.length > 0 && dayTasks.every(t => t.completed);
    }).length;
  }, [filteredTasks]);

  // Focus specific insights
  const focusInsights = useMemo(() => {
    const totalTime = focusSessions.reduce((acc, s) => acc + s.duration, 0);
    
    // Most productive hour
    const hourCounts = {};
    focusSessions.forEach(s => {
      const d = new Date(s.timestamp);
      const h = d.getHours();
      hourCounts[h] = (hourCounts[h] || 0) + s.duration;
    });
    let maxHour = -1;
    let maxHourDur = 0;
    for (const h in hourCounts) {
      if (hourCounts[h] > maxHourDur) {
        maxHour = h;
        maxHourDur = hourCounts[h];
      }
    }
    const mostProductiveHour = maxHour >= 0 ? `${maxHour}:00 - ${parseInt(maxHour)+1}:00` : 'Not enough data';

    return {
      totalTime: formatTime(totalTime),
      mostProductiveHour
    };
  }, [focusSessions]);

  // 1. Export CSV Handler
  const handleExportCSV = () => {
    const uniqueDates = Array.from(new Set(filteredTasks.map(t => t.dueDate).filter(Boolean))).sort();
    
    const rows = [['Date', 'Total Tasks', 'Completed Tasks', 'Completion Rate %']];
    uniqueDates.forEach(dateStr => {
      const dayTasks = filteredTasks.filter(t => t.dueDate === dateStr);
      const total = dayTasks.length;
      const completed = dayTasks.filter(t => t.completed).length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      rows.push([dateStr, total, completed, `${rate}%`]);
    });

    const csvText = rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `focusflow_productivity_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 2. Export JSON Handler
  const handleExportJSON = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      overall: {
        score: overallStats.score,
        level: overallStats.level,
        totalTasks: overallStats.total,
        completedTasks: overallStats.completed
      },
      streaks: {
        currentStreak: streakStats.currentStreak,
        longestStreak: streakStats.longestStreak
      },
      categoryAnalysis: categoryStats.categoriesList.map(c => ({
        name: c.name,
        total: c.total,
        completed: c.completed,
        rate: c.rate
      })),
      priorityAnalysis: priorityStats,
      habits: habitStats.list,
      insights: smartInsights.map(ins => ins.text)
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `focusflow_productivity_report_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 3. Generate coordinates for Daily Productivity SVG Line Chart
  const svgLineCoordinates = useMemo(() => {
    const width = 600;
    const height = 240;
    const padding = 30;

    if (trendData.length < 2) return { path: '', points: [] };

    const points = trendData.map((d, index) => {
      const x = padding + (index / (trendData.length - 1)) * (width - 2 * padding);
      const y = height - padding - (d.rate / 100) * (height - 2 * padding);
      return { x, y, data: d };
    });

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }

    return { path, points };
  }, [trendData]);

  // 4. Generate Heatmap Squares (Last 12 weeks = 84 days)
  const heatmapSquares = useMemo(() => {
    const squares = [];
    const today = new Date();

    for (let i = 83; i >= 0; i--) {
      const temp = new Date(today);
      temp.setDate(today.getDate() - i);
      const dateStr = temp.getFullYear() + '-' + String(temp.getMonth() + 1).padStart(2, '0') + '-' + String(temp.getDate()).padStart(2, '0');
      
      const dayTasks = filteredTasks.filter(t => t.dueDate === dateStr);
      const total = dayTasks.length;
      const completed = dayTasks.filter(t => t.completed).length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

      let colorClass = 'gray'; // Default
      if (total > 0) {
        if (rate === 100) colorClass = 'green';
        else if (rate >= 80) colorClass = 'light-green';
        else if (rate >= 50) colorClass = 'yellow';
        else if (rate >= 20) colorClass = 'orange';
        else colorClass = 'red';
      }

      squares.push({
        dateStr,
        label: temp.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        colorClass,
        total,
        completed,
        rate
      });
    }

    return squares;
  }, [filteredTasks]);

  return (
    <div className="page-container analytics-page">
      {/* FILTER BAR ROW */}
      <section className="analytics-toolbar-bar glass-panel" aria-label="Analytics filter toolbar">
        <div className="toolbar-title-section">
          <Activity size={18} className="title-icon" />
          <h2 className="toolbar-section-title">Productivity Insights</h2>
        </div>

        <div className="toolbar-actions-section">
          {/* Category Filter */}
          <div className="filter-select-group">
            <Filter size={13} />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="analytics-select"
            >
              <option value="All">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="filter-select-group">
            <Layers size={13} />
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="analytics-select"
            >
              <option value="All">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Export options */}
          <div className="export-buttons-group">
            <button className="export-action-btn" onClick={handleExportCSV}>
              <Download size={14} /> Export CSV
            </button>
            <button className="export-action-btn" onClick={handleExportJSON}>
              <Download size={14} /> Export JSON
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 1: SUMMARY STATS CARDS */}
      <section className="analytics-stats-grid" aria-label="Summary score stats">
        <div className="analytics-stat-card glass-panel">
          <span className="card-label">Overall Completion</span>
          <span className="card-value">{overallStats.score}%</span>
          <span className="card-sub-info">Rating: {overallStats.level}</span>
        </div>

        <div className="analytics-stat-card glass-panel">
          <span className="card-label">Today's Performance</span>
          <span className="card-value">{todayStats.rate}%</span>
          <span className="card-sub-info">{todayStats.completed} of {todayStats.total} done</span>
        </div>

        <div className="analytics-stat-card glass-panel">
          <span className="card-label">Perfect Days</span>
          <span className="card-value font-emerald">{perfectDaysCount}</span>
          <span className="card-sub-info">100% completed days</span>
        </div>

        <div className="analytics-stat-card glass-panel">
          <span className="card-label">Streaks</span>
          <span className="card-value flex-align">
            <Flame className="flame-active" size={24} /> {streakStats.currentStreak}d
          </span>
          <span className="card-sub-info">Longest: {streakStats.longestStreak} days</span>
        </div>
      </section>

      {/* SECTION 1.5: FOCUS QUICK SUMMARY */}
      <section className="analytics-stats-grid" aria-label="Focus summary stats" style={{ marginTop: '1.5rem' }}>
        <div className="analytics-stat-card glass-panel" style={{ borderLeft: '3px solid #6366f1' }}>
          <span className="card-label">Total Focus Time</span>
          <span className="card-value flex-align">
            <Brain size={24} color="#6366f1" /> {focusInsights.totalTime}
          </span>
          <span className="card-sub-info">Lifetime duration</span>
        </div>
        <div className="analytics-stat-card glass-panel" style={{ borderLeft: '3px solid #10b981' }}>
          <span className="card-label">Most Productive Hour</span>
          <span className="card-value flex-align">
            <Clock size={24} color="#10b981" />
          </span>
          <span className="card-sub-info" style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '0.25rem' }}>
            {focusInsights.mostProductiveHour}
          </span>
        </div>
      </section>

      {/* MAIN LAYOUT COLUMNS */}
      <div className="analytics-two-columns">
        
        {/* LEFT COLUMN: CHARTS TRENDS, BAR WEEKLY */}
        <div className="analytics-col-left">
          
          {/* NEW: FOCUS ANALYTICS WIDGET */}
          <FocusAnalytics />

          {/* SECTION 2: DAILY PRODUCTIVITY TREND LINE CHART */}
          <div className="chart-panel-card glass-panel">
            <div className="chart-header-row">
              <h3 className="chart-panel-title">Productivity Trend</h3>
              <div className="chart-segmented-control">
                {[7, 30, 90].map(days => (
                  <button
                    key={days}
                    className={`segmented-item ${trendDays === days ? 'active' : ''}`}
                    onClick={() => setTrendDays(days)}
                  >
                    {days} Days
                  </button>
                ))}
              </div>
            </div>

            <div className="svg-chart-wrapper">
              <svg viewBox="0 0 600 240" className="trend-svg">
                {/* Horizontal grid lines */}
                {[0, 25, 50, 75, 100].map(val => {
                  const y = 240 - 30 - (val / 100) * 180;
                  return (
                    <g key={val}>
                      <line x1="30" y1={y} x2="570" y2={y} stroke="var(--border-color)" strokeWidth="1" strokeDasharray="3" />
                      <text x="15" y={y + 4} fontSize="9" fill="var(--text-tertiary)" textAnchor="end">{val}%</text>
                    </g>
                  );
                })}

                {/* Trend line path */}
                {svgLineCoordinates.path && (
                  <path
                    d={svgLineCoordinates.path}
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Plot dots */}
                {svgLineCoordinates.points.map((pt, idx) => (
                  <circle
                    key={idx}
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredPoint === idx ? '6' : '3.5'}
                    fill="var(--surface)"
                    stroke="var(--primary)"
                    strokeWidth="2.5"
                    onMouseEnter={() => setHoveredPoint(idx)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                  />
                ))}
              </svg>

              {/* Dynamic Line Chart Tooltip */}
              {hoveredPoint !== null && svgLineCoordinates.points[hoveredPoint] && (
                <div 
                  className="chart-tooltip glass-panel animate-fade-in"
                  style={{
                    left: `${(svgLineCoordinates.points[hoveredPoint].x / 600) * 100}%`,
                    top: `${(svgLineCoordinates.points[hoveredPoint].y / 240) * 100 - 25}%`
                  }}
                >
                  <div className="tooltip-date">{svgLineCoordinates.points[hoveredPoint].data.label}</div>
                  <div className="tooltip-value">Rate: <strong>{svgLineCoordinates.points[hoveredPoint].data.rate}%</strong></div>
                  <div className="tooltip-ratio">({svgLineCoordinates.points[hoveredPoint].data.completed}/{svgLineCoordinates.points[hoveredPoint].data.total} tasks)</div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: WEEKLY REPORT BAR CHART */}
          <div className="chart-panel-card glass-panel">
            <h3 className="chart-panel-title">Weekly Performance Breakdown</h3>
            <div className="weekly-bar-chart-container">
              {weekdayData.map((w, idx) => (
                <div key={idx} className="bar-column-wrap">
                  <div className="bar-value-above">{w.rate}%</div>
                  <div className="bar-track">
                    <div 
                      className={`bar-fill filled-${w.rate === 100 ? 'green' : w.rate >= 80 ? 'light-green' : w.rate >= 50 ? 'yellow' : w.rate >= 20 ? 'orange' : 'red'}`}
                      style={{ height: `${w.rate}%` }}
                    />
                  </div>
                  <span className="bar-day-name">{w.day.substring(0, 3)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 8: GITHUB HEATMAP MATRIX */}
          <div className="chart-panel-card glass-panel">
            <div className="heatmap-header-row">
              <h3 className="chart-panel-title">Consistency Heatmap</h3>
              <span className="heatmap-legend-label">Last 12 Weeks</span>
            </div>
            
            <div className="heatmap-grid-wrap">
              <div className="heatmap-grid">
                {heatmapSquares.map((sq, idx) => (
                  <button
                    key={`${sq.dateStr}-${idx}`}
                    className={`heatmap-square sq-${sq.colorClass}`}
                    onMouseEnter={() => setHoveredHeatmap(idx)}
                    onMouseLeave={() => setHoveredHeatmap(null)}
                    aria-label={`Productivity level on ${sq.label}`}
                  />
                ))}
              </div>

              {/* Dynamic Heatmap Hover Tooltip */}
              {hoveredHeatmap !== null && heatmapSquares[hoveredHeatmap] && (
                <div 
                  className="heatmap-tooltip glass-panel animate-fade-in"
                  style={{
                    left: `${((hoveredHeatmap % 12) / 12) * 100}%`,
                    top: `${(Math.floor(hoveredHeatmap / 12) / 7) * 100 + 40}%`
                  }}
                >
                  <div className="tooltip-date">{heatmapSquares[hoveredHeatmap].label}</div>
                  <div className="tooltip-value">Productivity: <strong>{heatmapSquares[hoveredHeatmap].rate}%</strong></div>
                  <div className="tooltip-ratio">{heatmapSquares[hoveredHeatmap].completed} of {heatmapSquares[hoveredHeatmap].total} completed</div>
                </div>
              )}
            </div>

            {/* Heatmap Legend */}
            <div className="heatmap-legend">
              <span className="legend-text">Less</span>
              <div className="legend-box sq-gray" />
              <div className="legend-box sq-red" />
              <div className="legend-box sq-orange" />
              <div className="legend-box sq-yellow" />
              <div className="legend-box sq-light-green" />
              <div className="legend-box sq-green" />
              <span className="legend-text">More</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CATEGORIES, INSIGHTS, HABITS */}
        <div className="analytics-col-right">
          
          {/* SECTION 9: SMART INSIGHTS */}
          <div className="insight-panel-card glass-panel">
            <h3 className="chart-panel-title">
              <Sparkles size={16} className="sparkle-active" /> Smart Insights
            </h3>
            <div className="insights-vertical-list">
              {smartInsights.map((ins, idx) => (
                <div key={idx} className={`insight-card-item ins-${ins.type}`}>
                  <div className="insight-card-icon">
                    {ins.type === 'success' ? <CheckCircle size={15} /> : ins.type === 'warning' ? <AlertCircle size={15} /> : <HelpCircle size={15} />}
                  </div>
                  <p className="insight-card-text">{ins.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 5: CATEGORY ANALYSIS GAUGE LIST */}
          <div className="insight-panel-card glass-panel">
            <h3 className="chart-panel-title">Category Performance</h3>
            <div className="category-performance-list">
              {categoryStats.categoriesList.map(cat => (
                <div key={cat.id} className="category-gauge-row">
                  <div className="gauge-label-line">
                    <span className="gauge-cat-name flex-align">
                      <span className="cat-color-dot" style={{ backgroundColor: cat.color }} /> {cat.name}
                    </span>
                    <span className="gauge-cat-rate">{cat.rate}% ({cat.completed}/{cat.total})</span>
                  </div>
                  <div className="gauge-bar-track">
                    <div 
                      className="gauge-bar-fill"
                      style={{ 
                        width: `${cat.rate}%`, 
                        backgroundColor: cat.color || 'var(--primary)' 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 6: PRIORITY BREAKDOWN DATA TABLE */}
          <div className="insight-panel-card glass-panel">
            <h3 className="chart-panel-title">Priority Breakdown</h3>
            <div className="priority-table">
              <div className="table-header-row">
                <span>Priority</span>
                <span>Rate %</span>
                <span>Miss %</span>
                <span>Avg Time</span>
              </div>
              {Object.keys(priorityStats).map(prioKey => {
                const stat = priorityStats[prioKey];
                return (
                  <div key={prioKey} className="table-body-row">
                    <span className="prio-cell-name capitalize">{prioKey}</span>
                    <span className="prio-cell-rate font-emerald">{stat.rate}%</span>
                    <span className="prio-cell-miss font-red">{stat.missRate}%</span>
                    <span className="prio-cell-time flex-align"><Clock size={11} /> {stat.avgTimeText}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 7: HABIT CONSISTENCY STREAKS */}
          <div className="insight-panel-card glass-panel">
            <h3 className="chart-panel-title">Habit Consistency Streaks</h3>
            <div className="habits-streaks-list">
              {habitStats.list.length > 0 ? (
                habitStats.list.map(hb => (
                  <div key={hb.id} className="habit-streak-card glass-panel">
                    <div className="habit-streak-left">
                      <span className="habit-title-text">{hb.title}</span>
                      <span className="habit-ratio-text">{hb.completed} of {hb.total} completed ({hb.rate}%)</span>
                    </div>
                    <div className="habit-streak-right">
                      <span className="habit-streak-badge flex-align">
                        <Flame className="flame-active" size={14} /> {hb.streak}d streak
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-habits-text">Create recurring tasks to trace habit streaks here.</p>
              )}
            </div>
          </div>

          {/* SECTION 10: GOALS & MILESTONES */}
          <div className="insight-panel-card glass-panel">
            <h3 className="chart-panel-title">Milestone Progress Goals</h3>
            <div className="milestone-goals-list">
              {/* Weekly Goal */}
              <div className="milestone-goal-row">
                <div className="milestone-labels">
                  <span className="goal-label-text">Weekly Goal Target (70%)</span>
                  <span className="goal-percent-text">{milestoneStats.week.rate}%</span>
                </div>
                <div className="goal-slider-track">
                  <div className="goal-slider-fill" style={{ width: `${milestoneStats.week.rate}%` }} />
                </div>
                <span className="goal-estimate-text">
                  {milestoneStats.week.completed} of {milestoneStats.week.total} tasks done this week
                </span>
              </div>

              {/* Monthly Goal */}
              <div className="milestone-goal-row">
                <div className="milestone-labels">
                  <span className="goal-label-text">Monthly Goal Target (80%)</span>
                  <span className="goal-percent-text">{milestoneStats.month.rate}%</span>
                </div>
                <div className="goal-slider-track">
                  <div className="goal-slider-fill" style={{ width: `${milestoneStats.month.rate}%` }} />
                </div>
                <span className="goal-estimate-text">
                  {milestoneStats.month.completed} of {milestoneStats.month.total} tasks done this month
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
export default AnalyticsPage;
