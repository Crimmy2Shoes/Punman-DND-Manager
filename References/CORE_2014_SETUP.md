# Core 2014 rule pack and native subclass names

The app now contains the 12 PHB 2014 classes and all 40 PHB subclass feature progressions, 361 spell entries (319 full licensed SRD descriptions plus 42 original mechanical summaries), and all 18 skill definitions. It follows the spreadsheet-era rules, not the revised 2024 spell/class definitions.

For the expanded official catalog, use [Official 2014 setup](OFFICIAL_2014_SETUP.md). Its newer installer includes the core options and supports the larger Class Info table; the older installer below remains available for core-only installation.

Use **Play → Rules library** to inspect class/subclass features, unlock levels and source links. Use **Customize abilities → Feature choices** to record selected Fighting Styles, Metamagic, Pact Boons, invocations, maneuvers, Hunter options, PHB totems, Four Elements disciplines or a Circle of the Land terrain. Choices are local per sheet and are included in Export rules. These choices do not spend resources, change formulas or synchronize through Google Drive.

Use **Spells → Browse spell definitions** for search, filters, complete SRD descriptions and additional spell summaries. **Class and level options** filters ordinary access; it is not a learned/prepared spell list. Domain/oath/selected-land spells are always prepared; patron expanded lists are options, not automatic known spells. The sheet still owns slot counts.

## Add missing subclass names to the native spreadsheet

The app does not pretend the original Class Info table already contains every subclass. Missing choices in character creation are disabled until installed in the sheet.

1. Open your native Google character sheet.
2. Choose **Extensions → Apps Script**.
3. Add a script file named `Core2014`. Keep the existing Pugilist script.
4. Copy [Install_Core2014.gs](Install_Core2014.gs) into that file.
5. Save, select `installCore2014`, and click **Run**.
6. Authorize the script for your own spreadsheet. It creates a full backup first and prints the backup URL in the execution log.
7. Return to the app and click **Refresh**. The missing subclass names become available in creation.

The installer only appends missing Class Info reference rows, through the original formula limit of row 180. It refuses occupied rows before making changes and can be rerun without duplicate names. It preserves image formulas, character values and existing formulas. It does not install subclass combat effects or replace caster formulas. Eldritch Knight/Arcane Trickster entries use the original supported Third Caster type and Intelligence; save and refresh so the native sheet recalculates slots. The app shows their separate class-level spell access. Knowledge/Nature skills still require selection, and Knowledge's doubled proficiencies must be marked Expertise in the sheet. Review the native calculated totals and equipment after saving.

## Coverage boundaries

This is the core PHB 2014 pack plus the previously selected World Anvil Pugilist version. It is not every official expansion, Unearthed Arcana, feat, race variant or homebrew. World Anvil is community-authored and includes altered 2014 and revised 2024 entries; imported mechanical summaries carry source links. Random tables, summons/companions and combat adjudication use the linked references and your DM. The app does not claim to automate every rule interaction.

