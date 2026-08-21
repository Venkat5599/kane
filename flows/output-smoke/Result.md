---
test: ../smoke_test.md
status: failed
started: 2026-08-21T17:57:24.482Z
duration_s: 77
session_id: 8da070fc-e8b3-4a8a-bea5-72cccf176929
---

# smoke_test.md — Result

## Heading renders ✓ passed (2.08s)
md5: 7e67261e7faa91c586368530139fc244
Assert that the page heading reads "kane-loop".

## Run button is present ✗ failed (60.9s)
md5: f20b427c52a6332279a3f5bcbc4486e0
Reason: AP determined agent is stuck — no viable actions remain — bug verdict: Missing-label assertion stalls instead of failing [automation_bug/agent_misstep, confidence 0.82]
Assert that the page shows a button labelled "Run Verification".

## Target field accepts input ✓ passed (—)
md5: b8e1a62d1ea846d1f8236dd188ec7bd6
Type "http://localhost:3000" into the Target URL input field.

## Results table is present ✓ passed (—)
md5: 71d9e0756910a6ced5afcbf9cfbc648a
Assert that the results table shows a column heading that reads "Verdict".
