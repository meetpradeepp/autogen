# ADR-002: Multi-List Architecture with App Shell Layout

## Context
Building upon FE-101's single-list task manager, users need to organize tasks into separate named lists (e.g., "Work", "Groceries") to better manage different contexts. Additionally, the application layout needs to support navigation between these lists.

## Decision
**Implement multi-list support with an App Shell layout pattern**, extending the existing Context + useReducer architecture.

## Alternatives Considered

### 1. URL-based Routing with React Router (Rejected)
- **Pros:** Standard pattern for multi-view applications; browser back/forward support
- **Cons:** Over-engineering for state-based navigation; adds dependency; increases bundle size; violates "keep it lightweight" constraint
- **Reason for Rejection:** The technical constraint explicitly states "No Routing Libs" for MVP; state-based navigation is sufficient

### 2. Single Flat List with Tags (Rejected)
- **Pros:** Simpler data model; no UI changes needed
- **Cons:** Doesn't meet user story (separate *lists*, not tags); no clear navigation UI; harder to understand which tasks belong to which context
- **Reason for Rejection:** Doesn't satisfy the core requirement of "separate named lists"

### 3. Multi-List with App Shell Layout (Selected)
- **Pros:** Clear separation of concerns; scalable UI pattern; maintains Context + useReducer consistency; supports future features (list settings, drag-and-drop)
- **Cons:** More complex state structure; requires migration logic
- **Reason for Selection:** Best balance of user needs and technical constraints; follows industry-standard app shell pattern

## Implementation Details

### Data Structure Evolution
```typescript
// Before (FE-101)
interface TaskState {
  tasks: Task[];
  error: string | null;
}

// After (FE-102)
interface TaskState {
  lists: TodoList[];
  tasks: Task[];        // Now includes listId reference
  activeListId: string | null;
  error: string | null;
}
```

### New Components
- **Layout**: App shell container (Header + Sidebar + Main)
- **Header**: Fixed top bar with logo and application title
- **Sidebar**: Left navigation panel for list management

### Migration Strategy
- Detect legacy storage key `tasks`
- Create default "General" list
- Assign all existing tasks to this list
- Save to new storage key `taskManagerState`
- Remove legacy key after successful migration

### Reducer Actions Added
- `CREATE_LIST`: Validate name uniqueness (case-insensitive), create list, set as active
- `SWITCH_LIST`: Change active list to display different tasks
- `LOAD_STATE`: Hydrate full state from localStorage

## Consequences

### Positive
- Users can organize tasks into logical groups
- Clear visual separation via sidebar navigation
- Active list highlighting provides clear affordance
- Migration preserves all existing user data
- Layout pattern supports future enhancements (list deletion, reordering, search)

### Negative
- State structure is more complex (mitigated by comprehensive tests)
- Migration code adds one-time complexity (well-tested, gracefully degrades)
- No browser back/forward for list navigation (acceptable for MVP)

### Trade-offs
- **Chosen:** State-based navigation over URL routing (lightweight, simpler)
- **Chosen:** Automatic migration over manual import (better UX)
- **Chosen:** Fixed sidebar over collapsible (simpler MVP, responsive handled via min-width)

## Validation Criteria
- [x] Existing FE-101 tasks are migrated to "General" list without data loss
- [x] Duplicate list names are rejected with clear error message
- [x] Tasks are isolated to their respective lists
- [x] Active list is visually highlighted in sidebar
- [x] Empty states guide users appropriately
- [x] All tests pass (21/21)
- [x] No security vulnerabilities (CodeQL scan clean)

## Date
2024-12-24

## Status
**Accepted**

## Related
- Extends ADR-001 (Context + useReducer pattern)
- Implements FE-102 requirements
- Backward compatible with FE-101 data
