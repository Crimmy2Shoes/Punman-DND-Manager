# Character-sheet coverage and constraints audit

This is the archived audit of the previous local 2024 journal at `/?legacy=1`. The default app is now a UI for the PunPun spreadsheet: see [README.md](README.md) and [the current roadmap](../ROADMAP.md). Its rules, calculations and choices come from the workbook.

| Reference-sheet area | App coverage |
| --- | --- |
| Identity | Name, class / level / subclass, species, background, XP, size, speed and alignment |
| Abilities | Six scores, six saving throws, 18 skills, proficiency / Expertise and explicit bonuses |
| Combat | AC, persistent applied armor formula and shield selection, initiative, passive Perception, HP, temporary HP, hit dice, death saves and Heroic Inspiration |
| Attacks | Ability, proficiency, attack and damage adjustments, dice, all 13 damage types, eight weapon mastery suggestions and custom notes |
| Features | Class features, species traits and feats share editable notes; resource uses have separate counters |
| Training | Languages, armor / weapon / tool proficiencies are editable text |
| Spells | Casting ability / modifier, save DC, attack bonus, nine slot levels, Pact Magic, prepared spells, casting time, range, components, material notes, concentration, ritual and duration |
| Equipment | Quantities, weights, five coin denominations and attunement |
| Story | Appearance text, alignment, backstory and session notes. The PDF's portrait box has no image-upload equivalent. |

## Dropdown coverage

- Complete basic categories: six abilities, 18 skills, six size categories, nine standard alignments, 13 damage types, eight weapon masteries, eight spell schools and all 12 core PHB class names.
- The character editor suggests all 16 2024 PHB background names and ten species names. Selecting a name does not apply its rules. Custom values are supported.
- The guided creation wizard has mechanics for four SRD backgrounds and nine SRD species. It does not automate Aasimar or every PHB background.
- Subclass / feat choices, lineage choices, training and languages support manual entries. The app does not include every published subclass, feat or spell. The built-in spell library contains 339 spells extracted from SRD 5.2.1.
- Armor calculation includes all 12 ordinary armor types and unarmored / Barbarian / Monk formulas. A trained shield is an explicit +2 choice. Magic armor and other defense formulas use manual AC adjustments.

Background names were verified against [the official 2024 background overview](https://www.dndbeyond.com/posts/1785-the-backgrounds-and-origin-feats-in-the-2024). Mechanics and category lists use [SRD 5.2.1](https://www.dndbeyond.com/srd).

## Enforced constraints

- Levels: integers 1–20; combined class levels must equal total level.
- Ability scores: integers 1–30; creation point-buy scores 8–15, 27 points; standard array uses each value once; background increases cannot exceed 20.
- HP: nonnegative integers; current HP cannot exceed effective maximum. Temporary reductions are reflected in that maximum. Temporary HP and resources cannot be negative.
- Counter usage: spent slots / dice cannot exceed totals; remaining resource uses cannot exceed the total.
- Attack adjustment: −30 to +30; damage adjustment: −99 to +99. The UI agrees with the save validator.
- Ordinary slot totals: 0–20 per level; Pact Magic totals: 0–4; spell levels: 0–9; exhaustion: 0–6; death successes / failures: 0–3.
- Application caps: 100 characters, 200 attacks, 200 resources, 500 items and 500 spells per character. Editable text is limited to 100,000 characters. These are application limits, not general D&D rules.
- Invalid numeric drafts show a message and do not update saved data. Empty numeric fields do not immediately become zero. Leaving an invalid field restores its previous value.
- Imported backups and Google Sheet imports are validated before changing character data.

## Manual adjudication

Feat / item bonuses, resistance and vulnerability, advantage / disadvantage, complete condition effects, prepared-spell limits, action economy, class choices and rest duration / interruption requirements are not fully enforced. Use Reference and your own sources.

## Google Sheets

The personal connection panel is prefilled with the supplied link. OAuth setup is required before live access. Cell addresses are explicitly mapped after inspecting the worksheet; there are no guessed addresses. Preview/import use read-only access. Reviewed saves require read/write access. Formula cells and changed previews block writes. Full character JSON fits one dedicated cell only when under Google's 50,000-character limit. Individual mappings support text, numbers, checkboxes and skill proficiency levels (0, 1, 2).

The connection was tested with mocked responses. The actual private worksheet layout and live authorization are not yet verified.
