// One Emoji, One Dream Vacation — writes one emoji to
// /output/entry.txt (or ./output/entry.txt when run locally).
// Node 22, no dependencies, no network.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

// A desert island at golden hour: the whole dream vacation in one
// picture — white sand, a palm, and nowhere else to be.
const EMOJI = "🏝";
const OUTPUT_FILE = "entry.txt";

function fail(message: string): never {
  throw new Error(message);
}

function validate(emoji: string): void {
  if (emoji.length === 0) {
    fail("Refusing to write a blank entry.");
  }
  // Exactly one grapheme cluster: one emoji, nothing else.
  if ([...emoji].length !== 1) {
    fail(`Entry must be exactly one emoji, got ${[...emoji].length} characters.`);
  }
  if (emoji.trim() !== emoji || /\s/.test(emoji)) {
    fail("Entry must not be whitespace.");
  }
  // It must actually be an emoji, not a letter, digit, or punctuation mark.
  if (!/^\p{Extended_Pictographic}$/u.test(emoji)) {
    fail("Entry must be exactly one emoji.");
  }
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(emoji)) {
    fail("Entry must not contain control characters.");
  }
  const bytes = Buffer.byteLength(emoji, "utf8");
  if (bytes < 1 || bytes > 8) {
    fail(`Entry is ${bytes} UTF-8 bytes, outside the 1-8 byte range.`);
  }
}

function writeEntry(emoji: string, outDir: string): string {
  // Never write a dotfile into the output folder: the artifact must be
  // exactly entry.txt, nothing hidden alongside it.
  if (basename(OUTPUT_FILE).startsWith(".")) {
    fail("Output file name must not be a dotfile.");
  }
  const outPath = join(outDir, OUTPUT_FILE);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(outPath, emoji + "\n", "utf8");
  return outPath;
}

function main(): void {
  const emoji = EMOJI;
  validate(emoji);

  const outDir = process.env.OUTPUT_DIR?.trim() || "/output";
  let outPath: string;
  try {
    outPath = writeEntry(emoji, outDir);
  } catch {
    // Local run fallback: write next to the working directory.
    outPath = writeEntry(emoji, join(process.cwd(), "output"));
  }

  // Verify the round trip: read back what was written and confirm it
  // matches the emoji exactly, so a partial or mangled write is caught.
  // Check the text and the UTF-8 byte length, so an encoding-mangled
  // write (for example a split surrogate pair) is caught too.
  const writtenBytes = readFileSync(outPath);
  const written = writtenBytes.toString("utf8").trimEnd();
  if (written !== emoji) {
    fail(`Verification failed: ${outPath} does not match the emoji.`);
  }
  // The file must hold exactly one emoji even after trimming: a stray
  // extra character smuggled in by the write must fail the run.
  if ([...written].length !== 1) {
    fail(
      `Verification failed: ${outPath} holds ${[...written].length} characters, expected exactly one emoji.`,
    );
  }
  if (writtenBytes.length !== Buffer.byteLength(emoji + "\n", "utf8")) {
    fail(`Verification failed: ${outPath} has an unexpected byte length.`);
  }
  console.log(`Wrote 1-character emoji ${emoji} to ${outPath}`);
}

main();
