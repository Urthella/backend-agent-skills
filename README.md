# backend-agent-skills

[![ci](https://github.com/Urthella/backend-agent-skills/actions/workflows/ci.yml/badge.svg)](https://github.com/Urthella/backend-agent-skills/actions/workflows/ci.yml)

[Agent Skills](https://agentskills.io) for backend work: the review checklists and procedures I'd otherwise re-explain to a coding agent every time. Each skill is a folder with a `SKILL.md` that the agent loads only when the task calls for it.

| Skill | What the agent does with it |
|---|---|
| [migration-review](skills/migration-review/SKILL.md) | Reviews Postgres migrations for blocking locks, table rewrites, unsafe deploy order and data loss, and rewrites risky steps as expand/contract sequences |
| [load-test-plan](skills/load-test-plan/SKILL.md) | Plans and writes k6 load tests with open-model arrival rates and SLO thresholds, then reports capacity and the bottleneck |

## Install

**Claude Code**: copy a skill folder into your personal or project skills directory.

```bash
git clone https://github.com/Urthella/backend-agent-skills
cp -r backend-agent-skills/skills/migration-review ~/.claude/skills/      # all projects
cp -r backend-agent-skills/skills/migration-review .claude/skills/        # this project only
```

Other agents that support Agent Skills load the same folders; check their docs for the skills directory.

## Quality

Every skill is linted in CI with [skill-lint](https://github.com/Urthella/skill-lint) in strict mode: spec-valid frontmatter, every linked file exists, references stay one level deep, and each description says when to use the skill.

## License

[MIT](LICENSE)
