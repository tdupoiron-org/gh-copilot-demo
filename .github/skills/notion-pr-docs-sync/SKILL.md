---
name: notion-pr-docs-sync
description: 'Analyze the latest merged pull request and update product documentation in Notion. Use for updating the main page abstract, refreshing the user guide, documenting a merged PR, or capturing Playwright screenshots for Notion documentation.'
argument-hint: '[optional PR number]'
user-invocable: true
---

# Notion PR Documentation Sync

Update the Notion product documentation so it describes the behavior introduced by a merged pull request. The expected outputs are a concise abstract on the documentation root page and an accurate, screenshot-backed user guide on its child page. When that documentation does not exist yet in the workspace, bootstrap it once instead of stopping.

## Inputs

- Use the supplied PR number when one is provided.
- Otherwise, resolve the latest merged PR on the default branch with `gh pr list --state merged --base <default-branch> --limit 1 --json number,title,url,mergedAt`.
- Treat `NOTION_DOCS_PAGE_ID` as an optional discovery hint when it is set; do not wait for or require a page ID.
- Use `REPOSITORY` when set; otherwise resolve the repository with `gh repo view --json nameWithOwner`.

Stop before writing if the PR is not merged. Do not stop merely because no documentation exists yet: when the workspace contains no page for this product, create it as described in step 2b. Still stop before writing when candidate pages exist but none can be matched to this product unambiguously, since guessing risks overwriting unrelated documentation.

## Procedure

### 1. Inspect the merged PR

1. Fetch the PR metadata and files:
   `gh pr view <number> --repo <repository> --json number,title,body,url,mergedAt,author,files,baseRefName,headRefName`.
2. Read `gh pr diff <number> --repo <repository>` and the current source files that own the changed behavior.
3. Identify the user-visible current behavior, including changes to workflows, UI, API endpoints, configuration, environment variables, setup, deployment, and removed functionality.
4. Ignore dependency-only, formatting-only, test-only, CI-only, and behavior-preserving refactors.

If there is no documentation impact, make no Notion edits or screenshots and report why.

### 2. Inspect the existing documentation

1. If `NOTION_DOCS_PAGE_ID` is set, fetch it first. When `NOTION_DOCS_PAGE_ID` is absent, use Notion search with the repository name, application name, and distinctive terms from the PR, then fetch likely pages and their children.
2. Identify:
   - the root page section that acts as the product abstract or overview;
   - the existing user-guide child page.
3. Confirm the selected pages from their content, hierarchy, and relationship to the changed product. Do not choose a page from title similarity alone.
4. Preserve the pages' tone, terminology, heading hierarchy, and unrelated content.
5. Update existing pages in place. Do not create a duplicate root or user-guide page. Create a child page only when the PR introduces a genuinely new documentation topic.

Treat the documentation as missing only when the searches above return no page describing this product, including after inspecting the children of the accessible top-level pages. An empty or unrelated search result is a bootstrap trigger, not a blocker.

### 2b. Bootstrap the documentation when it does not exist

Run this step only when step 2 found no documentation for this product, and only when the PR has user-facing documentation impact.

1. Re-run the search immediately before creating anything, and use the existing pages if the product documentation appears. Never create a second root when one already exists.
2. Choose the parent in this order: the page identified by `NOTION_DOCS_PAGE_ID`; an existing documentation-style parent page that clearly hosts product docs; otherwise the workspace root the integration can write to. If the Notion integration cannot create a page anywhere, report that as the blocker and make no other edits.
3. Create the root page with a title that names the product and makes the page findable by the same search on later runs. Include the repository's `owner/repo` in the page body so future runs can match it unambiguously.
4. Add the abstract to the root page, then create exactly one user-guide child page under it.
5. Populate both pages using steps 3 to 5, exactly as for pre-existing pages, including Playwright verification and screenshots.
6. Report clearly in the final report that the pages were newly created, and include their URLs so the page ID can be captured for future runs.

### 3. Run and verify the changed experience

1. Derive the required build and run commands from the repository. Install dependencies only when needed.
2. Start the API and frontend with the configuration needed to exercise the changed user-facing flow.
3. Use Playwright at a desktop viewport and a mobile viewport to perform the documented flow as a user would.
4. Verify the relevant controls, data, navigation, loading states, and error states. Check the browser console and failed network requests.
5. If the behavior cannot be reproduced, do not present it as verified documentation. Report the blocker and avoid speculative screenshots or instructions.

### 4. Capture user-guide screenshots

1. Capture only screenshots that explain a changed or newly documented step.
2. Prefer stable application states with representative non-sensitive data. Exclude browser chrome, secrets, tokens, personal information, debug overlays, and unrelated windows.
3. Use a descriptive temporary filename containing the PR number and guide step. Do not commit screenshots to the repository.
4. Screenshot inspection is required after every capture. Reject blank, clipped, overlapping, stale, or misleading images.
5. Add each accepted screenshot next to the relevant user-guide step with concise alt text and a short caption when context is not obvious.

Upload each accepted image with the configured Notion MCP upload or attachment mechanism, then embed the resulting Notion-hosted image beside the matching guide step. Never substitute an inaccessible local path or data URL. If upload unexpectedly fails, complete text updates only when they remain useful and report the failure explicitly.

### 5. Update the Notion pages

Update the root-page abstract only when the PR changes the product's purpose, primary capability, audience, or top-level usage. Keep it short and describe the product as it works now. On a page newly created in step 2b, always write the abstract, since the page starts empty.

Update the user guide with task-oriented steps that a user can follow against the verified application. Include prerequisites, navigation labels, expected results, and screenshots where they materially reduce ambiguity. Remove or revise stale instructions contradicted by the PR.

Never paste a raw diff, commit hash, internal implementation narrative, or test details into user-facing documentation.

Append this traceability line to every page changed, replacing an older generated traceability line when present:

`_Last updated from PR #<number> — <PR title> (<merge date>)_`

Link the traceability text to the PR URL using the page's existing Notion formatting conventions.

## Completion Checks

Before finishing, confirm that:

- the selected PR is the requested PR or the latest merged PR on the default branch;
- every claim is supported by the merged code and, for UI instructions, by the Playwright run;
- the root abstract remains concise and the user guide is task-oriented;
- screenshots are readable, current, non-sensitive, and placed beside the matching steps;
- no duplicate Notion pages were created, and any page created in step 2b was created only after a final search confirmed none existed;
- unrelated Notion content was preserved;
- each changed page has exactly one current traceability line;
- no repository modifications were made: no files, commits, branches, or pull requests were created or changed during execution.

## Final Report

List the PR analyzed, each Notion page updated with its title and URL, the abstract and guide changes made, and every screenshot added. State explicitly whether each page was updated in place or newly created, and surface the new root page URL when one was created. If no update was needed or any step was blocked, state that explicitly with the reason.