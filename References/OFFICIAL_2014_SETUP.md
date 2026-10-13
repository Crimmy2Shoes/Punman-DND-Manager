# Official 2014 character options

The spreadsheet companion includes **13 official player classes and 118 unique subclasses**, using the 2014 rules and their published revisions. The catalog combines the PHB with the DMG, Sword Coast Adventurer’s Guide, Xanathar’s Guide, Tasha’s Cauldron, Eberron, Ravnica, Theros, Explorer’s Guide to Wildemount, Van Richten’s Guide, Fizban’s Treasury, Dragonlance and Bigby Presents. Reprints count once. Pugilist remains separate homebrew.

The app adds 440 original expansion/base-Artificer feature summaries to the existing core features. Each records its source, class level and action category. Your guide shows your selected class/subclass features at your level. Use **Play → Rules library** to browse future unlocks.

## Install dropdown references in your Google Sheet

The app’s library is available immediately. Character creation requires matching reference rows in the native spreadsheet; missing dropdown entries remain disabled.

If the file is still `.xlsx`, first open it in Google Sheets and choose **File → Save as Google Sheets**. Apps Script and the app’s Sheets API connection need that native Google Sheets copy. Use the new copy’s URL; see [Excel conversion steps](PLAYER_SETUP.md#if-a-character-file-is-excel-xlsx).

1. Open your native Google Sheet and choose **Extensions → Apps Script**.
2. Add a file named `Official2014`; keep your existing Pugilist script.
3. Paste [Install_Official2014.gs](Install_Official2014.gs) into it.
4. Save, select **installOfficial2014**, then **Run**.
5. Authorize access to your own spreadsheet. The script creates a complete workbook backup **before making any changes**; its URL appears in the execution log.
6. Return to the app and click **Refresh**.

The installer appends missing names and an Artificer base-class row, without overwriting existing reference rows. It checks the destination for existing values/formulas, expands Class Info to 600 rows, and extends explicit Class Info ranges ending at row 180 to row 600 in formulas and validations. Other reference ranges, character inputs and IMAGE formulas stay intact. Repeated runs skip installed entries. Unlike the older core installer, this supports a catalog larger than the original 180-row limit.

Review the native recalculated totals after saving a changed class. Subclass combat effects, armor changes and movement bonuses are described in the guide; the installer does not invent new formulas for those effects. Higher-level/conditional skill benefits must be represented in your sheet’s feature entries or confirmed through DM overrides; the sheet’s skill total still takes priority.

## Personalization and choices

Use **Customize abilities → Feature choices** to record Rune Knight runes, Arcane Archer shots, Genie patron, Storm environment, Divine affinity, Swords style and Artificer infusions/armor model, alongside the existing core choices. Learned Artificer infusions do not become active abilities until selected as active infused items. Armorer’s two additional infusions are restricted to its Arcane Armor parts. Choices are local per spreadsheet, included in rule exports, and do not spend resources automatically.

Scout adds doubled proficiency in **Nature and Survival**, separate from ordinary Rogue Expertise choices. Royal Envoy doubles **Persuasion**. Knowledge Domain’s two doubled proficiencies remain restricted to its granted knowledge skills. The skills panel reports the fixed skills; DM overrides can grant confirmed exceptions.

Cleric, Paladin, Druid and Artificer subclass spells are always prepared; expanded Ranger/Sorcerer grants are extra known spells. Warlock patron spells are learning options. Replaced Aberrant Mind/Clockwork spells and Divine Soul affinity spells must be recorded in your sheet and reviewed with the DM; the reference list shows the original grants.

## Items and coverage

**Inventory → Browse items** searches **437 unique SRD entries**, including **240 magic-item definitions**, armor, weapons, gear and tools. Some entries cover multiple variants, such as +1/+2/+3 weapons and healing potion strengths. The basic healing potion uses its published 50 gp/½ lb values; select other variants manually. Adding an item stages its name, quantity, price and weight where specified, then uses the normal reviewed spreadsheet save. Unknown prices and weights remain blank. Attunement requirements and effects appear in the reference; ownership does not automatically equip, attune or change stats.

The spell library contains the 361 core PHB spells plus five Tasha’s summaries required by these subclass grants. This does **not** claim every expansion spell, magic item, feat, racial variant or optional class-feature replacement. Summon stat blocks, random tables and other detailed tables retain linked references. Non-SRD entries are original mechanical summaries, not full reproductions of commercial books. Bladesinging uses the Tasha’s revision of the 2014 subclass; revised 2024 subclasses and Unearthed Arcana are excluded.

The item builder reads the local licensed SRD 5.1 PDF; rebuild with `node scripts/build-legacy-items.mjs` from `app`. Rebuild the native installer with `node scripts/build-official-installer.mjs`.

For friends using their existing character files in the shared Drive folder, see [player hosting and sharing setup](PLAYER_SETUP.md). Install any necessary class references in the files first. Players paste their normal sheet URL into the app and retain full editing; the app creates no spreadsheets.
