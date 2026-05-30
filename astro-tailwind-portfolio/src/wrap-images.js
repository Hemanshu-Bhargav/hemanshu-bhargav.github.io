#!/usr/bin/env node
/**
 * Wrap bare <img> tags in <figure>/<figcaption>.
 *
 * Usage:
 *   node wrap-images.js ./src
 */

import fs from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";
import { load } from "cheerio";

const root = process.argv[2] ?? ".";
const exts = ["astro", "html", "md"];      // add others if needed
const files = await fg(
  exts.map((e) => path.join(root, `**/*.${e}`)),
  { dot: false }
);

for (const file of files) {
  const html = await fs.readFile(file, "utf8");
  const $ = cheerio.load(html, { xmlMode: false, decodeEntities: false });

  $("img").each((_, img) => {
    const $img = $(img);
    // Skip if already inside a <figure>
    if ($img.parents("figure").length) return;

    const alt = $img.attr("alt") || "";
    const figure = $("<figure>")
      .addClass("md:w-[65%]")
      .append($img.clone())
      .append(
        $("<figcaption>")
          .addClass("text-sm text-gray-600 mt-2")
          .text(alt)
      );

    // Replace the original <img>
    $img.replaceWith(figure);
  });

  // Only write if the file actually changed
  const out = $.html();
  if (out !== html) {
    await fs.writeFile(file, out, "utf8");
    console.log("✔ Wrapped images in", file);
  }
}