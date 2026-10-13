# PunPun Spreadsheet Companion

A React + TypeScript UI for your PunPun character spreadsheet. The spreadsheet is the source of truth. The app reads its calculated values and writes only cells you edit and review.

## Run locally

```powershell
cd app
npm.cmd install
npm.cmd run dev
```

Open Vite's URL, normally http://localhost:5173. Use npm.cmd when PowerShell blocks npm.ps1.

```powershell
npm.cmd test
npm.cmd run build
npm.cmd run test:e2e
npm.cmd run preview
```

Browser tests use installed Microsoft Edge. Google tests are mocked and do not modify your real sheet.

## Connect your sheet

Click Connection settings. Your spreadsheet URL is prefilled. Follow the in-app guide:

1. Create/select a Google Cloud project and enable Google Sheets API.
2. Configure OAuth audience as External / Testing and add your email as a test user.
3. Create a Web application OAuth client. Add the app's actual origin, such as http://localhost:5173, as an authorized JavaScript origin. Add your preview origin separately if needed.
4. Paste the public client ID ending in .apps.googleusercontent.com. No client secret is needed.
5. Sign in with an account that can read and edit the sheet.

Tokens stay in memory and expire; sign in again to renew access. Settings, drafts and the last read snapshot are saved in this browser. The permission can cover other spreadsheets accessible to your account, but the app calls only the selected spreadsheet ID.

