import assert from "node:assert/strict";
import {
  DocumentInputError,
  extractDocumentText,
  getDocumentType,
  MAX_DOCUMENT_CHARACTERS,
  splitDocumentText,
} from "../src/lib/documents/extract";

const plainText = "First paragraph with English words.\n\nSecond paragraph.";
const chunks = splitDocumentText(plainText, 18);
assert.ok(chunks.every((chunk) => chunk.length <= 18), "chunks do not exceed the configured limit");
assert.equal(
  chunks.join(" ").replace(/\s+/g, " ").trim(),
  plainText.replace(/\s+/g, " ").trim(),
  "chunking preserves source words and order",
);
assert.equal(getDocumentType("book.DOCX"), "docx");
assert.equal(getDocumentType("archive.pdf.exe"), null);
void (async () => {
  assert.deepEqual(
    await extractDocumentText("notes.txt", Buffer.from("Georgian text\n\nSecond line.", "utf8")),
    { type: "txt", text: "Georgian text\n\nSecond line." },
  );
  await assert.rejects(
    () => extractDocumentText("invalid.txt", Buffer.from([0xff])),
    DocumentInputError,
  );
  await assert.rejects(
    () => extractDocumentText("large.txt", Buffer.alloc(MAX_DOCUMENT_CHARACTERS + 1, 97)),
    DocumentInputError,
  );
  console.log("Document library validation passed");
})();
