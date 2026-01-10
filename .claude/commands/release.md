# Release

Cut a release and monitor CI/CD. See @.claude/skills/release/skill.md for workflow details.

## Context

!`grep '"version"' package.json | head -1`

## Quick Release

```bash
bun run release          # Auto-detect from commits (recommended)
bun run release:patch    # Force patch
bun run release:minor    # Force minor
bun run release:major    # Force major
```

Auto-detection uses conventional commits: `fix:` → patch, `feat:` → minor, `feat!:`/`BREAKING CHANGE:` → major.

## Monitor

After push, use `gh run list --limit 3` then `gh run watch <id>` to monitor CI.
