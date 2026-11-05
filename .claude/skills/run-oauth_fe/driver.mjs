// REPL driver for oauth_fe, used when chromium-cli is unavailable.
// Reads newline-delimited commands from stdin, drives a headless Chromium
// page via Playwright, and writes screenshots to .claude/skills/run-oauth_fe/shots/.
//
// Commands:
//   nav <path>                      goto http://localhost:3000<path>
//   wait-for <selector>              wait for selector to be visible
//   wait-for-text <text>             wait for text to appear anywhere on page
//   click <selector>                 click selector
//   fill <selector> <value...>       fill input (rest of line is the value)
//   screenshot <name>                save shots/<name>.png
//   console-errors                   print captured page console errors
//   eval <js>                        run arbitrary page.evaluate, print result
//   quit                             close browser and exit
//
// Example:
//   node driver.mjs <<'EOF'
//   nav /
//   wait-for-text Web OAuth2.0
//   screenshot home
//   click text=Sign in
//   wait-for input[name="email"]
//   screenshot login-modal
//   console-errors
//   quit
//   EOF

import { chromium } from "playwright";
import { createInterface } from "node:readline";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SHOTS_DIR = join(__dirname, "shots");
mkdirSync(SHOTS_DIR, { recursive: true });

const BASE_URL = process.env.DRIVER_BASE_URL ?? "http://localhost:3000";

const browser = await chromium.launch();
const page = await browser.newPage();

const consoleErrors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});
page.on("pageerror", (err) => consoleErrors.push(String(err)));

function splitFirst(s, n = 1) {
  const parts = s.trim().split(/\s+/);
  const head = parts.slice(0, n);
  const rest = s.trim().split(/\s+/).slice(n).join(" ");
  return [...head, rest];
}

const rl = createInterface({ input: process.stdin, terminal: false });

for await (const rawLine of rl) {
  const line = rawLine.trim();
  if (!line || line.startsWith("#")) continue;

  const [cmd, ...restParts] = line.split(/\s+/);
  const rest = restParts.join(" ");

  try {
    switch (cmd) {
      case "nav": {
        const url = rest.startsWith("http") ? rest : `${BASE_URL}${rest}`;
        await page.goto(url, { waitUntil: "load" });
        console.log(`OK nav ${url}`);
        break;
      }
      case "wait-for": {
        await page.waitForSelector(rest, { timeout: 15000, state: "visible" });
        console.log(`OK wait-for ${rest}`);
        break;
      }
      case "wait-for-text": {
        await page.getByText(rest, { exact: false }).first().waitFor({ timeout: 15000 });
        console.log(`OK wait-for-text ${rest}`);
        break;
      }
      case "click": {
        await page.click(rest, { timeout: 15000 });
        console.log(`OK click ${rest}`);
        break;
      }
      case "fill": {
        const [selector, value] = splitFirst(rest, 1);
        await page.fill(selector, value, { timeout: 15000 });
        console.log(`OK fill ${selector}`);
        break;
      }
      case "screenshot": {
        const name = rest || "screenshot";
        const path = join(SHOTS_DIR, `${name}.png`);
        await page.screenshot({ path, fullPage: true });
        console.log(`OK screenshot ${path}`);
        break;
      }
      case "console-errors": {
        if (consoleErrors.length === 0) {
          console.log("OK console-errors none");
        } else {
          console.log(`ERRORS console-errors ${JSON.stringify(consoleErrors)}`);
        }
        break;
      }
      case "eval": {
        const result = await page.evaluate(rest);
        console.log(`OK eval ${JSON.stringify(result)}`);
        break;
      }
      case "quit": {
        await browser.close();
        process.exit(0);
      }
      default:
        console.log(`ERR unknown command: ${cmd}`);
    }
  } catch (err) {
    console.log(`ERR ${cmd}: ${err.message.split("\n")[0]}`);
  }
}

await browser.close();
