import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Header } from './Header';
import { CompactModeProvider } from '../../context/CompactModeContext';

function renderHeader(initialRoute: string = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <CompactModeProvider>
        <Header />
      </CompactModeProvider>
    </MemoryRouter>
  );
}

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Basic Rendering', () => {
    it('should render logo and title', () => {
      renderHeader('/');
      
      expect(screen.getByText('Task Manager')).toBeInTheDocument();
      expect(screen.getByText('✓')).toBeInTheDocument();
    });
  });

  describe('Compact Mode Toggle Visibility', () => {
    it('should hide toggle on Dashboard route (/)', () => {
      renderHeader('/');
      
      expect(screen.queryByLabelText('Toggle compact view')).not.toBeInTheDocument();
      expect(screen.queryByText('Compact View')).not.toBeInTheDocument();
    });

    it('should hide toggle on Calendar route (/calendar)', () => {
      renderHeader('/calendar');
      
      expect(screen.queryByLabelText('Toggle compact view')).not.toBeInTheDocument();
      expect(screen.queryByText('Compact View')).not.toBeInTheDocument();
    });

    it('should show toggle on Task List route (/list/:id)', () => {
      renderHeader('/list/test-list-123');
      
      expect(screen.getByLabelText('Toggle compact view')).toBeInTheDocument();
      expect(screen.getByText('Compact View')).toBeInTheDocument();
    });

    it('should show toggle on different list IDs', () => {
      renderHeader('/list/another-list-456');
      
      expect(screen.getByLabelText('Toggle compact view')).toBeInTheDocument();
      expect(screen.getByText('Compact View')).toBeInTheDocument();
    });

    it('should hide toggle on invalid routes (404)', () => {
      renderHeader('/invalid-route');
      
      expect(screen.queryByLabelText('Toggle compact view')).not.toBeInTheDocument();
      expect(screen.queryByText('Compact View')).not.toBeInTheDocument();
    });

    it('should hide toggle on nested routes under root', () => {
      renderHeader('/some/other/path');
      
      expect(screen.queryByLabelText('Toggle compact view')).not.toBeInTheDocument();
      expect(screen.queryByText('Compact View')).not.toBeInTheDocument();
    });
  });

  describe('State Persistence', () => {
    it('should preserve compact mode state in localStorage when toggle is hidden', () => {
      // Enable compact mode
      localStorage.setItem('compactViewEnabled', 'true');
      
      // Render on dashboard (toggle hidden)
      renderHeader('/');
      
      // Verify toggle is not visible on dashboard
      expect(screen.queryByLabelText('Toggle compact view')).not.toBeInTheDocument();
      
      // Verify localStorage still has the value (state not lost)
      expect(localStorage.getItem('compactViewEnabled')).toBe('true');
    });

    it('should load compact mode state from localStorage when rendering on list view', () => {
      // Pre-set compact mode in localStorage
      localStorage.setItem('compactViewEnabled', 'true');
      
      // Render on list view
      renderHeader('/list/test-123');
      
      // Toggle should be visible and checked
      const checkbox = screen.getByLabelText('Toggle compact view') as HTMLInputElement;
      expect(checkbox).toBeInTheDocument();
      expect(checkbox.checked).toBe(true);
    });
  });
});
