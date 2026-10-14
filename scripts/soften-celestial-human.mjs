import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const directory = path.resolve("public/celestial");
const headAndTorso = [
  // Keep clear of planets and their light effects while covering the person's head.
  "M 510 275 L 510 242 L 530 222 L 562 214 L 600 218 L 642 224 L 674 235 L 694 258 L 706 296 L 704 359 L 718 401 L 721 437 L 704 473 L 685 507 L 658 535 L 628 550 L 594 548 L 558 532 L 530 510 L 511 480 L 510 450 L 510 421 L 510 385 L 510 342 Z",
  // Shoulder, chest, and body, below the lowest planet/light-effect area.
  "M 488 578 L 506 554 L 531 544 L 559 552 L 585 565 L 621 565 L 650 548 L 674 526 L 696 537 L 722 563 L 745 601 L 760 653 L 768 1024 L 426 1024 L 425 966 L 408 936 L 397 905 L 402 875 L 391 842 L 393 810 L 407 777 L 421 737 L 434 690 L 452 642 L 468 606 Z",
  // Open hand and forearm below the planet area; alpha in the original image preserves its silhouette.
  "M 48 575 L 69 580 L 94 599 L 122 612 L 153 622 L 182 632 L 214 638 L 244 655 L 276 675 L 305 697 L 334 712 L 361 729 L 383 752 L 407 778 L 432 802 L 464 822 L 461 866 L 443 903 L 418 932 L 391 938 L 361 923 L 338 899 L 317 865 L 290 829 L 257 796 L 218 769 L 176 744 L 135 722 L 98 696 L 70 663 L 53 628 Z",
];

const files = (await fs.readdir(directory))
  .filter((name) => name.endsWith(".webp") && !name.endsWith("-soft.webp"))
  .filter((name) => !process.argv[2] || name === process.argv[2]);

for (const name of files) {
  const inputPath = path.join(directory, name);
  const outputPath = path.join(directory, name.replace(/\.webp$/i, "-soft.webp"));
  const source = sharp(inputPath).ensureAlpha();
  const { data: original, info } = await source.clone().raw().toBuffer({ resolveWithObject: true });
  const { data: blurred } = await source.clone().blur(3).raw().toBuffer({ resolveWithObject: true });
  const exclusion = name === "saturn.webp"
    ? `<path d="M 464 420 L 484 383 L 511 344 L 538 304 L 562 265 L 585 228 L 603 211 L 621 221 L 595 275 L 568 319 L 541 361 L 515 402 L 490 440 Z"/>`
    : "";
  const svg = `<svg width="${info.width}" height="${info.height}" xmlns="http://www.w3.org/2000/svg"><g fill="white">${headAndTorso.map((d) => `<path d="${d}"/>`).join("")}</g><g fill="black">${exclusion}</g></svg>`;
  const { data: mask } = await sharp(Buffer.from(svg)).resize(info.width, info.height).blur(0.6).greyscale().raw().toBuffer({ resolveWithObject: true });
  const output = Buffer.from(original);

  for (let pixel = 0; pixel < info.width * info.height; pixel += 1) {
    const weight = mask[pixel] / 255;
    if (weight < 0.002) continue;
    const offset = pixel * info.channels;
    for (let channel = 0; channel < 3; channel += 1) {
      const softened = blurred[offset + channel];
      output[offset + channel] = Math.round(original[offset + channel] * (1 - weight) + softened * weight);
    }
    output[offset + 3] = Math.round(original[offset + 3] * (1 - weight * 0.5));
  }

  await sharp(output, { raw: info }).webp({ lossless: true, effort: 6 }).toFile(outputPath);

  // Confirm the original planet/artwork pixels outside the person mask stayed byte-for-byte intact.
  const { data: rendered } = await sharp(outputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let pixel = 0; pixel < info.width * info.height; pixel += 1) {
    const offset = pixel * info.channels;
    if (mask[pixel] >= 1 || original[offset + 3] === 0) continue;
    for (let channel = 0; channel < info.channels; channel += 1) {
      if (rendered[offset + channel] !== original[offset + channel]) {
        throw new Error(`${name}: pixel preservation check failed at ${pixel}, channel ${channel}`);
      }
    }
  }

  const { size } = await fs.stat(outputPath);
  console.log(`${name} -> ${path.basename(outputPath)} (${(size / 1024).toFixed(0)} KB; planet pixels preserved)`);
}
