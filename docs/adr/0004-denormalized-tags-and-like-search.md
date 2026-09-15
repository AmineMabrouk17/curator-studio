# 0004: Denormalized tags and LIKE search

Tags live as a JSON string array inside the studies row, and search is a `LIKE` scan over title, tags, and content. We deliberately skip tag normalization (separate tables/joins) and full-text indexes.

Rationale: a personal library of at most a few hundred studies, updated by one writer, on SQLite in D1. `LIKE` is plenty fast at that scale and keeps the schema a single file. A normalized tag model or real FTS would add machinery that nothing here yet earns; it can be introduced when the library actually grows large enough to feel it.