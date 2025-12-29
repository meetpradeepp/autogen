# ADR-004: Date Handling for Task Due Dates

## Context
Implementing task due dates (FE-201) requires:
- Date/time input from users
- Date formatting for display
- Timezone handling (local time for MVP)
- Storage as timestamp for consistency
- Prevention of invalid dates (e.g., Feb 30)

## Decision
**Use native HTML5 `datetime-local` input and `Intl.DateTimeFormat` API** instead of external libraries like date-fns.

## Alternatives Considered

### 1. date-fns Library (Rejected)
- **Pros:** 
  - Rich API with many formatting utilities
  - Tree-shakeable, modular design
  - Strong TypeScript support
  - Industry standard for date manipulation
- **Cons:** 
  - Adds ~13KB min+gzip to bundle (even with tree-shaking)
  - External dependency increases maintenance burden
  - Overkill for simple date display/input needs
  - Requires learning library-specific API
- **Reason for Rejection:** Violates zero-dependency principle; unnecessary complexity for this scope

### 2. Moment.js (Rejected)
- **Pros:** 
  - Mature ecosystem
  - Comprehensive feature set
- **Cons:** 
  - Large bundle size (~70KB min+gzip)
  - Mutable API is error-prone
  - Project in maintenance mode (no new features)
  - Does not support tree-shaking
- **Reason for Rejection:** Outdated and bloated; explicitly discouraged by maintainers

### 3. Native APIs (Selected)
- **Pros:** 
  - Zero bundle size impact
  - Built-in browser support (no polyfills needed for modern browsers)
  - HTML5 `datetime-local` provides native picker with validation
  - `Intl.DateTimeFormat` offers locale-aware formatting
  - No external dependencies to maintain
  - Perfectly aligned with "avoid over-engineering" principle
- **Cons:** 
  - More verbose API for complex date math (not needed for this feature)
  - Browser picker UI varies slightly across browsers
- **Reason for Selection:** Meets all requirements with zero overhead; leverages platform capabilities

## Implementation Details

### Date Storage
```typescript
interface Task {
  // ... existing fields
  dueDate?: number;  // Optional Unix timestamp (ms)
}
```
- Consistent with existing `createdAt` field
- Timezone-agnostic storage (UTC internally)

### Date Input
```html
<input 
  type="datetime-local" 
  value={dateValue}  
  onChange={handleChange}
/>
```
- Native browser validation prevents invalid dates (Feb 30, etc.)
- Consistent UX across task form
- Accessible by default (keyboard navigation, screen readers)

### Date Formatting
```typescript
const formatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true
});
formatter.format(new Date(dueDate));  // "Dec 29, 3:45 PM"
```
- Locale-aware (respects user's browser settings)
- Minimal code footprint

### Timezone Handling (MVP)
- **Input:** User selects date/time in their local timezone
- **Storage:** Stored as UTC timestamp (via `Date.now()` and `new Date(input).getTime()`)
- **Display:** Rendered in user's current local timezone
- **Edge Case:** User sets due date in NY, travels to London → due date shifts by timezone offset
  - **Accepted Trade-off:** For MVP, we prioritize simplicity over timezone persistence
  - **Future Enhancement:** Could add explicit timezone field if user requests it

### Invalid Date Prevention
- HTML5 `datetime-local` input enforces valid dates at browser level
- No Feb 30, no 25:00 hours, no manual parsing errors
- User cannot submit invalid date via UI

## Consequences

### Positive
- Zero external dependencies → no supply chain risk, no version conflicts
- Zero bundle size increase → faster page loads
- Browser handles validation → less error-handling code
- Native picker UX → familiar to users, accessible by default
- Future-proof → relies on web standards, not third-party library decisions

### Negative
- Browser picker UI varies (Chrome vs Firefox vs Safari)
  - **Mitigation:** Acceptable UX variance; core functionality identical
- No built-in relative date helpers ("2 days from now")
  - **Mitigation:** Not required for this feature scope

### Trade-offs
- **Chosen:** Simplicity over library power (native APIs vs date-fns)
- **Chosen:** Zero dependencies over consistency (varied browser pickers vs custom picker library)
- **Chosen:** Local timezone for MVP over complex timezone handling

## Validation Criteria
- [x] Due date input prevents invalid dates (Feb 30)
- [x] Due date persists to localStorage as timestamp
- [x] Due date displays in user's local timezone
- [x] No external date libraries in package.json
- [x] Bundle size unchanged

## Date
2024-12-29

## Status
**Accepted**

## Related ADRs
- ADR-001: Task Manager State Management (localStorage persistence)
