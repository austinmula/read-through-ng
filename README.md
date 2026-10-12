# Angular read-through guide

A slow, interactive read-through of an Angular 22 project (`angular-kanban`), written as a small static web app. It explains the generated files, traces a page load from `index.html` to the rendered component, and tests you with questions you answer before the model answer is revealed.

No build step and no dependencies. Open `index.html` in a browser.

## What is in it

| Chapter | Content |
|---|---|
| Trace a page load | Six-hop stepper through `index.html`, `angular.json`, `main.ts`, `app.config.ts`, `app.ts` and the template |
| Tour of the files | Every generated file, filterable, with what to look for |
| Where things go | Where a global service and a route are registered |
| How it re-renders | How a zoneless app learns that something changed |
| Questions and answers | Write your answer, reveal the model answer, rate yourself |
| Milestone 0 review | The setup-step review questions with answers |
| Glossary, cheat sheet | Searchable terms and the project's commands |

Progress, your written answers and the theme are stored in the browser (`localStorage`) and never leave it.

## Files

```
index.html   page structure and chapter text
styles.css   styling, light and dark themes
app.js       stepper, file tour, questions, glossary, progress
```

The questions, the file list and the glossary are plain arrays near the top of `app.js` (`QUIZ`, `M0`, `FILES`, `HOPS`, `GLOSS`). To add a question, add an object to one of them.

## Facts it relies on

The guide describes the project as generated with Angular CLI 22.2.2 on Node 24.21.0: standalone components, SCSS, no SSR, no router, zoneless (no `zone.js`), Vitest. If you regenerate the project with different options, check the "Tour of the files" chapter against the new files.

## Publish

It is a static site, so it works on GitHub Pages. Serve the repository root from `main`, or from a `gh-pages` branch.
