# Skill Example: Codex

This example mirrors the generated Codex skill package.

Files:
- `manifest.json`: Skill metadata and endpoint contract.
- `SKILL.md`: Operational instructions for a Codex-compatible runtime.

Usage:
1. Load `SKILL.md` into your Codex skill system.
2. Wire HTTP tools to card-service endpoints from `manifest.json`.
3. Set `x-card-secret` auth header for each request.
