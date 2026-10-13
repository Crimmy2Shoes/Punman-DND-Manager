# Use character sheets from your shared Google Drive folder

Everyone uses the same app address. Each character is an existing spreadsheet file in your shared folder. Players choose their character by pasting that file’s ordinary Google Sheets link; no special player links or individual app installs are required.

## For players

1. Open your character spreadsheet in the shared Google Drive folder and copy its URL.
2. Open the character app, paste it into **Character spreadsheet URL**, and click **Open character**.
3. Sign in with your own Google account when prompted, then edit and save your character.

The app remembers the last successfully opened URL on that browser. **Edit character** changes the current character’s class, level, background, race, scores and skills. Spells, inventory and resources are also editable. **Notes & Lore** contains personality traits, ideals, bonds, flaws, appearance, allies and organizations, and character backstory. Changes are reviewed before saving to the same file; the app creates no spreadsheets.

Use **Sign out** to return to the entry form and paste another existing file link. Unsaved drafts and rule settings stay separate for each character. Opening another sheet after signing out requires Google authorization. Opening or reloading fetches current data before displaying the editor. DM updates refresh while the connected app is visible.

## If a character file is Excel (.xlsx)

Google Drive can open an Excel workbook in the Sheets editor while keeping its Office format. This app needs a native Google Sheets file. If it says “The document must not be an Office file,” open that character workbook in Google Sheets and choose **File → Save as Google Sheets**. Conversion creates a new Google Sheets copy; the original Excel workbook remains unchanged.

Use the **new copy’s URL** in the app, and make sure the new file is in your shared character folder. Install any needed class/Pugilist references in that converted copy. Changing the name or removing `.xlsx` from the filename does not convert the file. [Google’s Excel-to-Sheets instructions](https://support.google.com/a/users/answer/9331167?hl=en)

## Shared-folder access

Players need Google permission to edit their character file. Files in a shared folder inherit its sharing permissions. Everyone who can view the folder can usually view its character sheets; folder Editors can edit them too. Pasting a character URL selects the file to work on, but does not enforce ownership or hide other accessible files. The app follows Google’s existing permissions.

[Google folder sharing and inherited access](https://support.google.com/drive/answer/7166529?hl=en)

## One-time setup for the app owner

For GitHub hosting, follow [the GitHub Pages setup guide](GITHUB_PAGES_SETUP.md). The included workflow builds and deploys the player website automatically after pushes to `main`.

Your existing Google OAuth web client ID stays in `app/.env.local` as `VITE_GOOGLE_CLIENT_ID`. Players do not enter a client ID or client secret.

From the `app` directory, build the website:

```powershell
npm.cmd run build:players
```

Host **only `app/dist-players`** on an HTTPS static host. For example, sign into [Netlify Drop](https://app.netlify.com/drop) and upload that built folder. Send everyone the same resulting website address. Update it by rebuilding and uploading `dist-players` to the existing site. [Netlify deployment instructions](https://docs.netlify.com/manage/projects/add-new-project/)

In your Google Cloud project’s Web application OAuth client, add that website’s origin under **Authorized JavaScript origins**, such as `https://your-character-app.netlify.app`, without a path or query string. Keep the localhost origin for your local app. If OAuth is still in **Testing**, add your friends’ Google email addresses to **Test users**; this is separate from the folder’s sharing list. [Google OAuth setup](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid) · [Google audience settings](https://support.google.com/cloud/answer/15549945?hl=en)

The player build excludes your extracted workbook preview, legacy journal and Apps Script installers. Its build check verifies those exclusions. The ordinary `dist` build retains your owner preview and is for your local owner workflow. The owner’s **Share player link** generator remains optional: it can prefill a sheet URL, but players can always paste a normal sheet link themselves.

## Local preview and verification

Your local owner app can preview the paste form at `http://localhost:5173/?player=1`. The standalone player development command is `npm.cmd run dev:players`, normally on port 5174; add that origin to Google if testing actual sign-in there. A localhost address only works on the computer running the app.

Try a player’s Google account: paste their normal sheet URL, open it, edit a value and save. Confirm the existing file changed. Sign out and open another sheet to verify drafts stay with their original file. A file the account cannot access should show an error. Browser tests use mocked Google responses and do not change real Drive files or permissions.

Player mode stores the last URL, drafts and rules on the device, but does not persist workbook snapshots. Signing out or Google access expiring closes the editor; drafts remain for the next authorized open. DM rules and custom choices can be transferred using the existing rules export/import.
