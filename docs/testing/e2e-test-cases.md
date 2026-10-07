# Automated Test Catalog (plain language)

This page lists **every automated end-to-end (E2E) test** for AutoWRX and explains,
in everyday words, what each one checks. No technical background needed.

- **What is an E2E test?** A robot opens the website in a real browser, clicks
  around like a human, and checks that the right thing appears on screen.
- **How many are there?** 155 tests in 40 groups.
- **How do I run them?** One command (`yarn test` inside the `.agents` folder).
  The system prepares everything by itself: it starts the website and its
  backend if they are not running, signs in as the test administrator, and
  switches on the settings the tests need.
- **Does it mess up my data?** The tests create their own demo items (names
  start with `E2E_` or similar) and clean up after themselves. A manual "test
  instance" should be used, not a production server — the tests change
  settings and add/remove content.

---

## 1. Signing in and signing out

| Test case | What it checks |
|---|---|
| Homepage loads and shows Sign In button | Opening the website shows the home page with a Sign In button. |
| Login modal opens on Sign In click | Clicking Sign In opens the login window. |
| Admin can login successfully | Entering the right email and password signs the user in. |
| Wrong password shows error | A wrong password shows a clear error message instead of signing in. |
| Admin can logout | Signing out returns the user to the signed-out state. |

## 2. Admin panel and permissions

| Test case | What it checks |
|---|---|
| Admin panel is accessible | The admin area opens for an administrator. |
| Site config page loads | The settings page opens. |
| User management page loads | The user list page opens. |
| Manage users via /manage-users route | The user management screen also opens from its direct link. |
| Plugins page loads | The plugin management page opens. |
| Non-admin cannot access admin routes | A normal user is kept out of admin-only areas. |
| /admin/templates page loads | The model templates admin page opens. |
| /admin/dashboard-templates page loads | The dashboard templates admin page opens. |
| /manage-features page loads | The feature management page opens. |
| Create new user — fill form and cancel | Starting "create user" and pressing cancel adds nobody. |
| Assign user to feature via UI | An administrator can give a user a feature licence, and it stays after refreshing. |
| Legacy site-config keys are hidden (3 tests) | Old/retired settings no longer appear on the settings page, while current ones do — in every settings category. |
| Restore default reverts modified public config | Pressing "restore default" on a changed setting puts the original value back. |
| Restore default cancel keeps modified value | Cancelling the restore leaves your changed value in place. |

## 3. Vehicle models — create, view, change, delete

| Test case | What it checks |
|---|---|
| Open model list page | The Vehicle Models page opens. |
| Open "Create New Model" dialog | The create-model window opens. |
| Create a new vehicle model | A new model is actually created and appears. |
| Model detail page loads | Clicking a model opens its detail page. |
| Model detail shows library tab | The model page shows its prototype library tab. |
| Edit model name inline | Renaming the model on the spot works. |
| Delete model with confirmation | Deleting asks for confirmation, then removes the model. |
| Logged-out user can search public models | A visitor who is not signed in can search and find public models. |

## 4. Home page — model list

| Test case | What it checks |
|---|---|
| Guest sees only public released models | Visitors only ever see models that are public and released. |
| Admin sees category tabs and model actions | Signed-in users get the tabs (All / My Models / …) and the buttons. |
| My Models category shows owned private model | "My Models" lists your own models, even private ones. |
| Public category shows only public released models | The Public tab filters correctly. |
| Sort by Newest / Oldest / Name A-Z / Name Z-A / Last viewed / First viewed (6 tests) | Each sort option puts the cards in the right order. |
| Rename model via home context menu | The card's right-click menu renames the model. |
| Deleting a model refreshes the sibling prototype list | After a model is deleted, the lists around it update immediately. |
| My Contributions shows model for contributor | If you were invited to help on a model, it appears under My Contributions. |
| Contributed model is hidden from My Models tab | A model you contribute to does not count as "your" model. |
| Contributed private model is hidden from Public tab | Private shared models do not leak into the Public tab. |
| Contributor can open new prototype from home card | A contributor can start a prototype from the shared model's card. |
| Reader sees contributed model but edit menu is disabled | Read-only helpers can see the model but cannot edit it. |

## 5. Model visibility rules (who may do what)

| Test case | What it checks |
|---|---|
| Non-owner can create prototype on editable model | On a model marked "editable", other users may create prototypes. |
| Non-owner cannot create on public released model | Plain public models stay read-only for others. |
| Guest can view editable model but cannot create | Visitors can look at editable models but not create anything. |
| Guest home shows editable and public released models | Visitors see both editable and public models on the home page. |
| Non-owner can edit prototype they created | Your own prototype stays editable by you, even on someone else's model. |
| New-prototype picker lists editable model | Editable models appear in the "new prototype" chooser. |
| Template keeps editable and is_default together | Model templates remember the "editable" flag correctly. |
| Model inherits template editable visibility | A model created from a template keeps the template's visibility. |

