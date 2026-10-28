// k6 load test template: open model (arrival rate) with SLO thresholds.
// Run: BASE_URL=https://staging.example.com k6 run k6-template.js
import http from "k6/http";
import { check } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const PEAK_RPS = Number(__ENV.PEAK_RPS || 50);

export const options = {
  scenarios: {
    load: {
      executor: "ramping-arrival-rate",
      startRate: 1,
      timeUnit: "1s",
      preAllocatedVUs: 50,
      maxVUs: 500,
      stages: [
        { target: PEAK_RPS, duration: "2m" }, // ramp up
        { target: PEAK_RPS, duration: "5m" }, // hold at peak
        { target: 0, duration: "1m" }, // ramp down
      ],
    },
  },
  // The test fails (non-zero exit) when the SLO is missed, so it can gate CI.
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<300", "p(99)<800"],
  },
};

export default function () {
  // Replace with the real traffic mix, e.g. weighted by Math.random().
  const res = http.get(`${BASE_URL}/health`, { tags: { endpoint: "health" } });
  check(res, { "status is 2xx": (r) => r.status >= 200 && r.status < 300 });
}
