# EquiFinance Security Specification

## Data Invariants
1. A financial entry MUST have a valid amount and a category (income/expense).
2. All entries and debts MUST be associated with the authenticated user who created them.
3. Every write operation MUST be logged in the `logs` collection.
4. Users cannot modify or delete logs.
5. Users can only access the dashboard if they are authenticated and have a `stakeholder` role (or simply if they are part of the specific project's user list, but here we assume a shared single company app).

## The Dirty Dozen Payloads

1. **Identity Spoofing**: Attempt to create an entry with a `userId` that isn't the caller's.
2. **Role Escalation**: Attempt to update a user profile's `role` to `admin` (if admin exists).
3. **Ghost Field Injection**: Adding `isVerified: true` to a debt record.
4. **Invalid Amount**: Setting `amount: -100` for an entry (or 0).
5. **Type Poisoning**: Sending `amount: "1000"` (string) instead of number.
6. **Date Falsification**: Sending a future `createdAt` timestamp from the client.
7. **Orphaned Debt**: Creating a debt with an invalid ID format.
8. **Unauthorized Log Deletion**: Attempting to delete a log record.
9. **Log Modification**: Attempting to edit a log entry to hide a change.
10. **State Shortcut**: Updating a debt status directly without being the owner (though here both are owners, so maybe bypassing validation).
11. **Massive Payload**: Sending a 1MB description string to exhaust resources.
12. **Unauthenticated Write**: Attempting to add an entry without a valid session.

## Test Runner Plan
Using `firestore.rules.test.ts` to simulate these attacks against `DRAFT_firestore.rules`.
