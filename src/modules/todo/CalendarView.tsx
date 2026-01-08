import { useState, useMemo } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import { TaskModal } from './EditTaskModal';
import { Task } from './types';
import styles from './CalendarView.module.css';
import { formatCreatedDate } from './utils';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  tasks: Task[];
}

function getPriorityIcon(priority: 'high' | 'medium' | 'low'): string {
  switch (priority) {
    case 'high':
      return '🔥';
    case 'medium':
      return '⚠️';
    case 'low':
      return '🟢';
  }
}

export function CalendarView() {
  const { state } = useTaskContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showPopover, setShowPopover] = useState<{ date: string; tasks: Task[] } | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [creatingTaskForDate, setCreatingTaskForDate] = useState<number | null>(null);

  // Generate calendar grid for current month
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of month and last day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get day of week for first day (0 = Sunday)
    const startingDayOfWeek = firstDay.getDay();
    
    // Get days from previous month to fill the grid
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const prevMonthDays = startingDayOfWeek;
    
    // Calculate total days to show (6 weeks max)
    const daysInMonth = lastDay.getDate();
    const totalDays = Math.ceil((startingDayOfWeek + daysInMonth) / 7) * 7;
    
    const days: CalendarDay[] = [];
    
    // Add previous month days
    for (let i = prevMonthDays - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, daysInPrevMonth - i);
      days.push({
        date,
        isCurrentMonth: false,
        tasks: getTasksForDate(date),
      });
    }
    
    // Add current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        isCurrentMonth: true,
        tasks: getTasksForDate(date),
      });
    }
    
    // Add next month days
    const remainingDays = totalDays - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        tasks: getTasksForDate(date),
      });
    }
    
    return days;
  }, [currentDate, state.tasks]);

  // Get tasks for a specific date
  function getTasksForDate(date: Date): Task[] {
    const dateStr = date.toDateString();
    return state.tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return taskDate.toDateString() === dateStr;
    });
  }

  // Navigate to previous month
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  // Navigate to next month
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  // Go to today
  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Get list color for a task
  const getListColor = (listId: string): string => {
    const list = state.lists.find(l => l.id === listId);
    return list?.color || '#CBD5E0';
  };

  // Handle clicking on an empty day or add button
  const handleAddTaskForDate = (date: Date, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    // Set due date to end of day (23:59:59.999) so task appears on that day
    const END_OF_DAY_HOURS = 23;
    const END_OF_DAY_MINUTES = 59;
    const END_OF_DAY_SECONDS = 59;
    const END_OF_DAY_MILLISECONDS = 999;
    
    const endOfDay = new Date(date);
    endOfDay.setHours(END_OF_DAY_HOURS, END_OF_DAY_MINUTES, END_OF_DAY_SECONDS, END_OF_DAY_MILLISECONDS);
    setCreatingTaskForDate(endOfDay.getTime());
  };

  // Handle clicking on a task
  const handleTaskClick = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    // Open edit task modal
    setEditingTask(task);
  };

  const handleCloseModal = () => {
    setEditingTask(null);
    setCreatingTaskForDate(null);
  };

  // Show popover with all tasks for a day
  const handleShowMore = (date: Date, tasks: Task[], e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPopover({ date: date.toDateString(), tasks });
  };

  // Close popover
  const handleClosePopover = () => {
    setShowPopover(null);
  };

  // Format month/year for header
  const monthYearFormat = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  });

  if (state.lists.length === 0) {
    return (
      <div className={styles.empty}>
        <p>Create a list to start using the calendar view!</p>
      </div>
    );
  }

  return (
    <div className={styles.calendarContainer}>
      {/* Header with navigation */}
      <div className={styles.header}>
        <h2 className={styles.monthYear}>{monthYearFormat.format(currentDate)}</h2>
        <div className={styles.navigation}>
          <button onClick={handleToday} className={styles.todayButton}>
            Today
          </button>
          <button onClick={handlePrevMonth} className={styles.navButton}>
            ◀
          </button>
          <button onClick={handleNextMonth} className={styles.navButton}>
            ▶
          </button>
        </div>
      </div>

      {/* Day of week headers */}
      <div className={styles.weekDays}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className={styles.weekDay}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className={styles.calendarGrid}>
        {calendarDays.map((day, index) => (
          <div
            key={index}
            className={`${styles.dayCell} ${
              !day.isCurrentMonth ? styles.otherMonth : ''
            } ${
              day.date.toDateString() === new Date().toDateString()
                ? styles.today
                : ''
            }`}
          >
            <div className={styles.dayCellHeader}>
              <div className={styles.dayNumber}>{day.date.getDate()}</div>
              <button
                className={styles.addButton}
                onClick={(e) => handleAddTaskForDate(day.date, e)}
                aria-label={`Add task for ${day.date.toLocaleDateString()}`}
                title="Add task for this day"
              >
                +
              </button>
            </div>
            <div className={styles.taskContainer}>
              {day.tasks.slice(0, 3).map(task => (
                <div
                  key={task.id}
                  className={styles.taskPill}
                  style={{ backgroundColor: getListColor(task.listId) }}
                  title={`${task.description} (Created: ${formatCreatedDate(task.createdAt)})`}
                >
                  <span className={styles.priorityIcon}>
                    {getPriorityIcon(task.priority)}
                  </span>
                  <span className={styles.taskText}>{task.description}</span>
                  <button
                    className={styles.editIconButton}
                    onClick={(e) => handleTaskClick(task, e)}
                    aria-label={`Edit task: ${task.description}`}
                  >
                    ✏️
                  </button>
                </div>
              ))}
              {day.tasks.length > 3 && (
                <button
                  className={styles.showMoreButton}
                  onClick={(e) => handleShowMore(day.date, day.tasks, e)}
                >
                  +{day.tasks.length - 3} more
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Popover for showing all tasks */}
      {showPopover && (
        <div className={styles.popoverOverlay} onClick={handleClosePopover}>
          <div className={styles.popover} onClick={(e) => e.stopPropagation()}>
            <div className={styles.popoverHeader}>
              <h3>
                {new Date(showPopover.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </h3>
              <button onClick={handleClosePopover} className={styles.closeButton}>
                ✕
              </button>
            </div>
            <div className={styles.popoverContent}>
              {showPopover.tasks.map(task => (
                <div
                  key={task.id}
                  className={styles.popoverTask}
                  style={{ borderLeftColor: getListColor(task.listId) }}
                >
                  <span className={styles.priorityIcon}>
                    {getPriorityIcon(task.priority)}
                  </span>
                  <span className={styles.taskText}>{task.description}</span>
                  <button
                    className={styles.popoverEditButton}
                    onClick={(e) => handleTaskClick(task, e)}
                    aria-label={`Edit task: ${task.description}`}
                  >
                    ✏️
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile agenda view */}
      <div className={styles.agendaView}>
        <h3 className={styles.agendaTitle}>Upcoming Tasks</h3>
        {calendarDays
          .filter(day => day.isCurrentMonth && day.tasks.length > 0)
          .map((day, index) => (
            <div key={index} className={styles.agendaDay}>
              <div className={styles.agendaDate}>
                {day.date.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
              <div className={styles.agendaTasks}>
                {day.tasks.map(task => (
                  <div
                    key={task.id}
                    className={styles.agendaTask}
                    style={{ borderLeftColor: getListColor(task.listId) }}
                  >
                    <span className={styles.priorityIcon}>
                      {getPriorityIcon(task.priority)}
                    </span>
                    <span className={styles.taskText}>{task.description}</span>
                    <button
                      className={styles.agendaEditButton}
                      onClick={(e) => handleTaskClick(task, e)}
                      aria-label={`Edit task: ${task.description}`}
                    >
                      ✏️
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        {calendarDays.filter(day => day.isCurrentMonth && day.tasks.length > 0).length === 0 && (
          <p className={styles.agendaEmpty}>No scheduled tasks this month</p>
        )}
      </div>
      
      {editingTask && (
        <TaskModal
          task={editingTask}
          onClose={handleCloseModal}
        />
      )}
      
      {creatingTaskForDate && (
        <TaskModal
          initialDueDate={creatingTaskForDate}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
