// Copies the Heebo and Rubik font files the app uses from the @fontsource-variable
// npm packages into public/fonts/ (served as /fonts/ by Vite, copied into dist/ as is).
// Run after changing the package versions: npm run fonts, then commit public/fonts/.
// Only the Hebrew and Latin subsets are copied; src/fonts.css declares them.
import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "public", "fonts");
mkdirSync(out, { recursive: true });

for (const family of ["heebo", "rubik"]) {
  const pkg = join(root, "node_modules", "@fontsource-variable", family);
  const { version } = JSON.parse(readFileSync(join(pkg, "package.json"), "utf8"));
  for (const subset of ["hebrew", "latin"]) {
    const file = `${family}-${subset}-wght-normal.woff2`;
    copyFileSync(join(pkg, "files", file), join(out, file));
    console.log(`public/fonts/${file}  (@fontsource-variable/${family} ${version})`);
  }
  copyFileSync(join(pkg, "LICENSE"), join(out, `${family}-LICENSE.txt`));
}
