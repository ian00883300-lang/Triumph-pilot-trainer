# v223 — Read and Do

Practice Settings now has a Read and Do entry below flight memory training.

- Select 4–10 commands (default 7), using the same generator and ranges as memory training.
- All commands remain readable during execution and after completion; the current command is highlighted.
- Total and current-command stopwatches start immediately. Completing a command records its split; pause freezes both clocks and disables completion and math submission.
- Optional mental arithmetic supplies one question per command (three-digit addition/subtraction or two-digit multiplication). Unanswered problems are counted separately.
- The report retains every command and its duration, total duration, and arithmetic statistics. The last completed session is saved locally under `triumph_read_do_last`; no previous practice records are cleared.
- Closing an unfinished session asks before discarding it. Restart returns to settings.

Validation: 8,000 generated sequences of lengths 3–10; browser flows at 390, 768 and 1440 px with 4/7/10 commands, pause exclusion, split totals, math enabled/disabled, restart, and existing memory mode smoke check. Browser validation uses Chromium, not a physical iPhone.

Run `node tests/flight-memory-rules.mjs` and `PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node tests/read-do.mjs` with this directory served on localhost:8085. The browser test uses `/usr/bin/chromium`.
