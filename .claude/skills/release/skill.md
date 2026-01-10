---
name: release
description: Release workflow using package.json scripts and GitHub Actions monitoring
version: 1.0.0
---

# Release Workflow

## Package.json Scripts

| Script | What it does |
|--------|--------------|
| `bun run release` | **Auto-detect** bump from commits, commit, tag, push |
| `bun run release:patch` | Force patch (0.0.x) |
| `bun run release:minor` | Force minor (0.x.0) |
| `bun run release:major` | Force major (x.0.0) |

## Auto-Detection Rules

When using `bun run release` (recommended), the version bump is determined by commit messages since the last tag:

| Commit Type | Version Bump |
|-------------|--------------|
| `fix(scope): ...` | patch |
| `feat(scope): ...` | minor |
| `feat!: ...` or `BREAKING CHANGE:` in body | major |

Other types (`docs:`, `chore:`, `refactor:`, `test:`, `style:`, `ci:`, `build:`, `perf:`) trigger a patch bump if present alongside fix/feat commits.

Use explicit scripts (`release:patch`, `release:minor`, `release:major`) only when you need to override auto-detection.

## GitHub Actions Flow

After push, three workflows run automatically:

1. **CI** - lint, typecheck, tests, build
2. **Auto Release** - waits for CI, creates/pushes tag
3. **Release** - creates GitHub release from tag

## Monitoring Commands

```bash
gh run list --limit 5              # See recent runs
gh run watch <run-id>              # Watch live
gh run view <run-id>               # View completed
gh run view <run-id> --log-failed  # See failure logs
gh release view                    # View latest release
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| CI failed | Fix issue, `bun run release` again |
| Tag exists | Delete tag: `git tag -d vX.Y.Z && git push origin :refs/tags/vX.Y.Z` |
| Workflow stuck | `gh run cancel <id>` then re-push |
| Re-run workflow | `gh run rerun <run-id>` |
| Wrong version detected | Use explicit `bun run release:patch/minor/major` |