Official guide: [Google Sheets JavaScript quickstart](https://developers.google.com/workspace/sheets/api/quickstart/js).

## Everyday use

- Play: sheet combat statistics and level-gated actions, bonus actions, reactions, movement and passive abilities; editable health, Inspiration, condition, death markers and attacks.
- Character: identity, base scores, effective scores, bonuses, skills and personality.
- Spells: 361 core entries plus five Tasha’s grant spells; search/filter/add, casting counts, class access, known/prepared distinctions and native slots.
- Inventory & Notes: sheet item rows, quantities, weights, costs, coins and story lines.
- Workbook: inspect all tabs, search and select a cell directly, including DM reference tables.
- Pugilist: shown only when this character has Pugilist levels, including multiclass characters; sheet-derived class statistics, Moxie, Fight Club resource trackers and reviewed ability edits. Install the spreadsheet additions once using [the setup guide](../References/PUGILIST_SETUP.md). The original image formulas are retained.

Create / edit character guides the current sheet's inputs. Choices come from workbook tables and validation lists. Class selection prepares class/level text and XP from the sheet's level formula when recognizable. Scores and proficiencies use your DM's method. The app does not award extra feats, gold, racial bonuses or 2024 background boosts. Review class and race details in Workbook.

Creation uses four compact steps. Background options show a preview on hover or keyboard focus, using the workbook's own background-to-skill table. Race/class details and field notes are available on demand. Skill colors and underlines are read from Google's effective formatting, including its conditional rules; the yellow marker reminder is separate. Colors update after the sheet recalculates saved choices, rather than being guessed from local drafts. Color alone does not grant Expertise.

Inventory and spells use searchable lists with eight entries per page. Empty rows are hidden; Add uses an available cell group in the existing template. Item/spell editing opens a compact dialog. Spells support level and prepared-only filters, with separate slot dialogs. Story lines open in paged note editors. Remove prepares cell-clearing drafts for review; it does not delete spreadsheet rows or formatting. All changes use the normal reviewed save and conflict checks.

For a separate character, first make a copy of the Google sheet and connect that URL. The wizard edits the current character.

## Share the app with players

Keep your existing character spreadsheet files together in the shared Drive folder. Everyone opens the same app address, pastes their file’s normal URL, and clicks **Open character**. Google sign-in appears when needed. Players retain the full editor, and the app creates no spreadsheets. Shared-folder permissions determine which files they can view or edit.

Run `npm.cmd run build:players` and host only `dist-players`. The player build opens a URL entry form, remembers the last successful URL, and excludes the owner workbook preview and legacy journal. **Change spreadsheet** returns to the paste form without mixing drafts or requiring another Google sign-in while access remains valid. Special player links are optional. Configure the hosted origin in your OAuth client and add friends as OAuth test users if the audience is Testing. See [the player setup guide](../References/PLAYER_SETUP.md).

For GitHub Pages, use [the included workflow and setup guide](../References/GITHUB_PAGES_SETUP.md). Set the repository variable `VITE_GOOGLE_CLIENT_ID`; the workflow supplies `VITE_BASE_PATH` and deploys only the player build. The extracted `src/data/punpun.json` is local and ignored by Git; a source checkout without it builds successfully and can read a connected Google character sheet.

`npm.cmd run dev:players` previews this mode on port 5174. `npm.cmd run preview:players` serves its built output. `npm.cmd run test:e2e:players` tests the separate player build with mocked Google permissions. Player drafts/rules are isolated by sheet ID; snapshots are not persisted in player mode, and opening/reloading requires a fresh authorized read. Normal owner and legacy builds keep their existing offline behavior.

## Desktop appearance and rule guidance

The sidebar is the section navigator and can collapse to icons; light/dark mode and sidebar preferences persist locally. Skills use aligned Bonus / Skill / Training columns, alphabetical order down each column, larger labels and separate proficiency, Expertise and remaining-choice counts. Narrow desktop panels and edit dialogs use one column. Sheet colors, reminders, filters and reviewed edits retain their existing behavior. Play has searchable, paged ability cards grouped by action type and filtered by individual class level. The official pack covers 13 classes and 118 subclasses under the 2014 rules, plus recognized SRD racial traits, your selected Pugilist version and sheet features. Play → Rules library and Character → Skill definitions open searchable references. Non-SRD entries use mechanical summaries with source links.

Customize abilities → Feature choices records selected Fighting Styles, Metamagic, Pact Boons, 32 invocations, 16 maneuvers, Hunter choices, PHB totems, Four Elements disciplines and Circle land. It checks option limits and prerequisites. The spell library contains 319 full SRD 5.1 descriptions plus 42 additional PHB 2014 summaries. Domain/oath/selected-land spells are always prepared; Warlock patrons expand learning options. Known-spell casters do not require a preparation marker. These features guide choices and do not spend resources or automate combat effects.

Creation keeps missing native options disabled until Class Info contains them. The [official setup guide](../References/OFFICIAL_2014_SETUP.md) explains the installer, which backs up, appends missing rows and extends Class Info references to row600 while preserving artwork. Artificer uses the original supported Artificer Casting type. Rune Knight/Arcane Archer/Artificer and other expansion choices are available in Customize abilities. Inventory → Browse items provides 437 SRD entries, effects, attunement requirements and reviewed additions. Expansion spell/item definitions, feats, every racial variant and optional replacements remain partial catalogs.

Skills show a proficiency and Expertise budget with class, race, background and subclass sources. Rules & overrides lets your DM grant extra training, set explicit total limits, disable app count/source restrictions or add custom ability cards. Enter a custom card with the same name to replace a standard guide card. Source restrictions are checked again against a fresh sheet before skill edits are saved. Overrides live on the current device per spreadsheet ID; Export/Import rules transfers them to friends. They do not alter Google formulas. See [COMPANION_RULES.md](../References/COMPANION_RULES.md) for coverage and limitations.

## Updates and saving

Refresh runs every 30 seconds while the page is visible and connected, on window focus, or on demand. Live values, formulas and dropdown sources are read together. Unsaved inputs remain separate drafts.

Review changes before saving. If your DM changes an edited cell, choose Use sheet value or explicitly Keep my edit. Saving rereads the workbook and refuses changed or newly calculated cells. Only edited cells are sent with RAW input, preserving formulas elsewhere and preventing text from becoming injected formulas. Merged-cell interiors are read only; Google enforces protected ranges and account permissions.

The check and write are separate API calls, so an edit made between them cannot be detected atomically. Avoid simultaneous edits to the same cell. If a save times out, refresh before retrying to check whether Google applied it.

The UI expects the supplied v2.1 layout and reads A1:BC201 on every tab, including helper columns; Class Info reads through row600 for the official installer. Renaming v2.1, moving character cells or inserting rows/columns in character tabs requires mapping changes. Complex validation formulas remain subject to spreadsheet behavior and DM adjudication.

## Offline and recovery

Before connecting, the XLSX export provides a preview. Formula results are cached export values; the browser does not calculate them. Connect and refresh for current values.

Production builds support offline viewing and installation. Offline edits remain drafts until reconnecting. Export backup downloads the cached workbook and drafts as JSON for recovery, not a complete spreadsheet including formatting. Automatic JSON restore is not currently implemented. Keep the original XLSX and Google sheet as authoritative backups.

Previously saved 2024 local characters remain accessible at /?legacy=1. They are not automatically imported into the spreadsheet.

## Extraction

scripts/extract-punpun.ps1 extracts the supplied XLSX with .NET ZIP/XML into src/data/punpun.json without new packages. If script execution is blocked, run its contents as a script block in the workspace or use an approved process-level policy.

The previous 2024 compendium and journal are retained only for the old workflow; see ATTRIBUTION.md.
