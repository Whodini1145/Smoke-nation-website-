# Notes for Claude

- Read `SPEC.md` first: it has every decision made with the site manager.
- How to explain things to the site manager: short numbered steps (1, 2, 3), plain words, no filler. They are dyslexic; long paragraphs are hard to read.
- Live site: https://smoke-nation.web.app. Pushing to the default branch uploads it (GitHub Actions). `npm run build:preview` builds a database-free copy for local testing (serve with `npx vite preview --outDir preview-dist`).
- Security rules tests: `npm run test:rules` (Firestore emulator).
