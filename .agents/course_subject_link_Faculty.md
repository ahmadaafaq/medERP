Apply the dynamic Course and Subject Linker concept to the faculty page at `<PAGE_ROUTE>`:

1. Import and use `FacultyAcademicCascadingDropdown` from `@/components/faculty/FacultyAcademicCascadingDropdown`.
2. Connect `onSelectionChange={(state: AcademicCascadingState) => handleAcademicCascadeChange(state)}`.
3. Configure the component with `onlyLinkedSubjects={true}`, `showSection={true}`, and `showSubject={true}`.
4. Do not hardcode course IDs, branch codes, batch codes, or semester numbers; derive all cascading state dynamically from `AcademicCascadingState` (`state.college`, `state.course`, `state.branch`, `state.batch`, `state.semester`, `state.section`, `state.subject`).
5. Ensure all subjects linked to the faculty member (both theory and lab/practical) are visible and selectable without artificial suppression.
6. **Section & Section-Based Fetch**: Populate the section dropdown dynamically with all sections linked to the faculty member for the active Course + Branch + Batch + Semester. If the faculty changes their section, immediately fetch and switch to their linked subject for that section.
7. **Subjects Linked & Bidirectional Synchronization**: When the faculty changes their selected subject from the linked list, automatically synchronize the section dropdown to the section assigned to that subject.
8. **Preserve Business Logic**: Strictly preserve all existing backend integrations, data models, submission workflows, and tenant boundary isolation; modify only the academic selector inputs and their downstream listeners.
9. **Live Downstream Synchronization**: Synchronize all downstream lists, forms, tabs, and data tables to update live whenever the active cascade state changes.
