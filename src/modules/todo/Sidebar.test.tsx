import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from './Sidebar';
import { TaskProvider } from '../../context/TaskContext';
import { ToastProvider } from '../../context/ToastContext';

// Wrapper component to provide necessary context
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <TaskProvider>{children}</TaskProvider>
    </ToastProvider>
  );
}

describe('Sidebar', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Views Section', () => {
    it('should render Views section with Dashboard and Calendar buttons', () => {
      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      expect(screen.getByRole('heading', { name: 'Views' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '📊 Dashboard' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '📅 Calendar' })).toBeInTheDocument();
    });

    it('should have Dashboard active by default', () => {
      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      const dashboardButton = screen.getByRole('button', { name: '📊 Dashboard' });
      expect(dashboardButton.className).toContain('active');
    });

    it('should disable Calendar button when no lists exist', () => {
      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      const calendarButton = screen.getByRole('button', { name: '📅 Calendar' });
      expect(calendarButton).toBeDisabled();
    });

    it('should switch to Calendar view when Calendar button is clicked', () => {
      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      // Create a list first to enable the calendar button
      const newListButton = screen.getByRole('button', { name: '+ New List' });
      fireEvent.click(newListButton);

      const listNameInput = screen.getByLabelText('New list name');
      fireEvent.change(listNameInput, { target: { value: 'Test List' } });

      const saveButton = screen.getByRole('button', { name: 'Save' });
      fireEvent.click(saveButton);

      // Now calendar should be enabled
      const calendarButton = screen.getByRole('button', { name: '📅 Calendar' });
      expect(calendarButton).not.toBeDisabled();

      fireEvent.click(calendarButton);
      expect(calendarButton.className).toContain('active');

      const dashboardButton = screen.getByRole('button', { name: '📊 Dashboard' });
      expect(dashboardButton.className).not.toContain('active');
    });
  });

  describe('Task Lists Section', () => {
    it('should render Task Lists section header', () => {
      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      expect(screen.getByRole('heading', { name: 'Task Lists' })).toBeInTheDocument();
    });

    it('should show "No lists yet" when no lists exist', () => {
      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      expect(screen.getByText('No lists yet')).toBeInTheDocument();
    });

    it('should NOT show hardcoded "Tasks" button', () => {
      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      // The old "📋 Tasks" button should not exist
      const tasksButton = screen.queryByRole('button', { name: '📋 Tasks' });
      expect(tasksButton).not.toBeInTheDocument();
    });

    it('should render user-created lists dynamically', () => {
      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      // Create first list
      const newListButton = screen.getByRole('button', { name: '+ New List' });
      fireEvent.click(newListButton);

      const listNameInput = screen.getByLabelText('New list name');
      fireEvent.change(listNameInput, { target: { value: 'Work' } });

      const saveButton = screen.getByRole('button', { name: 'Save' });
      fireEvent.click(saveButton);

      // Verify "No lists yet" is gone
      expect(screen.queryByText('No lists yet')).not.toBeInTheDocument();

      // Verify the list appears
      expect(screen.getByRole('button', { name: 'Work' })).toBeInTheDocument();
    });

    it('should switch to dashboard view when clicking a list', () => {
      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      // Create a list
      const newListButton = screen.getByRole('button', { name: '+ New List' });
      fireEvent.click(newListButton);

      const listNameInput = screen.getByLabelText('New list name');
      fireEvent.change(listNameInput, { target: { value: 'Personal' } });

      const saveButton = screen.getByRole('button', { name: 'Save' });
      fireEvent.click(saveButton);

      // Switch to calendar view first
      const calendarButton = screen.getByRole('button', { name: '📅 Calendar' });
      fireEvent.click(calendarButton);
      expect(calendarButton.className).toContain('active');

      // Click on the list
      const listButton = screen.getByRole('button', { name: 'Personal' });
      fireEvent.click(listButton);

      // Should be back in dashboard view
      const dashboardButton = screen.getByRole('button', { name: '📊 Dashboard' });
      expect(dashboardButton.className).toContain('active');
      expect(calendarButton.className).not.toContain('active');
    });

    it('should show delete button for user-created lists', () => {
      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      // Create a list
      const newListButton = screen.getByRole('button', { name: '+ New List' });
      fireEvent.click(newListButton);

      const listNameInput = screen.getByLabelText('New list name');
      fireEvent.change(listNameInput, { target: { value: 'Test' } });

      const saveButton = screen.getByRole('button', { name: 'Save' });
      fireEvent.click(saveButton);

      // Verify delete button exists
      expect(screen.getByRole('button', { name: 'Delete Test' })).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should show "No lists yet" after deleting all lists', () => {
      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      // Create a list
      const newListButton = screen.getByRole('button', { name: '+ New List' });
      fireEvent.click(newListButton);

      const listNameInput = screen.getByLabelText('New list name');
      fireEvent.change(listNameInput, { target: { value: 'Temporary' } });

      const saveButton = screen.getByRole('button', { name: 'Save' });
      fireEvent.click(saveButton);

      // Verify list exists
      expect(screen.getByRole('button', { name: 'Temporary' })).toBeInTheDocument();
      expect(screen.queryByText('No lists yet')).not.toBeInTheDocument();

      // Delete the list (mock confirm dialog)
      window.confirm = () => true;
      const deleteButton = screen.getByRole('button', { name: 'Delete Temporary' });
      fireEvent.click(deleteButton);

      // Should show "No lists yet" again
      expect(screen.getByText('No lists yet')).toBeInTheDocument();
    });

    it('should keep Views section visible and functional when no lists exist', () => {
      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      // Views should be visible
      expect(screen.getByRole('heading', { name: 'Views' })).toBeInTheDocument();
      
      // Dashboard should be clickable
      const dashboardButton = screen.getByRole('button', { name: '📊 Dashboard' });
      expect(dashboardButton).not.toBeDisabled();
      
      // Calendar should be disabled
      const calendarButton = screen.getByRole('button', { name: '📅 Calendar' });
      expect(calendarButton).toBeDisabled();
    });
  });

  describe('Selection State', () => {
    it('should highlight only the active view when in Calendar', () => {
      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      // Create a list
      const newListButton = screen.getByRole('button', { name: '+ New List' });
      fireEvent.click(newListButton);

      const listNameInput = screen.getByLabelText('New list name');
      fireEvent.change(listNameInput, { target: { value: 'Work' } });

      const saveButton = screen.getByRole('button', { name: 'Save' });
      fireEvent.click(saveButton);

      // Click Calendar
      const calendarButton = screen.getByRole('button', { name: '📅 Calendar' });
      fireEvent.click(calendarButton);

      // Only calendar should be active
      expect(calendarButton.className).toContain('active');
      
      const dashboardButton = screen.getByRole('button', { name: '📊 Dashboard' });
      expect(dashboardButton.className).not.toContain('active');
    });

    it('should highlight list when clicked from dashboard', () => {
      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      // Create two lists
      let newListButton = screen.getByRole('button', { name: '+ New List' });
      
      // Create first list
      fireEvent.click(newListButton);
      let listNameInput = screen.getByLabelText('New list name');
      fireEvent.change(listNameInput, { target: { value: 'Work' } });
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));

      // Create second list
      newListButton = screen.getByRole('button', { name: '+ New List' });
      fireEvent.click(newListButton);
      listNameInput = screen.getByLabelText('New list name');
      fireEvent.change(listNameInput, { target: { value: 'Personal' } });
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));

      // Click on Work list
      const workButton = screen.getByRole('button', { name: 'Work' });
      fireEvent.click(workButton);

      // Work should be highlighted (has active class on parent)
      expect(workButton.parentElement?.className).toContain('active');

      // Personal should not be highlighted
      const personalButton = screen.getByRole('button', { name: 'Personal' });
      expect(personalButton.parentElement?.className).not.toContain('active');
    });
  });
});
