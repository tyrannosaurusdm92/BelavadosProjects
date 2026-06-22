# Sitewide Dropdown Menu Merge

Implemented the latest Belavadös biome, heritage, gender identity, pronoun, title, honorific, and endearment dropdown data across all three pages.

## What changed
- Page 1 now has a full collapsible Biome + Heritage Dropdown Builder that can apply selections into the generator fields.
- Page 2 keeps the existing Character Forge dropdown builder and now has hide/show controls for the whole builder and for each completed section.
- Page 3 now has a full collapsible Voice Source Dropdown Builder that can apply race, biome, gender, pronoun, title, and generated notes into the voice source fields.
- The latest uploaded dropdown data replaced the older embedded JSON data while preserving the existing Page 2 bridge.
- Floating bubble navigation and the skinny subnav now include Dropdown Builder entries for all three pages.

## Files added
- `css/sitewide-dropdown-builder.css`
- `js/sitewide-dropdown-builder.js`

## Persistence
Hide/show choices and cached dropdown selections are stored in browser `localStorage` per page, so users can hide completed parts without losing the rest of the site.
