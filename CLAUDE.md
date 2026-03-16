# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Purpose

This is a personal learning notes repository covering **graphics programming** and **game mathematics**, written in **Traditional Chinese (繁體中文)**. All notes are Markdown files with LaTeX math, GLSL code snippets, and image references.

## Note Series

- **遊戲數學** (Game Math): Linear algebra, coordinate spaces, view/projection matrices, quaternions
- **遊戲繪圖** (Game Rendering): GPU pipeline, shaders, mesh, texture, blending, lighting, culling, shadow, normal maps, depth
- **遊戲優化** (Game Optimization): Draw calls, 2D rendering performance (Cocos Creator)
- **CocosCreator 優化**: Engine-specific 2D rendering optimization

## Writing Standard (from `.agent/skills/graphics_notes_writer/SKILL.md`)

When creating or editing notes, follow this skill's rules:

**Structure per note:**
1. H1: Topic title + 1-2 sentence intro (What & Why)
2. H2 sections: Concept → Visual Aid → Math → Pipeline Context → Implementation
3. H2: 效能優化 (Performance & Optimization) — bullet points with metrics
4. H3: 參考延伸閱讀 (References)

**Formatting rules:**
- LaTeX math blocks: ` ```math ` with `\begin{aligned}...\end{aligned}`
- Code: ` ```glsl ` for shader code, pseudo-code where applicable
- Images: `![alt text](images/filename.png)`
- Keep technical terms in English (e.g., Draw Call, Frustum Culling, Vertex Shader) — do NOT translate them to Chinese

**Content rules:**
- Be precise about GPU pipeline stage (e.g., "Rasterizer unit, before Fragment Shader" — not just "GPU does it")
- Distinguish CPU-side (Object Level) vs GPU-side (Primitive/Fragment Level) operations
- Mention hardware specifics (Early-Z, Guard Band, Warp/Wavefront) when relevant

## File Naming Convention

```
<系列>_<序號>_<主題>.md
```
Examples: `遊戲繪圖_08_Shadow.md`, `遊戲數學_04_空間轉換_ProjectionMatrix.md`
