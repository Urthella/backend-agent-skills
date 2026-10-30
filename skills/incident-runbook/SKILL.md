---
name: incident-runbook
description: Guides a production incident from first alert to postmortem, covering severity, mitigation before root cause, status updates, a running timeline and a blameless write-up. Use when something is down or degraded in production, an alert fires, or the user asks for help writing a postmortem.
license: MIT
---

# Incident runbook

During an incident the goal is to **restore service first** and understand it second. Keep every action reversible where possible, and write things down as they happen.

## Ground rules for the agent

- Investigate read-only by default: logs, metrics, recent deploys, config diffs.
- **Ask before any action that changes production**: rollbacks, restarts, scaling, feature flags, data fixes. State the command, what it affects, and how to undo it.
- Never run destructive commands (deleting data, dropping tables, force-pushing, clearing queues) during an incident without an explicit go-ahead for that exact command.
- Log every action and finding in the timeline with a UTC timestamp.

## Steps

1. **Set severity** so everyone knows how loud to be.

   | Sev | Meaning | Updates every |
   |---|---|---|
   | SEV1 | Core flow down for many users, or data loss/exposure | 30 min |
   | SEV2 | Degraded or partially down, workaround exists | 60 min |
   | SEV3 | Minor impact, can wait for working hours | at resolution |

2. **First 15 minutes: what changed?** Most incidents follow a change.
   - Deploys and config changes in the last few hours (`git log`, CI/CD history)
   - Feature flags flipped, migrations run, cron jobs added
   - Traffic shape: spike, new client, bot, retry storm
   - Dependencies: provider status pages, DNS, certificates expiring

3. **Scope it.** Which endpoints, regions, customers, and since when? Compare error rate, latency (p95/p99) and saturation (CPU, memory, DB connections, queue depth) against the same window yesterday.

4. **Mitigate before root cause.** Pick the fastest reversible option:
   - Roll back the last deploy, or turn the feature flag off
   - Scale out, or shed load with rate limits
   - Fail over to a healthy replica or region
   - Restoring from backup is a last resort and needs explicit approval

5. **Communicate** on the cadence above:

   ```text
   [SEV2] Checkout errors: investigating
   Impact: ~8% of checkout requests fail with 502 since 14:05 UTC.
   Current action: rolling back release 2026.10.28-3 (deployed 13:58 UTC).
   Next update: 15:15 UTC or sooner if it changes.
   ```

6. **Resolve** when metrics are back to baseline and have stayed there for a while (for example 30 minutes). Announce it with start time, end time and impact.

7. **Postmortem** within two working days, using [the postmortem template](assets/postmortem.md). Fill the timeline from the log kept in step 1 onward.

## Timeline format

```text
14:05  Alert: checkout 5xx > 5% (pagerduty)
14:09  Scope: only /checkout, all regions; release 2026.10.28-3 went out 13:58
14:12  Decision: roll back (approved by @oncall)
14:19  Rollback complete; 5xx back under 0.5%
14:50  Resolved after 30 min stable
```
