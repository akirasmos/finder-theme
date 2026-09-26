# Running The Quill Games: a guide for editors

This covers three things: who is allowed to publish puzzles, how to make a
Quirdle or a Quill Mini, and how to hook it all up to mkquill.com.

## How permissions work

The games are plain files on a website, so "who can make puzzles" really means
**who can change two files**:

| File | What it controls | Who can change it |
|---|---|---|
| `js/quirdle-answers.js` | Which Quirdle word runs on which day | The Quirdle editors (a few people) |
| `js/mini-puzzles.js` | Every Quill Mini puzzle | The Mini editor (one person) |

Those rules live in **`.github/CODEOWNERS`** and are enforced by GitHub.
Anyone else can *suggest* a change, but it can't go live until the right person
approves it.

The two editor pages (`editor/quirdle.html` and `editor/mini.html`) are safe to
leave online. Anyone can open them and draft puzzles, but they can't publish
anything. Publishing only happens through GitHub.

> Heads-up: everything a browser plays has to be sent to the browser, so a
> determined student could dig answers out of the page source. Permissions
> control who can **change** puzzles, not who can peek at them.

## One-time setup on GitHub

Do this once, as the owner of the repository that hosts the games.

1. **Give the games their own repository (recommended).** Right now they sit
   inside the `finder-theme` repo. Make a new repo (for example
   `quill-games`), copy the contents of the `quill-games/` folder into it, and
   copy `.github/CODEOWNERS` too. In the new repo, remove the `/quill-games`
   prefix from each path in `CODEOWNERS` (e.g. `/js/mini-puzzles.js`).
2. **Add your editors as collaborators.** Repo **Settings → Collaborators →
   Add people**. Give them the **Write** role. Each person needs a free GitHub
   account.
3. **Name who owns what.** Edit `.github/CODEOWNERS` and replace `@akirasmos`
   with real usernames:
   ```
   /js/quirdle-answers.js   @quirdle-editor-1 @quirdle-editor-2 @quirdle-editor-3
   /js/mini-puzzles.js      @mini-editor
   ```
   Keep yourself as the owner of `/.github/CODEOWNERS` so nobody can change
   the rules.
4. **Turn on enforcement.** Repo **Settings → Branches → Add branch
   protection rule** (or **Settings → Rules → Rulesets → New branch ruleset**)
   for the `main` branch, and check:
   - Require a pull request before merging
   - Require approvals (1)
   - Require review from Code Owners

   Without this step, CODEOWNERS only *suggests* reviewers and doesn't block
   anything.

**When the Mini editor publishes their own puzzle:** GitHub never lets people
approve their own changes. So when the Mini editor submits a puzzle, you (the
repo admin) finish it by clicking **Merge without waiting for requirements to
be met** on the pull request. When anyone *else* touches the Mini file, only the
Mini editor's approval can publish it. The Quirdle file works the same way, but
with several owners they can simply approve each other's schedules.

## Making a Quirdle

1. Open `editor/quirdle.html` (on the live site, or by double-clicking the file
   on your computer).
2. Type a word next to any date. Each word is checked right away:
   - it must be 5 letters
   - it must be in the word list, or players wouldn't be able to type it
   - it can't already be used on another date
3. Days you leave blank use the next word from the **backup list** (the gray
   words), so there's never a missing puzzle. You can edit the backup list at
   the bottom of the page too.
4. Click **Download quirdle-answers.js**.
5. On GitHub, open the `js` folder → **Add file → Upload files** → drop in the
   downloaded file (it replaces the old one) → choose **Create a new branch and
   start a pull request** → **Propose changes**.
6. A Quirdle editor approves it and clicks **Merge**. It's live within a
   minute or two.

## Making a Quill Mini

1. Open `editor/mini.html`.
2. Build the grid. Click a square and type. Press `.` or `#` for a black
   square, and press Space to switch between typing across and down. Tip:
   start from a published puzzle with **Load a published puzzle…** and change
   it.
3. Write a clue for every word. The clue boxes appear automatically as words
   form.
4. Watch the **Checks** list until it says **✓ Ready to publish**. It flags
   empty squares, missing clues, repeated words, 5-letter words it doesn't
   recognize, and letters that aren't in both an across and a down word.
5. Click **Test solve** to play it exactly as readers will. Test solves don't
   touch your real stats.
6. Optional: set a **Date** to run it on a specific day. Puzzles without a
   date rotate on all other days.
7. Click **Copy puzzle entry**. On GitHub, open `js/mini-puzzles.js` → the
   pencil (**Edit**) icon → paste the entry at the end of the list, just above
   the final `];` → **Commit changes… → Create a new branch and start a pull
   request**.
8. The Mini editor approves and merges (or you do, if the Mini editor wrote
   it; see above).

Good Mini habits: keep 5-letter words common, avoid obscure abbreviations, and
give school-themed clues when you can. The first puzzles in the file are good
examples.

## Putting it on mkquill.com

mkquill.com looks like a WordPress site. Once you have access, the simplest
setup is to keep the games on GitHub and link them from the newspaper site.
That way puzzle permissions stay in GitHub, and nobody has to touch the
newspaper's server.

1. **Publish the games with GitHub Pages (free).** In the games repo:
   **Settings → Pages → Source: Deploy from a branch → `main` / root → Save**.
   After a minute the games are live at
   `https://<your-username>.github.io/quill-games/`.
   - Optional: a nicer address like `games.mkquill.com`. Add it under
     **Settings → Pages → Custom domain**, then ask whoever manages the
     mkquill.com domain (your adviser, the school's IT staff, or the site's
     hosting provider) to add a `CNAME` record pointing `games` to
     `<your-username>.github.io`.
2. **Add a "Games" link to the site's menu.** In WordPress:
   **Appearance → Menus** (or **Appearance → Customize → Menus**) →
   **Custom Links** → URL: your games address, Link text: `Games` →
   **Add to Menu → Save**. If the site is hosted by a student-newspaper
   service with its own menu settings, it's in the same kind of place.
3. **Or embed it in a WordPress page instead.** Create a page called
   "Games", add a **Custom HTML** block, and paste:
   ```html
   <iframe src="https://<your-username>.github.io/quill-games/" style="width:100%;height:900px;border:0" title="The Quill Games"></iframe>
   ```
   A plain menu link usually works better on phones. Use this only if you
   want the site's header around the games.
4. **Lock down the WordPress side.** In **Users**, only **Administrators**
   can change menus and only **Editors/Administrators** can edit any page, so
   keep those roles for the people who should manage the Games link. Staff
   writers should be **Authors** or **Contributors**, who can't touch menus or
   other people's pages.
5. **Update the game links.** In `index.html`, the nav bar links already point
   to mkquill.com's sections. Check them against the real site and fix any that
   changed.
6. **Set the launch date.** Change `LAUNCH_DATE` in `js/common.js` to the day
   you go live, so that day is puzzle #1.

If your host lets you upload files directly (SFTP or a file manager), you can
also upload the `quill-games` folder next to the site's files. You lose the
GitHub approval step that way, so only do it if the people with upload access
are the same people who should control the puzzles.
