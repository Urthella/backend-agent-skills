---
name: load-test-plan
description: Designs, writes and interprets HTTP load tests with k6, using open-model arrival rates and SLO thresholds so results reflect real latency. Use when asked to load test, stress test, benchmark an API, find a service's capacity, or check whether an endpoint meets a latency target.
license: MIT
compatibility: Requires k6 (https://k6.io) on the machine that runs the test
---

# Load test plan (k6)

A load test answers one question: *at what request rate does this service stop meeting its SLO?* Agree on that question before writing any script.

## Steps

1. **Pin down the target.** Ask for (or propose) the SLO: for example p95 < 300 ms, p99 < 800 ms, error rate < 1%. Ask for expected peak traffic in requests per second, not users.
2. **Pick the environment.** Never load test production without explicit approval. Use a prod-like staging environment, and run k6 from a different machine than the service so the generator doesn't steal its CPU.
3. **Choose endpoints and mix.** Model the real traffic mix (for example 70% reads, 25% list queries, 5% writes). Include auth if production requires it.
4. **Write the script** from [the template](assets/k6-template.js). Keep the open model (`ramping-arrival-rate`); see "Why arrival rate" below.
5. **Run in stages:** a smoke run (1-2 rps, 1 minute) to validate the script, then the load profile, then optionally a stress profile that ramps past the expected peak to find the breaking point.
6. **Watch the system, not just k6:** CPU, memory, DB connections, pool wait time, queue depth, error logs. The bottleneck is usually the database or a connection pool.
7. **Report** with the format below.

## Why arrival rate

A closed model (fixed VUs, each sending the next request after the previous one returns) slows down when the service slows down, so it sends *less* load exactly when the service struggles and hides the latency real users would see. This is coordinated omission. An arrival-rate executor keeps sending requests on schedule, so slowdowns show up as latency and dropped iterations, the way they would in production.

If k6 warns about insufficient VUs (`dropped_iterations` > 0), raise `maxVUs`: the generator, not the service, was the limit.

## Reading results

- Judge latency by p95/p99, never the average. One slow dependency hides in the mean.
- Separate errors by type: 5xx from the service, timeouts, and 429s from your own rate limiter are different findings.
- Capacity is the highest stable rate where every threshold passed for the whole hold period, not the peak of a spike.
- Re-run once. If two runs differ by more than ~10%, the environment is noisy; say so.

## Report format

```markdown
### Load test: <service> <endpoint mix>

**SLO:** p95 < __ ms, p99 < __ ms, errors < __%
**Environment:** <where, instance sizes, data volume>

| Rate (rps) | p95 | p99 | Error rate | Notes |
|-----------:|----:|----:|-----------:|-------|
| 50 | 120 ms | 210 ms | 0.0% | |
| 100 | 290 ms | 640 ms | 0.2% | DB CPU 85% |
| 150 | 1.9 s | 4.1 s | 6.3% | pool exhausted, threshold failed |

**Capacity:** ~100 rps within SLO.
**Bottleneck:** <component and evidence>
**Next step:** <one concrete change and the expected gain>
```
