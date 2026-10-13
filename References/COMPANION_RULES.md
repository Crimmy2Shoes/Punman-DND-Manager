# Desktop character companion rules

The Google workbook remains authoritative for character statistics, dropdowns, validation, conditional skill formatting and stored character values. The Play guide adds rules references; it does not evaluate or replace Google formulas.

## Sources and coverage

- [SRD 5.1, official Creative Commons PDF](https://media.wizards.com/2023/downloads/dnd/SRD_CC_v5.1.pdf): spreadsheet-era rules, twelve core classes and their SRD subclasses, core racial traits and basic combat actions. The companion does not substitute 2024 class features.
- [Pugilist version selected for this project](https://www.worldanvil.com/block/205750): Pugilist progression and seven Fight Clubs. This is a specific homebrew version; later Pugilist publications may differ.
- `Class Info`: first-class skill lists and counts, additional/multiclass proficiency grants, subclass names.
- `Race Info`: race adjustments and explicit skill grants in column AJ.
- `v2.1`: background table AX:BB, live class calculation helpers AR:AT, skill count helper AS16, manual feature skill helper AQ63, feature text in C/P/AC59:84 and skill markers H25:42.

The workbook abbreviates SRD subclasses: Lore, Life, Land, Open Hand, Devotion, Fiend and Evocation. The app maps those to their full rule names. SRD feature cards include a PDF page reference. The generation script is `app/scripts/build-legacy-abilities.mjs`; its output is `legacy-abilities.json` and `legacy-races.json`. Rebuild from the checked-in SRD 5.1 PDF and extracted page text, running the script from `app`.

The [official 2014 pack](OFFICIAL_2014_SETUP.md) registers 13 player classes and 118 subclasses, adding 440 expansion/Artificer feature summaries to the core pack. The in-app library exposes levels and sources. Spells include 361 core entries and five Tasha’s grant spells; expansion spell/item definitions and optional replacements are not exhaustive. Pugilist remains separate homebrew.

Use **Customize abilities → Feature choices** for selected Fighting Styles, Pact Boons, all 32 SRD invocations, Metamagic, all 16 PHB maneuvers, Hunter options, PHB Bear/Eagle/Wolf totems, Four Elements disciplines and Circle land. Choices are locally persisted per sheet, included in rules exports, limited by class level, and checked against prerequisites. Only selected eligible options become separate action cards. Unclassified sheet features remain visible; custom entries support other grants. Sheet edits and choices do not spend combat resources.

Spell definitions come from `build-legacy-spells.mjs` (319 SRD 5.1 spells) and `phbSpells.ts` (42 additional PHB 2014 summaries). `build-legacy-options.mjs` extracts 32 invocations and 18 skill definitions from the local licensed SRD. Domain/oath/selected-land spells are always prepared; patron spells expand learning options. Single known-spell casters do not need preparation markers. Mixed casting lists use ready markers because individual spell origins are not stored. Race entries remain from the sheet, supplemented by labeled SRD traits for recognized races.

## Level 5 Pugilist

Play shows qualifying Fisticuffs follow-up, Brace Up, The Old One-Two, Stick and Move, Dig Deep, Bloodied but Unbowed, Extra Attack, Haymaker and the level-3 Fight Club features. Level-6 and later features stay hidden until that class level. The linked progression has **3 Moxie** and a **1d8 Fisticuffs die** at level 5. Actual resource values come from the installed Pugilist worksheet; save and refresh changed class/XP/equipment inputs for native calculation. Movement comes from the character sheet's speed, with Dash guidance in the action cards.

## Skill restrictions and DM overrides

Character and the creation wizard show a compact searchable skill list with bonuses, training selectors, proficient skill count (including Expertise), remaining selections and Expertise selections. **Why this total?** opens a grouped source breakdown with exact workbook cells and external feature links. The current sheet's total (AS16 + background table skills) takes priority over reference-derived counts even when lower. Unsaved origin changes use a labeled reference estimate until the sheet recalculates. Class-choice slots have eligible lists; background/fixed racial grants have fixed skills. Mismatches are visible in the source dialog, and explicit DM overrides can adjust the confirmed total.

Pugilist adds subclass grants at level 3: Bloodhound two investigative skills, Arena one performance-related proficiency, Dog & Hound one animal-related proficiency, Piss & Vinegar Intimidation. Base Pugilist has no permanent Expertise choices. Bloodhound's level-11 settlement benefit is conditional, not a permanent `e` marker. Dwarf/Gnome conditional doubled proficiency likewise does not grant general Expertise.

For Human + Urchin + Piss & Vinegar, the reference budget is 2 Pugilist class choices + 2 Urchin skills (Sleight of Hand, Stealth) + 1 subclass Intimidation = 5. Standard Human adds 0 skill proficiencies. The subclass grant applies only if Intimidation was not already proficient when granted; it offers no replacement proficiency. Final skill markers do not record acquisition history, so the source dialog states this condition. Use an explicit total override (or correct the sheet with your DM) if the grant was redundant. The number five is not a level-five proficiency award.

Rogue has two Expertise choices from level 1, plus two at level 6. Bard has two at level 3, plus two at level 10. Rogue thieves' tools Expertise uses one choice and is recorded separately in Rules & overrides. Saving throws, tool proficiency, armor, weapons and languages are separate from the skill quota. Existing sheet choices are preserved even if they no longer fit; the app permits reductions and flags the issue. Unknown grant sources are flagged rather than assigned invented limits. Incomplete selections can be saved while building a character.

Use **Rules & overrides** for an extra DM proficiency, extra Expertise, an explicit total limit, custom abilities, or disabling app count/source enforcement. Selecting an explicit total skill limit allows any skill pool. Granting Expertise requires first choosing Proficient. Formula protection and native cell validation still apply. Save checks edited skill selections against freshly fetched rules, so late DM changes to a grant cannot silently bypass the app checks.

Overrides and custom abilities are stored per spreadsheet ID on the current device. They are included in draft backups. Export/import `character-rules.json` to transfer them to another device or player; they are not synchronized through Google Sheets. A reason field records the DM ruling. This is a convenience restriction system, not an access-control mechanism—players with sheet access can edit in Google Sheets.

## Desktop appearance

The sidebar collapse and light/dark preference persist on the device. First launch follows the system color preference. Both themes are checked at desktop widths. Section shortcuts remain available in the collapsed sidebar.

## Attribution

This work includes material taken from the System Reference Document 5.1 (“SRD 5.1”) by Wizards of the Coast LLC and available at https://dnd.wizards.com/resources/systems-reference-document. The SRD 5.1 is licensed under the Creative Commons Attribution 4.0 International License available at https://creativecommons.org/licenses/by/4.0/legalcode.
