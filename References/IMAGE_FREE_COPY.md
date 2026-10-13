# Image-free PunPun copy

`PunPun_Character_NoExternalImages.xlsx` is a separate cleaned workbook. The original `PunPun_Character.xlsx` was not modified.

Verification: removed 354 IMAGE-formula cells (including shared-formula followers), and preserved all 1,060 other formulas exactly. Cell styles and worksheet structure were retained. Unused image URL strings and ordinary hyperlinks remain in helper cells; these do not automatically fetch images as formulas do.

## For your actual Google spreadsheet

Prefer cleaning a native Google copy rather than reimporting the XLSX. The original Excel export wraps some Google-only formulas in `__xludf.DUMMYFUNCTION`; this can cause issues when round-tripping through Excel.

1. Open your native Google spreadsheet.
2. Choose **Extensions > Apps Script**. Add a new script file so existing script code remains intact.
3. Paste the contents of `Make_Image_Free_Google_Copy.gs`.
4. Select **makeImageFreeCopy** and run it. Review Google's requested permissions before granting access.
5. The script creates a separate sheet copy, clears IMAGE-formula cells in that copy and reports its URL. It does not edit the source spreadsheet.
6. Review the copy character statistics. In the hosted app, save or discard any drafts, sign out, paste the new copy URL and open it. For the local owner preview, open the app with `?connect=1` to update the connection.

If your DM edits the original sheet, those edits will not propagate to the new copy. Agree on which sheet you and the DM will use before switching the app's URL.

The script removes image fetches only. Any additional live scripts, add-ons or IMPORT functions are outside the local workbook audit and are not removed. No live Google spreadsheet was modified during this cleanup.