## 6. Model customization menu (admin menu on model pages)

| Test case | What it checks |
|---|---|
| Setup: create model and prototype owned by admin | Prepares the demo data used by the checks below. |
| Flag on — model page menu shows items (2 tests) | With the customization switch on, the model menu lists the extra admin entries. |
| Flag on — prototype page menu shows items | Same for the prototype page menu. |
| Flag off — menu hidden even for admin (2 tests) | With the switch off, nobody sees the customization menu. |
| Save Model as Template opens dialog | The "save as template" entry really opens the template window. |
| Admin sees menu on a model they do not own | Administrators always see the menu, even on other people's models. |
| Non-admin owner sees items but not Save Prototype as Template | Normal owners get a reduced menu. |
| Flag off hides menu for non-admin owner too | The off switch wins for everyone. |

## 7. Model deletion / recreation and prototype renaming

| Test case | What it checks |
|---|---|
| Deleted model can be recreated with the same name | Deleting a model frees its name — no false "name already exists". |
| Prototype rename updates header and card immediately | Renaming a prototype updates the page and the card straight away, without reloading. |

## 8. Home page — prototype list

| Test case | What it checks |
|---|---|
| Guest sees public released prototypes only | Visitors only see released prototypes. |
| Admin sees category tabs | Signed-in users get All / My Prototypes tabs. |
| My Prototypes shows only owned prototypes | The tab filters to your own work. |
| All remains available when My Prototypes is empty | Having no own prototypes doesn't break the tabs. |
| Category tabs are disabled when All is empty | With no prototypes at all, the tabs grey out sensibly. |
| Sort by Newest / Oldest / Name A-Z / Name Z-A / Last Viewed / First Viewed (6 tests) | Each sort option orders prototype cards correctly. |
| Clicking prototype card navigates to detail | Cards open the prototype's detail page. |

## 9. Home page sections and popular prototypes

| Test case | What it checks |
|---|---|
| Popular prototype appears when model is public and released | The "popular" section shows eligible prototypes. |
| Popular prototype hidden when model is private | Private work never shows up as popular. |
| Popular prototype hidden when state is Developing | Work in progress stays out of the popular section. |
| Popular prototypes section is visible | The home section renders. |
| Recent prototypes section is visible | The "recent" section renders. |
| Home page full layout check (logged in) | The whole home page draws without errors for signed-in users. |
| Feature list section renders configured links | Home page link cards configured by admins work, including opening external links in a new tab. |

## 10. Card images that fail to load

| Test case | What it checks |
|---|---|
| Model card falls back to default image | If a model's picture is broken, the default picture is shown instead. |
| Prototype card falls back to default image | Same for prototype cards. |

## 11. Import and export

| Test case | What it checks |
|---|---|
| Export and import model round-trip | Downloading a model as a file and importing it again produces a working copy. |
| Export and import prototype round-trip | Same for prototypes via the library page. |

## 12. Prototypes — create, view, change, delete

| Test case | What it checks |
|---|---|
| Go to new prototype page | The new-prototype page opens. |
| Create prototype from model library | Creating a prototype from a model works. |
| Prototype library shows created prototype | New prototypes appear in the library list. |
| Prototype detail page loads | The prototype page opens. |
| Rename a prototype via API | Renaming works and is reflected. |
| Delete a prototype via API | Deleting removes it from the list. |
| Library search/filter input visible | The library has a working search box. |
| Library sorts by name A-Z and Z-A | Library sorting works both directions. |
| Change prototype status to Released via UI | Switching a prototype to "Released" works from the screen. |
| Prototype feedback tab loads | The feedback tab opens. |
| Share button visible on prototype detail | The share button is where it should be. |
| Admin can delete another user's prototype via context menu | Administrators can remove other people's prototypes from the card menu. |

## 13. Prototype copy

| Test case | What it checks |
|---|---|
| Copy offered in card context menu | The card menu offers "Copy Prototype". |
| Copy button in detail header starts same flow | The header Copy button behaves the same way. |
| Copying carries content, drops dashboard template | A copy keeps the prototype's content but not the dashboard template binding. |
| Failed content copy still lands on the new prototype | Even when copying content fails, the user ends up on the new prototype. |

## 14. Prototype tabs and pages

| Test case | What it checks |
|---|---|
| Overview / SDV Code / Dashboard / Customer Journey tabs load (4 tests) | Each main tab opens cleanly with no broken layout. |
| Navigate through all tabs sequentially | Walking through every tab in order works. |
| Tabs are all visible in the tab bar | The tab bar shows Overview, SDV Code, Dashboard and Customer Journey. |

## 15. Prototype dashboard and widgets

