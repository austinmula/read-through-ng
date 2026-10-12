(function () {
  "use strict";

  /* ---------- tiny safe storage ---------- */
  var KEY = "ng-guide-v1";
  var state = { done: {}, answers: {}, rating: {}, theme: "" };
  try { var raw = localStorage.getItem(KEY); if (raw) state = Object.assign(state, JSON.parse(raw)); } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") n.textContent = attrs[k];
      else if (k === "html") n.innerHTML = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { n.appendChild(c); });
    return n;
  }

  /* ---------- code renderer with line highlighting ---------- */
  function renderCode(pre, text, highlights) {
    pre.textContent = "";
    var hl = {}; (highlights || []).forEach(function (n) { hl[n] = true; });
    text.replace(/\n$/, "").split("\n").forEach(function (line, i) {
      var n = i + 1;
      var s = el("span", { "class": "ln" + (hl[n] ? " hl" : ""), "data-n": String(n) });
      s.textContent = line.length ? line : " ";
      pre.appendChild(s);
    });
  }

  /* ---------- Chapter 2: the trace ---------- */
  var HOPS = [
    { title: "Browser asks for the page", file: "src/index.html", hl: [11],
      code: '<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <title>AngularKanban</title>\n  <base href="/">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <link rel="icon" type="image/x-icon" href="favicon.ico">\n</head>\n<body>\n  <app-root></app-root>\n</body>\n</html>',
      what: "<code>ng serve</code> answers the request for <code>/</code> with this file. The page body is almost empty: just a custom element, <code>&lt;app-root&gt;</code>, which the browser does not know. It is a placeholder that Angular fills in. You will not see any <code>&lt;script&gt;</code> tag here, because the build adds them when it serves the page." },
    { title: "The build adds the script", file: "angular.json (build options)", hl: [3, 4, 6, 7],
      code: '"build": {\n  "builder": "@angular/build:application",\n  "options": {\n    "browser": "src/main.ts",\n    "tsConfig": "tsconfig.app.json",\n    "assets": [{ "glob": "**/*", "input": "public" }],\n    "styles": ["src/styles.scss"]\n  }\n}',
      what: "<code>angular.json</code> says the browser entry point is <code>src/main.ts</code> and that global styles come from <code>src/styles.scss</code>. The builder bundles <code>main.ts</code> and everything it imports, then injects the script and style tags into <code>index.html</code>. The browser downloads and runs that bundle." },
    { title: "main.ts starts Angular", file: "src/main.ts", hl: [5],
      code: "import { bootstrapApplication } from '@angular/platform-browser';\nimport { appConfig } from './app/app.config';\nimport { App } from './app/app';\n\nbootstrapApplication(App, appConfig)\n  .catch((err) => console.error(err));",
      what: "This is the first line of <em>your</em> code that runs. <code>bootstrapApplication</code> takes two things: the <strong>root component</strong> (<code>App</code>) and the <strong>application config</strong> (<code>appConfig</code>). If anything goes wrong while starting, it is logged to the console." },
    { title: "The config sets up the services", file: "src/app/app.config.ts", hl: [3, 4, 5],
      code: "import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';\n\nexport const appConfig: ApplicationConfig = {\n  providers: [\n    provideBrowserGlobalErrorListeners(),\n  ]\n};",
      what: "Angular builds the application's root <strong>injector</strong> from <code>providers</code>. That is the object that will hand out services to anything that asks. Today it holds one thing: the global error listeners. Later it will also hold <code>provideHttpClient()</code> and <code>provideRouter()</code>." },
    { title: "App is matched to &lt;app-root&gt;", file: "src/app/app.ts", hl: [3, 4, 5, 6, 7, 8, 11],
      code: "import { Component, signal } from '@angular/core';\n\n@Component({\n  imports: [],\n  selector: 'app-root',\n  styleUrl: './app.scss',\n  templateUrl: './app.html',\n})\nexport class App {\n  protected readonly title = signal('angular-kanban');\n}",
      what: "Angular creates an instance of <code>App</code> and looks in the page for an element matching its <code>selector</code>, <code>app-root</code>. It finds the placeholder from hop 1 and renders the component <em>inside</em> it, using <code>app.html</code> for the markup and <code>app.scss</code> for scoped styles. The class also owns the <code>title</code> <strong>signal</strong>, holding the string <code>'angular-kanban'</code>." },
    { title: "The template shows the signal", file: "src/app/app.html (line 235)", hl: [1],
      code: "<h1>Hello, {{ title() }}</h1>",
      what: "The template reads the signal by <em>calling</em> it: <code>title()</code>. That is the moment Angular records \"this view depends on <code>title</code>\". The heading says <strong>Hello, angular-kanban</strong>, which is exactly what the starter test in <code>app.spec.ts</code> checks for. The rest of <code>app.html</code> is a 20 KB starter page you will replace in Milestone 1." }
  ];
  var hop = 0;
  function showHop(i) {
    hop = Math.max(0, Math.min(HOPS.length - 1, i));
    var h = HOPS[hop];
    $("#hopFile").textContent = h.file;
    renderCode($("#hopCode"), h.code, h.hl);
    $("#hopWhat").innerHTML = "<strong>Hop " + (hop + 1) + " of " + HOPS.length + ".</strong> " + h.what;
    $$("#hops button").forEach(function (b, k) { if (k === hop) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current"); });
    $("#hopPrev").disabled = hop === 0;
    $("#hopNext").disabled = hop === HOPS.length - 1;
  }
  HOPS.forEach(function (h, i) {
    var b = el("button", { type: "button" }, [el("b", { text: String(i + 1) }), el("span", { html: h.title })]);
    b.addEventListener("click", function () { showHop(i); });
    $("#hops").appendChild(el("li", {}, [b]));
  });
  $("#hopPrev").addEventListener("click", function () { showHop(hop - 1); });
  $("#hopNext").addEventListener("click", function () { showHop(hop + 1); });
  showHop(0);

  /* ---------- Chapter 3: file tour ---------- */
  var FILES = [
    { n: "src/index.html", k: "source", s: "The single HTML page the browser loads; its only job is to hold the empty <code>&lt;app-root&gt;</code> that Angular fills in.", l: "Look for <code>&lt;app-root&gt;</code> and <code>&lt;base href=\"/\"&gt;</code> (the router needs it later)." },
    { n: "src/main.ts", k: "source", s: "The entry point: it starts the app by calling <code>bootstrapApplication(App, appConfig)</code>.", l: "Count the lines of real logic. There is one." },
    { n: "src/app/app.config.ts", k: "source", s: "The app-wide settings, as a list of providers that Angular turns into the root injector.", l: "This is the file you will edit most in Milestones 3 and 6." },
    { n: "src/app/app.ts", k: "source", s: "The root component class: its <code>selector</code> matches <code>&lt;app-root&gt;</code>, and it owns the <code>title</code> signal.", l: "Which file does <code>templateUrl</code> point to? Which one does <code>styleUrl</code> point to?" },
    { n: "src/app/app.html", k: "source", s: "The root component's template: a 20 KB starter page that reads <code>{{ title() }}</code> on line 235.", l: "Spot the built-in <code>@for ... track</code> loop near line 241. You will write your own in step 1.6." },
    { n: "src/app/app.scss", k: "source", s: "Styles that apply only to the root component, currently empty.", l: "Open DevTools later and look for the <code>_ngcontent-*</code> attributes Angular adds to scope them." },
    { n: "src/app/app.spec.ts", k: "source", s: "The starter unit test: it creates <code>App</code> and checks the heading contains \"Hello, angular-kanban\".", l: "The second test expects text that comes from the <code>title</code> signal." },
    { n: "src/styles.scss", k: "source", s: "Global styles for the whole page, currently just a comment (the starter styles live in <code>app.html</code>).", l: "Resets and design tokens will go here." },
    { n: "public/", k: "source", s: "Static files copied to the site root untouched; it holds only <code>favicon.ico</code>.", l: "<code>angular.json</code> has an <code>assets</code> rule pointing at this folder." },
    { n: "angular.json", k: "config", s: "The Angular CLI's workspace config: it defines how to build, serve and test the project (entry file, styles, assets, budgets, builders).", l: "Compare the <code>production</code> and <code>development</code> configurations. Note <code>prefix: \"app\"</code>." },
    { n: "package.json", k: "config", s: "Lists the dependencies, the dev tools and the npm scripts (<code>start</code>, <code>build</code>, <code>watch</code>, <code>test</code>).", l: "Look for <code>zone.js</code>. It is absent. <code>@angular/router</code> and <code>@angular/forms</code> are installed but unused." },
    { n: "package-lock.json", k: "config", s: "The exact resolved version of every dependency, so every install gets the same tree.", l: "Commit it. Never edit it by hand." },
    { n: "tsconfig.json", k: "config", s: "The shared TypeScript settings (target ES2022, extra safety flags) plus Angular compiler options; it points at the app and spec configs.", l: "There is no <code>\"strict\": true</code>. TypeScript 6 makes strict the default, and I verified it by a failing build." },
    { n: "tsconfig.app.json", k: "config", s: "Says which files the app build compiles: <code>src/**/*.ts</code> except the specs.", l: "<code>\"types\": []</code> stops test globals leaking into app code." },
    { n: "tsconfig.spec.json", k: "config", s: "The same idea for tests: it includes the <code>*.spec.ts</code> files and adds the <code>vitest/globals</code> types.", l: "That is why <code>describe</code> and <code>it</code> need no import in specs." },
    { n: ".prettierrc", k: "tooling", s: "Formatting rules: 100-character lines, single quotes, and the Angular parser for HTML templates.", l: "Format on save, so diffs stay about logic rather than whitespace." },
    { n: ".editorconfig", k: "tooling", s: "Tells every editor to use UTF-8, two-space indents and single quotes in TypeScript.", l: "Two files agree on style. That is on purpose." },
    { n: ".gitignore", k: "tooling", s: "Keeps generated and personal files (<code>node_modules</code>, <code>dist</code>, the <code>.angular/cache</code>) out of git.", l: "Check that <code>/dist</code> and <code>/node_modules</code> are listed." },
    { n: ".vscode/", k: "tooling", s: "Editor helpers: recommended extensions, plus launch and task definitions for debugging <code>ng serve</code> and <code>ng test</code>.", l: "Optional. Delete it if you do not use VS Code." },
    { n: "README.md", k: "tooling", s: "The generated project readme with the basic commands; replace it with your own at step 7.8.", l: "Compare its commands with the cheat sheet in chapter 9." }
  ];
  var KINDS = [["all", "All"], ["source", "Source code"], ["config", "Configuration"], ["tooling", "Tooling"]];
  var kind = "all";
  function renderFiles() {
    var g = $("#fileGrid"); g.textContent = "";
    FILES.filter(function (f) { return kind === "all" || f.k === kind; }).forEach(function (f) {
      g.appendChild(el("div", { "class": "file" }, [
        el("span", { "class": "tag", text: f.k }),
        el("h4", { text: f.n }),
        el("p", { html: f.s }),
        el("p", { "class": "look", html: "<strong>Look for:</strong> " + f.l })
      ]));
    });
  }
  KINDS.forEach(function (k) {
    var b = el("button", { "class": "chip", type: "button", "aria-pressed": String(k[0] === kind), text: k[1] });
    b.addEventListener("click", function () {
      kind = k[0];
      $$("#fileChips .chip").forEach(function (c) { c.setAttribute("aria-pressed", String(c === b)); });
      renderFiles();
    });
    $("#fileChips").appendChild(b);
  });
  renderFiles();

  /* ---------- Chapter 4: config sample ---------- */
  renderCode($("#whereCfg"),
    "// src/app/app.config.ts, as it will look after steps 3.4 and 6.1\nexport const appConfig: ApplicationConfig = {\n  providers: [\n    provideBrowserGlobalErrorListeners(),\n    provideHttpClient(),      // step 3.4: lets you inject HttpClient\n    provideRouter(routes),    // step 6.1: switches the router on\n  ],\n};", [5, 6]);

  /* ---------- questions ---------- */
  var QUIZ = [
    { id: "q1", num: "Q1", q: "Trace the page load. The browser requests localhost:4200. Which file does it receive first, what in it refers to Angular, and what runs next until you see \"Hello\" on screen?",
      hint: "Name the files in order and the one function or class that connects each hop. Use index.html, main.ts, app.config.ts and app.ts.",
      a: "<ol class=\"plain\"><li>The dev server returns <code>src/index.html</code>. Its body is just <code>&lt;app-root&gt;&lt;/app-root&gt;</code>, an unknown tag that Angular will fill.</li><li>The build has injected a script for the bundle whose entry is <code>src/main.ts</code> (set by <code>\"browser\"</code> in <code>angular.json</code>), and the browser runs it.</li><li><code>main.ts</code> calls <strong><code>bootstrapApplication(App, appConfig)</code></strong>: the connecting function.</li><li>Angular builds the root injector from <code>appConfig.providers</code> (<code>app.config.ts</code>).</li><li>It instantiates <code>App</code> (<code>app.ts</code>), finds the element matching <code>selector: 'app-root'</code> and renders the component inside it, using <code>app.html</code> and <code>app.scss</code>.</li><li>The template calls the <code>title</code> signal as <code>title()</code> (line 235): the page shows <strong>Hello, angular-kanban</strong>.</li></ol><p>The connecting idea: <strong>the selector in the class matches the tag in the HTML</strong>.</p>" },
    { id: "q2a", num: "Q2a", q: "Where would you register a global service (one instance for the whole app)?",
      hint: "There are two honest answers: one where you register nothing, and one where you register in a specific file.",
      a: "<p><strong>Usually nowhere.</strong> Mark the class <code>@Injectable({ providedIn: 'root' })</code> and Angular creates one shared instance the first time something calls <code>inject()</code> on it. The board store in step 2.1 works this way.</p><p>You register in <strong><code>appConfig.providers</code></strong> (<code>src/app/app.config.ts</code>) when it is not <code>providedIn: 'root'</code>: provider functions like <code>provideHttpClient()</code> or <code>provideRouter()</code>, <code>InjectionToken</code> values, or picking one implementation over another.</p>" },
    { id: "q2b", num: "Q2b", q: "Where would a route go? (There is no router yet, so say where you expect it to be added.)",
      hint: "Think of three places: a data file, a provider, and a template.",
      a: "<p>Three connected places: a new file <strong><code>src/app/app.routes.ts</code></strong> exporting <code>routes: Routes</code>; <code>provideRouter(routes)</code> added to <strong><code>appConfig.providers</code></strong>; and <code>&lt;router-outlet /&gt;</code> in a template (the root component imports <code>RouterOutlet</code>).</p><p>None of these exist yet because you ran <code>ng new</code> with <code>--routing=false</code>. <code>@angular/router</code> is already in <code>package.json</code>. You add the rest in step 6.1.</p>" },
    { id: "q3", num: "Q3", q: "zone.js is not in package.json. How does Angular know when to re-render? (Hint: look at title = signal(...) in app.ts and how the template uses it.)",
      hint: "Write down what <em>notifies</em> Angular. Then name one thing that would <em>not</em> notify it.",
      a: "<p>Angular is <strong>told</strong>, instead of watching for any async event. The template reads <code>title()</code>, so Angular knows that view depends on that signal. When the signal is <code>set</code> or <code>update</code>d, Angular schedules a re-render of just the views that read it.</p><p>Other notifications: a template event listener running, <code>markForCheck()</code> (the <code>async</code> pipe calls it), an input being set, and views being attached or removed.</p><p><strong>What does not notify:</strong> changing a plain class field in a <code>setTimeout</code>, promise or <code>subscribe</code> callback. The screen goes stale, which is why this project keeps its state in signals. <code>provideBrowserGlobalErrorListeners()</code> exists because zone.js used to catch uncaught errors for Angular, and now this provider does.</p>" },
    { id: "q4", num: "Q4", q: "Write one sentence each for angular.json, tsconfig.json, package.json and src/styles.scss.",
      hint: "What is the file's job, and who reads it: you, the CLI, TypeScript or the browser?",
      a: "<ul><li><code>angular.json</code>: the CLI's instructions for how to build, serve and test this project (entry <code>src/main.ts</code>, global styles, assets from <code>public</code>, production vs development settings).</li><li><code>tsconfig.json</code>: the shared TypeScript and Angular-compiler settings that the app and test configs extend; strict type checking is on by default in TypeScript 6.</li><li><code>package.json</code>: names the project's dependencies and dev tools, and defines the npm scripts (<code>start</code>, <code>build</code>, <code>test</code>).</li><li><code>src/styles.scss</code>: the global stylesheet, bundled into every page. It is empty apart from a comment, because component styles live beside their components.</li></ul>" }
  ];
  var M0 = [
    { id: "m01", num: "0.1", q: "Why does pinning tool versions matter on a learning project?",
      hint: "You already hit a real example while setting up.",
      a: "<p>It makes the project reproducible, and it removes a whole class of confusing errors. You met one yourself: the newest Angular CLI (22.2.2) requires Node <code>^24.15.0</code> or newer, and you had <strong>24.13.0</strong>. Without that check, you would have seen an unclear failure partway through. Pinning Angular, Node and npm in your notes means a problem next month can be compared with a known-good setup.</p>" },
    { id: "m02", num: "0.2", q: "What did the CLI ask you, and what does each answer change?",
      hint: "You answered with flags, so look at where each one landed in the files.",
      a: "<ul><li><strong>Stylesheet format</strong> (<code>--style=scss</code>): file extensions (<code>app.scss</code>, <code>styles.scss</code>) and the default for <code>ng generate component</code> (<code>schematics</code> in <code>angular.json</code>).</li><li><strong>Routing</strong> (<code>--routing=false</code>): no <code>app.routes.ts</code> and no <code>provideRouter</code>.</li><li><strong>SSR</strong> (<code>--ssr=false</code>): no server entry point, only the <code>\"browser\"</code> entry in the build options.</li><li><strong>Package manager</strong> (<code>--package-manager=npm</code>): recorded in <code>angular.json</code> and in <code>packageManager</code> in <code>package.json</code>.</li><li><strong>Git</strong> (<code>--skip-git</code>): no <code>.git</code> folder, so <code>git init</code> became your job.</li><li><strong>AI config</strong> (<code>--ai-config=none</code>): no assistant instruction files generated.</li><li><strong>Zoneless</strong> (left at the default): no <code>zone.js</code> in <code>package.json</code>. <strong>Test runner</strong> (default): Vitest, via <code>@angular/build:unit-test</code>.</li></ul>" },
    { id: "m04", num: "0.4", q: "Why commit before changing anything?",
      hint: "Think about what git diff would show you at step 1.1.",
      a: "<p>A clean first commit is the <strong>baseline</strong>. Every later change then shows up as a small, readable diff, and any step can be undone with <code>git restore</code> or <code>git revert</code>. It also makes the plan's review habit possible: one step, one commit, one diff to explain. (Your repo has this: <code>df45eb8</code>, then the documentation commit.)</p>" },
    { id: "m05", num: "0.5", q: "Name two bugs strict mode catches that loose mode would not.",
      hint: "I tested two in your project. Do you remember the error codes?",
      a: "<p>Both are real errors the build produced in your project when I tried them (then reverted):</p><ul><li><strong>Possible null access</strong>: <code>const s: string | null = null; s.length;</code> gave <code>TS18047: 's' is possibly 'null'</code>.</li><li><strong>Type mismatch</strong>: <code>const n: number = \"oops\";</code> gave <code>TS2322: Type 'string' is not assignable to type 'number'</code>.</li></ul><p>A third family is implicit <code>any</code> (a parameter with no type). The first one, a null crash, is among the most common bugs in real apps.</p>" },
    { id: "m06", num: "0.6", q: "Which test runner are you using, and what is its watch mode?",
      hint: "Run ng test --help and read the options before answering. Do not guess.",
      a: "<p><strong>Vitest</strong>, run through the builder <code>@angular/build:unit-test</code> (see <code>angular.json</code>). Karma is not used: it is deprecated and no longer the default for new projects. <code>tsconfig.spec.json</code> adds the <code>vitest/globals</code> types.</p><p>For watch mode, run <code>ng test --help</code> and look for the <code>watch</code> option. I deliberately did not state its default here, because I have not run it. Reading the help output yourself is the correct answer.</p>" }
  ];

  function renderQuestions(list, mountId, scoreId) {
    var mount = $("#" + mountId);
    list.forEach(function (q) {
      var card = el("div", { "class": "qcard", id: "card-" + q.id });
      var ta = el("textarea", { "class": "mine", "aria-label": "Your answer to " + q.num, placeholder: "Write your answer in your own words…" });
      ta.value = state.answers[q.id] || "";
      ta.addEventListener("input", function () { state.answers[q.id] = ta.value; save(); });
      var ans = el("div", { "class": "answer", hidden: "" }, [el("h5", { text: "Model answer" }), el("div", { html: q.a })]);
      var reveal = el("button", { "class": "btn primary", type: "button", text: "Reveal answer" });
      var rate = el("div", { "class": "rate" });
      var got = el("button", { "class": "btn", type: "button", text: "✓ Got it" });
      var again = el("button", { "class": "btn", type: "button", text: "↻ Review again" });
      rate.appendChild(el("span", { text: "How did you do?" })); rate.appendChild(got); rate.appendChild(again);
      function paint() {
        card.classList.toggle("got", state.rating[q.id] === "got");
        card.classList.toggle("again", state.rating[q.id] === "again");
        score(list, scoreId);
      }
      reveal.addEventListener("click", function () {
        var open = ans.hasAttribute("hidden");
        if (open) { ans.removeAttribute("hidden"); rate.classList.add("on"); reveal.textContent = "Hide answer"; }
        else { ans.setAttribute("hidden", ""); rate.classList.remove("on"); reveal.textContent = "Reveal answer"; }
      });
      got.addEventListener("click", function () { state.rating[q.id] = "got"; save(); paint(); });
      again.addEventListener("click", function () { state.rating[q.id] = "again"; save(); paint(); });
      card.appendChild(el("div", { "class": "qhead" }, [el("span", { "class": "qnum", text: q.num }), el("p", { "class": "qtext", text: q.q })]));
      card.appendChild(el("p", { "class": "qhint", html: "<strong>Hint:</strong> " + q.hint }));
      card.appendChild(ta);
      card.appendChild(el("div", { "class": "qactions" }, [reveal, rate]));
      card.appendChild(ans);
      mount.appendChild(card);
      paint();
    });
  }
  function score(list, scoreId) {
    var got = 0, again = 0;
    list.forEach(function (q) { if (state.rating[q.id] === "got") got++; else if (state.rating[q.id] === "again") again++; });
    var t = got + again === 0 ? "Not started." : got + " got it · " + again + " to review again · " + (list.length - got - again) + " unrated";
    $("#" + scoreId).textContent = t;
  }
  renderQuestions(QUIZ, "quizList", "quizScore");
  renderQuestions(M0, "m0List", "m0Score");

  /* ---------- glossary ---------- */
  var GLOSS = [
    ["bootstrap", "Starting the application: creating the root component and the root injector. Done by <code>bootstrapApplication</code>."],
    ["component", "A class plus a template and styles that renders a piece of UI. Marked with <code>@Component</code>."],
    ["selector", "The CSS-style name that tells Angular where to put a component. <code>'app-root'</code> matches <code>&lt;app-root&gt;</code>."],
    ["standalone component", "A component that declares its own imports. Modern Angular has no required <code>NgModule</code>."],
    ["provider", "A recipe that tells the injector how to create a dependency."],
    ["injector", "The object that creates dependencies and hands them out. The <em>root injector</em> is built from <code>appConfig</code>."],
    ["dependency injection (DI)", "Asking for what you need (<code>inject(Thing)</code>) instead of building it yourself."],
    ["providedIn: 'root'", "A service option that creates one shared instance for the whole app, with nothing to register."],
    ["signal", "A value you read by calling it, <code>title()</code>, that notifies the views using it when it changes. <code>signal(x)</code>, <code>.set()</code>, <code>.update()</code>."],
    ["computed", "A signal derived from other signals; it recalculates only when those change."],
    ["zone.js", "The older library that patched async APIs so Angular could notice any async event. Not installed in this project."],
    ["zoneless", "Change detection driven by explicit notifications (signals, events, markForCheck) instead of zone.js."],
    ["change detection", "The process of checking which views are out of date and updating the DOM."],
    ["template", "The HTML of a component, with bindings such as <code>{{ title() }}</code> and control flow such as <code>@for</code>."],
    ["view encapsulation", "Component styles are scoped by adding unique attributes (<code>_ngcontent-*</code>) to elements and selectors."],
    ["builder", "A CLI plugin that performs a task. <code>@angular/build:application</code> builds, <code>:dev-server</code> serves, <code>:unit-test</code> tests."],
    ["budget", "A size limit in <code>angular.json</code>; the production build warns or fails when a bundle exceeds it."],
    ["strict mode", "TypeScript's strictest type-checking family (null checks, no implicit any). On by default in TypeScript 6."],
    ["Vitest", "The test runner this project uses, run by <code>ng test</code>."],
    ["nvm", "Node Version Manager. Lets you install several Node versions and switch with <code>nvm use</code>."]
  ];
  function renderGloss(filter) {
    var f = (filter || "").toLowerCase(), box = $("#glossList"); box.textContent = "";
    GLOSS.filter(function (g) { return !f || g[0].toLowerCase().indexOf(f) > -1 || g[1].toLowerCase().indexOf(f) > -1; }).forEach(function (g) {
      box.appendChild(el("div", {}, [el("dt", { text: g[0] }), el("dd", { html: g[1] })]));
    });
    if (!box.children.length) box.appendChild(el("p", { text: "No matches." }));
  }
  $("#gsearch").addEventListener("input", function (e) { renderGloss(e.target.value); });
  renderGloss("");

  /* ---------- progress + nav ---------- */
  var CHAPTERS = $$("input[data-done]").map(function (c) { return c.getAttribute("data-done"); });
  function paintProgress() {
    var n = 0;
    CHAPTERS.forEach(function (id) {
      var d = !!state.done[id]; if (d) n++;
      var cb = $('input[data-done="' + id + '"]'); if (cb) cb.checked = d;
      var link = $('#toc a[data-ch="' + id + '"]'); if (link) link.classList.toggle("done", d);
    });
    var pct = Math.round((n / CHAPTERS.length) * 100);
    $("#meterText").textContent = n + " of " + CHAPTERS.length + " chapters";
    $("#meterBar").style.width = pct + "%";
    $(".bar").setAttribute("aria-valuenow", String(pct));
  }
  $$("input[data-done]").forEach(function (cb) {
    cb.addEventListener("change", function () { state.done[cb.getAttribute("data-done")] = cb.checked; save(); paintProgress(); });
  });
  paintProgress();

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var id = e.target.getAttribute("data-ch");
        $$("#toc a").forEach(function (a) { a.classList.toggle("active", a.getAttribute("data-ch") === id); });
      });
    }, { rootMargin: "-20% 0px -70% 0px" });
    $$("section.chapter").forEach(function (s) { io.observe(s); });
  }

  /* ---------- theme ---------- */
  function applyTheme() { if (state.theme) document.documentElement.setAttribute("data-theme", state.theme); }
  applyTheme();
  $("#themeBtn").addEventListener("click", function () {
    var dark = state.theme ? state.theme === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    state.theme = dark ? "light" : "dark"; save(); applyTheme();
  });
})();
