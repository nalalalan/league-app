import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
const app = await readFile(new URL("../public/app.js", import.meta.url), "utf8");
const css = await readFile(new URL("../public/samira.css", import.meta.url), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const templateMatches = [...html.matchAll(/<template id="samira-coach-message-template" data-artifact-id="48317">([\s\S]*?)<\/template>/g)];
assert(templateMatches.length === 1, "The coach message must have exactly one canonical hidden template.");
const coachMessage = templateMatches[0][1];
const coachMessageHash = createHash("sha256").update(coachMessage, "utf8").digest("hex").toUpperCase();
assert(coachMessageHash === "F6BD310B2F5EAF332D272D10208E9BD6D9EA02B7708A1E1E251606ABA83B5724", `Coach artifact 48317 changed: ${coachMessageHash}`);
assert(!/[\r\n]/.test(coachMessage), "Coach artifact 48317 must remain one block paragraph.");
assert(coachMessage.startsWith("Please review the attached full Samira VOD from start to finish"), "Coach artifact 48317 lost its opening request.");
assert(coachMessage.endsWith("do not use generic motivational advice."), "Coach artifact 48317 lost its source-integrity ending.");
for (const required of [
  "Game date/time: [date and time] ET.",
  "Game type/result: [queue] [Victory/Defeat].",
  "Game duration: [mm:ss].",
  "Final visible scoreboard: Alan's Samira finished",
  "CS@10:",
  "Gameplay-estimated rank for Alan's Samira performance:",
  "priorities 1–3 ordered by expected impact",
  "5, 10, and 20 games",
  "Diamond, Master, Grandmaster, and Challenger-quality"
]) {
  assert(coachMessage.includes(required), `Coach artifact 48317 lost required content: ${required}`);
}

const coachSection = html.match(/<section class="samira-coach-workspace[\s\S]*?<\/section>/)?.[0] || "";
assert(/<h2 id="samira-title">coach game analyses<\/h2>/.test(coachSection), "Coach section title is missing.");
assert(/<button class="samira-copy-coach" id="samira-copy-coach" type="button">copy coach message<\/button>/.test(coachSection), "The visible one-click coach action is missing or can submit the form.");
assert(/<label for="samira-note-body">paste your coach's completed analysis<\/label>/.test(coachSection), "The completed-analysis label is missing.");
assert(/<button type="submit">save analysis<\/button>/.test(coachSection), "The save-analysis action is missing.");
assert(!coachSection.includes("Paste the completed review after"), "The coach header still contains permanent explanatory instructions.");
const copyButtonIndex = coachSection.indexOf("id=\"samira-copy-coach\"");
const coachFormStart = coachSection.indexOf("<form");
const coachFormEnd = coachSection.indexOf("</form>");
assert(copyButtonIndex > -1 && (copyButtonIndex < coachFormStart || copyButtonIndex > coachFormEnd), "Copy coach message must remain outside the save form.");

assert(html.indexOf("/styles.css") < html.indexOf("/samira.css"), "Scoped Samira CSS must load after legacy CSS.");
assert(/id="samira-tip-file-input"[^>]+accept="image\/png,image\/jpeg,image\/webp"[^>]+multiple/.test(html), "The screenshot picker is not constrained to the supported image types.");
assert(/id="samira-tip-dropzone"[^>]+tabindex="0"/.test(html), "The paste/drop intake is not keyboard focusable.");
assert(html.includes("Uploads, screenshots, and extracted text are public."), "The public-upload boundary is not visible beside intake.");
assert(/id="samira-tip-dialog"/.test(html) && /id="samira-entry-dialog"/.test(html) && /id="samira-copy-dialog"/.test(html), "Required accessible detail/fallback dialogs are missing.");
assert(/id="samira-bootstrap-state" type="application\/json">\{\}<\/script>/.test(html), "The homepage has no synchronous Samira bootstrap state slot.");
const appScriptIndex = html.indexOf('<script src="/app.js?v=');
assert(appScriptIndex > -1 && html.indexOf('id="samira-bootstrap-state"') < appScriptIndex && !/<script[^>]+src="\/app\.js[^>]+defer/.test(html), "The Samira app can execute after first paint instead of synchronously consuming bootstrap state.");
assert(/<html lang="en" class="samira-prepaint">/.test(html) && /document\.documentElement\.classList\.remove\("samira-prepaint"\)/.test(html), "Cold-cache rendering can expose the empty pre-bootstrap layout.");

assert(/navigator\.clipboard\?\.writeText/.test(app), "The coach action does not use the clipboard only after the click.");
assert(/samiraCopyFallback\.value\s*=\s*message/.test(app) && /samiraCopyFallback\.select\(\)/.test(app), "Clipboard failure does not reveal and select the exact fallback message.");
assert(/samiraNoteBody\.setSelectionRange\(originalSelectionStart, originalSelectionEnd\)/.test(app) && /samiraNoteBody\.scrollTop\s*=\s*originalScrollTop/.test(app), "Copying does not explicitly preserve textarea selection and scroll state.");
assert(/samiraCopyCoach\.textContent\s*=\s*"copied"/.test(app) && /Coach message copied\. Attach it with your video\./.test(app), "The copy action lacks its visible and announced success state.");
assert(html.includes("Press Ctrl+C, then attach this message with your video</p>"), "The clipboard fallback instruction changed from the required copy.");
assert(/const\s+body\s*=\s*samiraNoteBody\.value;[\s\S]*?if\s*\(!body\.trim\(\)\)/.test(app), "Coach saves do not validate separately from the untouched source body.");
assert(/slice\(0, 5\)/.test(app), "The client does not cap each screenshot action at five files.");
assert(app.indexOf("const queuedFiles = files.map") < app.indexOf("for (const { file, row } of queuedFiles)"), "All local screenshot previews are not appended before network uploads begin.");
assert(/fetch\("\/api\/samira\/tip-images"[\s\S]*?body:\s*file/.test(app), "Screenshot uploads are not sent as one raw image per request.");
assert(/isEditableSamiraPasteTarget\(event\.target\)/.test(app), "Global screenshot paste can still steal text from an editable control.");
assert(/fetch\("\/api\/samira\/tips"/.test(app), "The tip summary does not use the public normalized tip source.");
assert(/fetch\(`\/api\/samira\/notes\/\$\{encodeURIComponent\(noteId\)\}`/.test(app), "Open full entry does not use the structured coach-entry route.");
assert(/textContent\s*=\s*directVisibleCopy/.test(app), "Generated public text is not assigned through safe textContent paths.");
assert(/Math\.round\(Number\(options\.width\)\s*\|\|\s*640\)/.test(app), "Compact charts still use only a fixed 640px coordinate system.");
assert(/getBoundingClientRect\(\)\.width/.test(app), "Samira chart rendering does not measure its actual container.");
assert(/PerformanceObserver[\s\S]*?layout-shift[\s\S]*?__samiraHydrationCls/.test(app), "Rendered acceptance cannot read the hydration CLS gate.");
assert(/initialSamiraPayload\?\.samira\?\.ok[\s\S]*?renderSamiraState/.test(app) && /sendSamiraIndex/.test(await readFile(new URL("../server.js", import.meta.url), "utf8")), "Samira data is not rendered before the first asynchronous hydration response.");
assert(/function\s+rankTrendAxisRankLabel/.test(app) && /replace\(\/\^Platinum\\b\/i,\s*"Plat"\)/.test(app), "Narrow rank axes can still clip long tier labels.");

assert(/\.samira-workspace\.page-intake\s*\{[\s\S]*?width:\s*min\(1280px,\s*calc\(100% - 48px\)\)/.test(css), "The Samira workspace is not capped at 1280px with dense desktop gutters.");
assert(/html,\s*body\s*\{[\s\S]*?min-width:\s*0/.test(css), "The Samira page still inherits the legacy 320px minimum that overflows a 320px viewport scrollbar.");
assert(/\.samira-tip-primary\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 5fr\) minmax\(0, 7fr\)/.test(css), "Desktop tip intake and summary do not use the required 5/7 composition.");
assert(/\.samira-tip-primary:has\(\.samira-tip-summary\[hidden\]\)\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)/.test(css), "The hidden-summary state still reserves an empty 7/12 panel.");
assert(/\.samira-chart-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/.test(css), "Rank and CS charts are not paired on desktop.");
assert(/\.samira-rank-trend:empty,[\s\S]*?\.samira-cs-trend:empty[\s\S]*?display:\s*none\s*!important/.test(css), "Empty chart shells remain visible on first paint.");
assert(/min-height:\s*44px/.test(css), "Primary Samira controls do not have a 44px interaction target.");
assert(/@media \(max-width: 599px\)[\s\S]*?\.samira-copy-coach\s*\{[\s\S]*?width:\s*100%/.test(css), "The coach-copy action does not become full-width below 600px.");
assert(/@media \(max-width: 599px\)[\s\S]*?\.samira-main-takeaway,[\s\S]*?\.samira-chart-grid \.samira-cs-trend\s*\{[\s\S]*?width:\s*100%;[\s\S]*?max-width:\s*100%/.test(css), "Legacy viewport widths can still push coach insights outside the mobile gutter.");
assert(/@media \(max-width: 359px\)[\s\S]*?\.samira-copy-coach,[\s\S]*?\.samira-note-actions button\s*\{[\s\S]*?width:\s*100%/.test(css), "Coach actions are not protected at the 320px acceptance width.");
assert(/\.samira-tip-media img\s*\{[\s\S]*?object-fit:\s*contain/.test(css), "Tip screenshots can still be cropped in cards.");
assert(/\.samira-tip-image-list\[data-count="1"\] \.samira-tip-card\s*\{[\s\S]*?height:\s*220px/.test(css) && /\.samira-tip-image-list\[data-count="1"\] \.samira-tip-card-body > \.samira-card-actions\s*\{[\s\S]*?grid-column:\s*2/.test(css), "The literal full-row one-record card does not keep its internal state/actions dense.");
assert(/html\.samira-prepaint \.samira-workspace\s*\{[\s\S]*?visibility:\s*hidden/.test(css), "The cold-cache bootstrap cannot hold the work surface until its final first paint.");
assert(/@media \(max-width: 759px\)[\s\S]*?\.samira-tip-card-summary\s*\{[\s\S]*?display:\s*none[\s\S]*?\.samira-tip-card-tips li:nth-child\(n \+ 3\)\s*\{[\s\S]*?display:\s*none/.test(css), "A ready mobile screenshot card can still push the coach workflow below the 390x844 acceptance viewport.");
assert(/@media \(max-width: 599px\)[\s\S]*?\.samira-tip-image-list\[data-count="1"\] \.samira-tip-media\s*\{[\s\S]*?height:\s*128px[\s\S]*?aspect-ratio:\s*auto/.test(css), "The single ready mobile thumbnail is not height-bounded while remaining uncropped.");
assert(/@media \(prefers-reduced-motion: reduce\)/.test(css), "The Samira interface does not honor reduced motion.");

console.log(`Samira UI contract passed. Coach artifact 48317 SHA-256 ${coachMessageHash}.`);
