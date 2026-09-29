import { inflateRawSync } from "node:zlib";

/**
 * Minimal ZIP reader for .docx assertions.
 *
 * A .docx is a ZIP of OOXML parts and Node ships no zip reader, so this walks the
 * central directory rather than adding a dependency just for tests.
 *
 * Note on the local header: when the data-descriptor flag is set its compressed
 * size is written as 0, so sizes are always taken from the central directory and
 * only the name/extra lengths are re-read from the local header.
 */

type Entry = { name: string; method: number; compressedSize: number; offset: number };

function entries(zip: Buffer): Entry[] {
  let eocd = -1;
  for (let i = zip.length - 22; i >= 0; i--) {
    if (zip.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) return [];

  const count = zip.readUInt16LE(eocd + 10);
  let p = zip.readUInt32LE(eocd + 16);
  const out: Entry[] = [];

  for (let n = 0; n < count; n++) {
    if (zip.readUInt32LE(p) !== 0x02014b50) break;
    const nameLen = zip.readUInt16LE(p + 28);
    const extraLen = zip.readUInt16LE(p + 30);
    const commentLen = zip.readUInt16LE(p + 32);
    out.push({
      method: zip.readUInt16LE(p + 10),
      compressedSize: zip.readUInt32LE(p + 20),
      offset: zip.readUInt32LE(p + 42),
      name: zip.subarray(p + 46, p + 46 + nameLen).toString("utf8"),
    });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

/** Every entry name in the archive. */
export function listZipEntries(zip: Buffer): string[] {
  return entries(zip).map((e) => e.name);
}

/** The inflated text of one entry, or null when it is not in the archive. */
export function readZipEntry(zip: Buffer, want: string): string | null {
  const found = entries(zip).find((e) => e.name === want);
  if (!found) return null;
  const lNameLen = zip.readUInt16LE(found.offset + 26);
  const lExtraLen = zip.readUInt16LE(found.offset + 28);
  const start = found.offset + 30 + lNameLen + lExtraLen;
  const data = zip.subarray(start, start + found.compressedSize);
  return (found.method === 0 ? data : inflateRawSync(data)).toString("utf8");
}
