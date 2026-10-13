# Punman's D&D Manager

A desktop React and TypeScript UI for `References/PunPun_Character.xlsx` and your Google spreadsheet. The sheet owns character calculations; the app provides guided creation, DM-update refreshes, reviewed cell saves, ability references and configurable skill restrictions. See [ROADMAP.md](ROADMAP.md).

## Development

The application lives in `app/`. From that directory:

```sh
npm.cmd install
npm.cmd run dev
```

Run `npm.cmd run build` to type-check and produce a production build.

For friends, run `npm.cmd run build:players` and host only `app/dist-players`. Everyone opens the same app, pastes their character spreadsheet’s normal URL from your shared Drive folder, and clicks **Open character**. Players retain full editing of the existing file; **Change spreadsheet** keeps drafts separate, and the app creates no spreadsheets. The player build excludes your workbook preview. See [player sharing and hosting setup](References/PLAYER_SETUP.md); Google folder and file permissions determine access.

[GitHub Pages setup](References/GITHUB_PAGES_SETUP.md) explains the included deployment workflow. It builds the player app on pushes to `main`, handles the repository URL path, and publishes only the verified player output. Local character exports and environment files are excluded from Git.

## Visual direction

A fantasy journal with parchment/light and forest/dark themes, burgundy and gold accents, serif headings and readable body text. The collapsible sidebar and section shortcuts suit desktop play. Theme and sidebar preferences persist on the device.

## Views

- Play: spreadsheet combat statistics, level-gated actions/bonus actions/reactions, movement, HP, attacks, Inspiration and death saves.
- Character: identity, abilities, skill/Expertise budgets, saves, traits and feats. Rules & overrides supports DM grants and custom abilities.
- Spells: 361 core 2014 entries plus five Tasha’s grant spells, class access, known/prepared distinctions, subclass grants and native slots.
- Inventory & Notes: searchable 437-entry SRD item library, effects/attunement references, reviewed inventory additions, currency, costs, weights and notes.
- Workbook: every tab, reference tables, cell search and direct cell selection.
- Pugilist: spreadsheet integration and resource controls; see [setup](References/PUGILIST_SETUP.md).

## Foundation

- React and TypeScript with Vite.
- Lucide React for icons.
- Google Sheets API for workbook reads and reviewed cell writes.
- Locally cached workbook snapshots and draft edits; IndexedDB retained for previous journal saves.

The PunPun workbook is the rules and sheet-layout reference. Its formulas remain read only and its editable cells drive the UI. See [app/README.md](app/README.md) for connection setup and behavior, and [ROADMAP.md](ROADMAP.md) for the current scope.

Ability coverage and grant restrictions are documented in [COMPANION_RULES.md](References/COMPANION_RULES.md). The [official 2014 pack and installer](References/OFFICIAL_2014_SETUP.md) covers 13 classes and 118 subclasses, including 440 expansion/Artificer feature summaries with source links. Feature choices and DM overrides can be exported/imported for friends. Expansion spells, items, feats and racial variants are not an exhaustive catalog; coverage details distinguish installed definitions from linked references.


