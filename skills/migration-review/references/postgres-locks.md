# PostgreSQL DDL lock reference

What common schema changes lock, and what they block. "Blocks writes" means `INSERT`/`UPDATE`/`DELETE` wait; "blocks everything" means reads wait too.

| Statement | Lock | Blocks | Rewrites table |
|---|---|---|---|
| `CREATE INDEX` | `SHARE` | writes | no (builds index) |
| `CREATE INDEX CONCURRENTLY` | `SHARE UPDATE EXCLUSIVE` | other DDL only | no |
| `DROP INDEX` | `ACCESS EXCLUSIVE` | everything | no |
| `DROP INDEX CONCURRENTLY` | `SHARE UPDATE EXCLUSIVE` | other DDL only | no |
| `ADD COLUMN` (no default, or constant default, PG 11+) | `ACCESS EXCLUSIVE` | everything, briefly | no |
| `ADD COLUMN` with volatile default | `ACCESS EXCLUSIVE` | everything | **yes** |
| `DROP COLUMN` | `ACCESS EXCLUSIVE` | everything, briefly | no |
| `ALTER COLUMN TYPE` (not binary-compatible) | `ACCESS EXCLUSIVE` | everything | **yes** |
| `ALTER COLUMN SET NOT NULL` | `ACCESS EXCLUSIVE` | everything | no, but full scan (skipped in PG 12+ if a valid `CHECK (col IS NOT NULL)` exists) |
| `ALTER COLUMN SET DEFAULT` | `ACCESS EXCLUSIVE` | everything, briefly | no |
| `ADD CONSTRAINT ... FOREIGN KEY` | `SHARE ROW EXCLUSIVE` on both tables | writes on both | no, but validates all rows |
| `ADD CONSTRAINT ... NOT VALID` | `SHARE ROW EXCLUSIVE` (FK) / `ACCESS EXCLUSIVE` (CHECK), briefly | briefly | no |
| `VALIDATE CONSTRAINT` | `SHARE UPDATE EXCLUSIVE` | other DDL only | no |
| `RENAME COLUMN` / `RENAME TO` | `ACCESS EXCLUSIVE` | everything, briefly | no |
| `VACUUM FULL`, `CLUSTER` | `ACCESS EXCLUSIVE` | everything | **yes** |
| `REINDEX` | `ACCESS EXCLUSIVE` on the index, `SHARE` on the table | writes | no |
| `REINDEX CONCURRENTLY` (PG 12+) | `SHARE UPDATE EXCLUSIVE` | other DDL only | no |

"Briefly" still matters: the statement must first *acquire* the lock, and it queues behind any running query on the table. Use `lock_timeout` so it gives up instead of stalling all traffic.

Check what is waiting on what during a migration:

```sql
SELECT pid, wait_event_type, state, now() - query_start AS running, left(query, 80)
FROM pg_stat_activity
WHERE datname = current_database() AND state <> 'idle'
ORDER BY query_start;
```
