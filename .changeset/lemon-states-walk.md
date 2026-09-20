---
"@getodk/xpath": patch
---

Fixed an inconsistency with Collect. Now calling min() or max() with a set ignores empty values rather than returning NaN.