| Test case | What it checks |
|---|---|
| Add built-in Terminal widget and save | A widget can be added to the dashboard and the change saved. |
| Applying a dashboard template delivers new options to the widget | Putting a template on the dashboard updates the widgets in it. |
| Re-rendering without a config change does not reset the widget | Unrelated updates don't disturb working widgets. |

## 16. Running prototypes (runtime)

| Test case | What it checks |
|---|---|
| Run prototype code and show output in runtime terminal | Pressing play actually runs the code and shows the result. |
| Runtime panel plugin replaces the built-in panel | A plugin can take over the runtime panel and still moves live values. |
| Built-in panel stays when no runtime plugin is configured | Without a plugin, the normal panel is used. |
| Add row and save journey matrix | The Customer Journey table accepts a new row and saves it. |
| Edit and persist architecture skeleton (shape, color, image) | Changes in the Vehicle API architecture drawing are saved. |

## 17. Project editor (SDV Code tab)

| Test case | What it checks |
|---|---|
| File tree read-only when the switch is off | With "allow adding files" disabled: no create/rename/delete/upload buttons. |
| Toolbar buttons visible when the switch is on | With it enabled, all file buttons are back. |
| Opens app_logic.py automatically on first load | Opening the code tab lands you in the main file, not an empty screen. |
| Markdown files render as documents | .md files show formatted text, not raw symbols. |
| Code tab loads with tree, tabs, auto-open and markdown | The full editor opens: file list, tabs, first file open, formatted docs. |
| Editing a file and saving persists after reload | Changes are saved for real — they survive a full reload. |
| Plain code opens the single-file editor | Prototypes with simple (non-project) code open the classic editor. |

## 18. Plugins

| Test case | What it checks |
|---|---|
| External plugin via routed script: create, attach, load | A plugin added by URL can be attached to a model/prototype and loads. |
| Internal plugin via ZIP upload: create, attach, load | A plugin uploaded as a ZIP file works the same way. |
| updatePrototype: toast shows by default; hidden with silent mode | The plugin notification appears normally, and "silent" suppresses it. |
| notifyTab flags the Code tab without navigating | A plugin can badge a tab for attention without jumping to it; opening clears the badge. |
| notifyTab does nothing when already there | No error or double-badge when the tab is already open. |
| Create plugin via UI | The "My Plugins" page can create a plugin. |

## 19. Vehicle API (signals)

| Test case | What it checks |
|---|---|
| Signal list loads on Vehicle API tab | The vehicle signal list appears. |
| Search filters signals by name | Typing in the search box filters the signal list. |

## 20. Personal pages

| Test case | What it checks |
|---|---|
| My Assets page loads with content | The personal assets page opens with items. |
| Filter tabs are visible if any | Asset filter tabs show up when there is something to filter. |
| Create and delete runtime asset | A runtime asset can be added and removed. |
| Profile page layout full check | The profile page renders correctly. |
| Edit display name if editable | Changing your display name works. |

## 21. Global search and navigation

| Test case | What it checks |
|---|---|
| Find prototype and navigate to detail page | The global search finds a prototype and its result opens. |
| Navigation bar editor loads in site config | Admins can edit the top navigation bar. |
| Left link action appears in navbar and navigates | A configured link shows up and works. |
| Right link action opens in new tab | Right-side links open in a new browser tab. |
| Search action opens global search dialog | A search button in the navbar opens the search window. |
| Empty config hides custom navbar actions | Removing the config removes the custom buttons. |
| Save via admin UI persists after reload | Saved navbar changes survive a page reload. |
| Reorder actions reflects in navbar | Moving an action down in the list moves it on the real site. |

## 22. Overall look and feel

| Test case | What it checks |
|---|---|
| Homepage full layout snapshot | The home page looks as expected. |
| Navigation bar visible and intact | The top bar is whole and positioned. |
| Footer is visible | The footer is present. |
| Logged-in layout has no broken elements | Signed-in pages draw without broken pieces. |
| Model list page layout | The Vehicle Models page layout is correct. |
| Profile page layout | The profile page layout is correct. |
| Responsive — full HD desktop (1920x1080) | Everything is fine on a big screen. |

## 23. Developer diagnostics (internal)

| Test case | What it checks |
|---|---|
| Debug login — press Enter / via API then cookie (2 tests) | Helper checks used while debugging sign-in automation. Not product features. |

---

## What "passed" and "failed" mean

- **Passed** — the robot did the steps and saw exactly what was expected.
- **Failed** — something on the page did not behave as described above. Each
  failure also saves a screenshot and a page description for debugging.
- **Flaky** — failed once, passed when automatically retried; usually a timing
  hiccup rather than a broken feature.

The current status: **151 of 155 pass** (1 is intentionally skipped; 3 were
fixed on the `fix/project-editor-regressions` branch and verified — update
this line when you re-run).
