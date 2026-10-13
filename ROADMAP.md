# Spreadsheet Companion Roadmap

The app is a desktop UI for `References/PunPun_Character.xlsx` and the connected Google spreadsheet. The workbook owns calculated statistics, dropdown options and character data. The companion adds a labeled spreadsheet-era ability guide and optional skill restrictions with DM overrides; it does not replace spreadsheet calculations.

| Workstream | Implemented behavior |
| --- | --- |
| Workbook reference | Extracted values, formulas, merged ranges and validation lists; local preview |
| Google connection | Prefilled URL, OAuth setup instructions, sign-in and disconnect |
| Player distribution | Separate static player build; paste a normal sheet URL from the shared Drive folder, remember the last opened URL, full editing, change sheets with isolated drafts/rules, Google permissions, no spreadsheet creation; owner preview excluded |
| Character UI | Identity, base/effective abilities, skills, saves, features, health, Inspiration, attacks and death markers |
| Desktop appearance | Persistent light/dark mode, collapsible sidebar, section shortcuts, compact ability cards |
| Ability guide | 13 official 2014 classes / 118 subclasses; 440 additional feature summaries, selected runes/shots/infusions and other choices; selected Pugilist, sheet features and DM entries |
| Training restrictions | Skill/Expertise counts, source pools, background/race/subclass grants, late-change checks and per-spreadsheet DM overrides; rules import/export |
| Creation guidance | Workbook choices, subclass unlock gates, missing-subclass installer, base scores, skill markers and XP; all 18 skill definitions with references |
| Pugilist | Artwork-preserving spreadsheet installer, class/Fight Club entries, progression and validated resource/ability UI; native installation and live-account verification pending |
| Spells | 361 core entries plus five Tasha’s grant spells; search/filter/add, class counts/access, always-known/prepared subclass grants and patron learning options; native slot tracking |
| Feature choices | Fighting Styles, Metamagic, Pact Boons, 32 invocations with prerequisites, 16 maneuvers, Hunter choices, PHB totems, Four Elements disciplines and Circle land; local per-sheet choices, limits and rules export/import |
| Inventory and notes | 437 SRD equipment/magic-item references, search/filter/add, effects/attunement details, item rows, quantities, costs, weights, five coin types and story lines |
| DM updates | Refresh on demand, every 30 seconds while visible and connected, and on window focus |
| Editing | Persistent drafts, reviewed cell saves, formula and merged-cell protection, conflict resolution and fresh checks before writing |
| Workbook explorer | All tabs and DM reference tables; A1:BC201, with Class Info read through row600 for installed official options |
| Offline | Last read snapshot and drafts cached locally; cloud saves require connection |
| Verification | Unit and mocked Google browser tests, desktop layout and light/dark accessibility checks |

No live sheet was edited during development. [Official 2014 setup](References/OFFICIAL_2014_SETUP.md) explains the optional native installer. It backs up first, preserves artwork and character values, and extends only Class Info references to support the larger catalog. Inventory now includes a searchable 437-entry SRD equipment/magic-item library.

All published 2014 subclasses are registered with feature summaries. Expansion spell/item definitions, feats, racial variants and optional replacements are not exhaustive. Summon stat blocks and detailed/random tables use linked references. Combat effects/resources still require player/DM management; sheet calculations remain authoritative.

DM changes to values, formulas, dropdowns and reference entries refresh automatically. Moving cells or inserting rows/columns requires UI mapping changes. The original workbook itself instructs users not to move cells or insert rows/columns.

The previous 2024 local journal remains at `/?legacy=1` to keep existing saves accessible. Its independent rules engine is not used by the spreadsheet companion.

Google Sheets does not provide atomic compare-and-write through the values endpoint. Avoid simultaneous edits to the same cells.

[Player hosting and sharing setup](References/PLAYER_SETUP.md) covers the shared-folder paste-and-open workflow, `dist-players` and one-time Google OAuth setup. Hosting and real-player permission checks remain pending; development does not change live Google sharing settings. Player mode requires an authorized read before displaying any character and does not load owner snapshots or the legacy journal. Folder sharing can allow access to multiple characters; the app selects the pasted file and does not enforce player ownership.
