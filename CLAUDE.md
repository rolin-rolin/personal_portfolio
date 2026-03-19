@AGENTS.md

## Tailwind CSS v4 — Arbitrary Value Syntax

This project uses Tailwind CSS v4. The syntax for arbitrary values changed from v3:

- **CSS variables** → parentheses: `bg-(--accent)`, `text-(--muted)`, `border-(--accent)`
- **Raw arbitrary values** → brackets: `text-[clamp(4rem,12vw,10rem)]`, `h-[3px]`, `w-[200px]`

Rule: if the value starts with `--`, use `()`. Everything else uses `[]`.
