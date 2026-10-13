# Pugilist setup — original artwork retained

The additions follow [the Pugilist version you selected](https://www.worldanvil.com/block/205750). The app reads the spreadsheet's results; it does not replace the workbook with an independent rules engine.

## Apply to your native Google sheet

1. Open the original Google spreadsheet you and your DM use. Do not use the image-free copy.
2. Choose **Extensions > Apps Script** and add a new script file. Keep any existing code.
3. Paste [Install_Pugilist.gs](Install_Pugilist.gs), save, select **installPugilist**, and run it. Review Google's permission prompt for the spreadsheet script.
4. The script first creates a backup and logs its URL. It then modifies the active sheet, so your existing URL and your DM's access remain the same.
5. When installation finishes, sign into the app's Google connection if needed and press **Refresh**.
6. Open **Create / edit character**, choose Pugilist, set class level and appropriate XP, and select a Fight Club when eligible. Review and save these inputs.
7. In **Play**, choose **Pugilist Fisticuffs** in an attack slot if you want it on the main sheet. Open **Pugilist** for resource and ability tracking.

The generated installer is also downloadable from the app's Pugilist panel. It uses SpreadsheetApp only and does not fetch rules or images from outside sites.

## Changes made

- Adds a `Pugilist` tab with progression, derived statistics, input validation and resource trackers.
- Adds the class and seven Fight Clubs in free rows of `Class Info`, after existing entries, without moving rows or columns. Occupied helper rows are skipped.
- Adds `Pugilist Fisticuffs` in a free `Attack Info` row, retaining the original unarmed attack entry.
- Adds the `PugilistLevel` named range.
- Wraps four existing formulas: effective Strength (`v2.1!C15`), effective Constitution (`v2.1!C25`), Dexterity save proficiency (`v2.1!H18`) and carrying capacity (`Inventory!E24`). Their original expressions remain the fallback whenever the relevant Pugilist feature is inactive.
- Leaves every IMAGE formula in place. Does not change your current class, XP, inventory or attacks automatically.

Re-running refuses an existing Pugilist installation instead of duplicating it. If installation fails partway through, the error includes the backup URL; restore from it before retrying. Coordinate the one-time installation with your DM so neither of you edits the integration cells during the run.

## Using the controls

Resource buttons prepare drafts and use the existing review/save workflow. They do not immediately write to Google Sheets.

Save changes to class, scores and equipment before using abilities that depend on those calculated values. For Brace Up, save the die roll first, let the sheet calculate temporary HP, then use Apply Brace Up and review the resulting edits.

Rest controls recover the eligible Pugilist resources only. HP, exhaustion, hit dice, condition effects, temporary buffs, reactions and companion actions remain separate. The Pugilist exhaustion cell is a tracker, not an automatic implementation of all exhaustion effects.

At level 20, enable the capstone score-increase toggle only if those increases have not already been entered manually. Fight Club proficiency choices, companion statistics, invocations, class weapon alternatives and situational effects still require player/DM input. The selected page does not specify multiclass entry proficiencies or prerequisites; the installer does not invent them. Its starting armor/weapons/tools are placed in the first-class proficiency column.

The installer was checked against a mocked spreadsheet with the supplied workbook layout. Native Google calculation results and account permissions still need verification when you run it. Your live sheet and original XLSX have not been changed by development tools.

## Development

`app/src/data/pugilist.json` is the shared integration data. Rebuild the installer after changing it or the script body:

```powershell
node app/scripts/build-pugilist-installer.mjs
```

This updates both the reference script and the app's downloadable script. Unit tests verify the installer preserves images, creates the backup before edits, respects occupied rows and avoids duplicate installations.
