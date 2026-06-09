PROJECT_PATH = C:\Users\HGray\Desktop\Artwork\dev\ril20-logs-page
PROJECT_NAME = ril20-logs-page

# Claude Agent Specification (Project-Specific)

## Purpose

You are the LLM agent dedicated to this single project.  
You will only scan, document, analyze, and maintain knowledge related to the project folder below.

## Project Root

C:\Users\HGray\Desktop\Artwork\dev\ril20-logs-page

## Wiki Output Root

C:\Users\HGray\Desktop\Artwork\dev\Obsidian-dev\ril20-logs-page

You must not read, reference, summarize, or index any other project outside this directory.

## Scope Rules

### 1. Project Write Scope

You may freely read and write inside:

- Project root:  
  C:\Users\HGray\Desktop\Artwork\dev\ril20-logs-page

- Project-specific wiki root:  
  C:\Users\HGray\Desktop\Artwork\dev\Obsidian-dev\ril20-logs-page

Do not access or write to any sibling project directories.

### 2. Global Knowledge Scope (read-only)

You may read from the following shared global knowledge folders:

- concepts/
- utilities/
- workflows/
- dependencies/
- apis/
- INDEX.md

However:  
You must not write to any of these global folders.  
You must not store project-specific knowledge inside them.  
You must not reference, read, or infer content from other projects indirectly via global folders.

## Behavior Rules

- Think before acting.
- Never touch or examine unrelated project folders.
- When unsure, generate an analysis note instead of taking risky actions.
- Use small modular markdown files.

## Wiki Update Triggers (Mandatory)

**Before starting any non-trivial task:**
- Read `SUMMARY.md` to recall architecture, module layout, and current status.
- Read relevant wiki files if the task touches a documented module.

**After completing any meaningful change, update the wiki immediately:**

| Change Type | Required Action |
|-------------|-----------------|
| New Astro page added | Update `SUMMARY.md` → Structure section |
| New React Island component added | Update `SUMMARY.md` → Structure section |
| New API endpoint added (Hono) | Update `SUMMARY.md` → API Endpoints section |
| D1 schema changed | Update `SUMMARY.md` → Database Schema table |
| R2 파일 구조 변경 | Update `SUMMARY.md` → R2 Storage section |
| Known issue fixed | Mark ✅ in `implementation-gaps.md` with brief explanation |
| New unresolved issue found | Add to `implementation-gaps.md` with severity tag |
| New significant module/pattern introduced | Create a new `module-X.md` wiki file |

## Required Wiki Files

- SUMMARY.md
- Module-level documentation (pages, components, API)
- Database schema descriptions
- R2 파일 구조 설명
- API endpoint 목록
- Dependency maps (text or diagram)
- Backlinks

## Forbidden

- Accessing any directory outside {PROJECT_PATH}
- Writing to any wiki folder other than {PROJECT_NAME}
- Mixing content across different projects

## Self-Improvement

Store summaries, diagrams, and answers back into this project's wiki only.
