# Host the player app on GitHub Pages

GitHub Pages hosts the website, while your shared Google Drive folder keeps the character files. Everyone uses the same website, pastes their sheet’s normal URL, and signs in with their own Google account.

The deployment workflow is already included at `.github/workflows/deploy-pages.yml`. It builds only the player app, checks that owner assets are excluded, and publishes `app/dist-players`. It automatically handles repository paths such as `/dnd-manager/`.

## 1. Create a GitHub repository

Create an empty repository named, for example, `dnd-manager`. GitHub Free supports Pages for public repositories; private-repository Pages requires an eligible paid plan. [GitHub Pages availability](https://docs.github.com/en/pages/quickstart)

Keep the project layout: `.github`, `app`, `References` and the root documentation belong at the repository root. The root `.gitignore` excludes local Excel/PDF documents, environment files, the extracted personal workbook preview and generated builds. Existing local files are preserved. It is applied by Git; the GitHub browser upload form does not apply your local ignore rules.

Use the terminal from the **project root**, one directory above `app`:

If you already created and cloned the repository (for example, into `Punman DND Manager`), open a terminal in that repository folder. It already has its Git metadata and remote: skip `git init`, `git branch -M main` and `git remote add origin` below. Start with `git add .` and `git status --short`, then commit and push using the existing remote.

```powershell
git init
git branch -M main
git add .
git status --short
```

Check that `.github/workflows/deploy-pages.yml`, `app/.env.players`, `app/package-lock.json` and the app source are staged. Your `.env.local`, Excel/PDF files, `app/src/data/punpun.json`, `node_modules` and build output should be absent. Then commit and upload, replacing the example address with your actual empty repository:

```powershell
git commit -m "Add character companion and Pages deployment"
git remote add origin https://github.com/YOUR_USERNAME/dnd-manager.git
git push -u origin main
```

Git may ask you to sign into GitHub. If it asks for your name/email for commits, configure your preferred Git identity before committing. No GitHub token needs to be put in the project.

The private workbook export is optional when building the app. Your local owner preview continues using it; a fresh source checkout can connect directly to a Google Sheet without that export. The existing workbook-dependent research/unit/browser fixtures still require your local untracked export; the hosting workflow does not run those fixtures.

## 2. Set the public Google client ID

In the GitHub repository, open **Settings → Secrets and variables → Actions → Variables → New repository variable**.

Name: `VITE_GOOGLE_CLIENT_ID`

Value:

```text
956543850300-0iggcrcn68lq44jtn8oem8khid1c0bnp.apps.googleusercontent.com
```

This is the public browser OAuth client ID you already provided. It is expected to appear in the built website. Do not use a client secret, account password or access token.

## 3. Enable Pages and deploy

Open **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.

Open **Actions → Deploy player app to GitHub Pages → Run workflow**, selecting `main`. The first push may show a failed run if you had not configured Pages or the variable yet; rerun after both settings are ready. Later pushes to `main` deploy automatically.

The successful deployment shows its website address, normally:

```text
https://YOUR_USERNAME.github.io/dnd-manager/
```

The app uses query strings rather than separate page routes, so reloading the character view stays on the same Pages URL. [Vite Pages deployment](https://vite.dev/guide/static-deploy.html#github-pages) · [GitHub Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

## 4. Allow Google sign-in from the website

In your existing Google Cloud Web application OAuth client, add this **Authorized JavaScript origin**:

```text
https://YOUR_USERNAME.github.io
```

Use the origin without `/dnd-manager/`. Keep your localhost origins for local development. If your Google OAuth audience is still Testing, add your friends’ Google emails as Test users. [Google OAuth setup](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid)

Send everyone the full app URL including `/dnd-manager/`. They paste the URL of their **native Google Sheets character file** from the shared folder. Excel files must first be converted with **File → Save as Google Sheets**, then use the converted copy’s link. Your folder/file sharing determines which characters each account can view or edit. See [player setup](PLAYER_SETUP.md).

## Updating the app

After making changes, commit and push them to `main`. Actions rebuilds and deploys the player website. Character data stays in Google Drive and is not stored in GitHub.

This workspace has been prepared for deployment; no repository has been created or uploaded, and no website has been published yet.
