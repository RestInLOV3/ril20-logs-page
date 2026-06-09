PROJECT_PATH = C:\Users\HGray\Desktop\Artwork\dev\ril20-logs-page
PROJECT_NAME = ril20-logs-page

# Claude Project Rules

## Scope

You operate **only within this project folder**.

Project root:
C:\Users\HGray\Desktop\Artwork\dev\ril20-logs-page

Wiki root for this project:
C:\Users\HGray\Desktop\Artwork\dev\Obsidian-dev\ril20-logs-page

Do not access or reference any other project directories.

## Approach

- Think before acting.
- Read existing files before writing or editing code.
- Make incremental edits rather than rewriting large files.
- Keep reasoning explicit and deterministic.
- Don't re-read files unless they may have changed.
- No greetings, no closing fluff.

## Wiki Collaboration

- This project's `claude-wiki.md` overrides all wiki-related behavior.
- Only write documentation inside this project's assigned wiki folder.
- Generate small, modular Markdown files.
- Use backlinks, summaries, indexes when appropriate.
- Do not mix content from other projects.

## Wiki Usage (Active)

**Before starting any non-trivial task:**

- Read `Obsidian-dev/ril20-logs-page/SUMMARY.md` to recall architecture and module layout.
- Read relevant wiki files if the task touches a documented module.

**After completing any meaningful change:**

- Update `SUMMARY.md` if architecture, tech stack, file structure, or module behavior changed.
- Update `implementation-gaps.md` if a known issue was fixed or a new one was found.
- Create a new wiki file (e.g., `module-X.md`) if a new significant module or pattern was introduced.

**Wiki update triggers (mandatory):**

- New Astro page added → update SUMMARY.md Structure section
- New React Island component added → update SUMMARY.md Structure section
- New API endpoint added (Hono) → update SUMMARY.md API section
- D1 schema changed → update SUMMARY.md Database Schema table
- R2 파일 구조 변경 → update SUMMARY.md R2 section
- Bug fixed that was tracked in implementation-gaps.md → mark it ✅ with explanation
- New unresolved issue discovered → add to implementation-gaps.md with severity tag

## Safety

- Never modify or create files outside project root or wiki root.
- Do not hallucinate nonexistent files or structures.
- If uncertain, write an analysis note instead of taking risky action.

## Language

- Responses to the user must use formal Korean with "~다." "~까." endings.
