// compression-polyfill.ts
/**
 * This is a polyfill for the CompressionStream and DecompressionStream.
 * This solves the issue where Drizzle Studio Can't find variable: CompressionStream
 *
 * ![BUG]: ReferenceError: Can't find variable: CompressionStream
 * @see https://github.com/drizzle-team/drizzle-orm/issues/3880
 *
 * Bun doesn't have CompressionStream and DecompressionStream yet
 * @see https://github.com/oven-sh/bun/issues/1723
 */

import zlib from "node:zlib";

class CompressionStream {
  readable;
  writable;
  constructor(format: "deflate" | "deflate-raw" | "gzip") {
    let handle: zlib.DeflateRaw | zlib.Gzip | zlib.Deflate;
    if (format === "deflate") {
      handle = zlib.createDeflate();
    } else if (format === "gzip") {
      handle = zlib.createGzip();
    } else {
      handle = zlib.createDeflateRaw();
    }
    this.readable = new ReadableStream({
      start(controller) {
        handle.on("data", (chunk) => controller.enqueue(chunk));
        handle.once("end", () => controller.close());
      },
    });
    this.writable = new WritableStream({
      write: (chunk) => {
        handle.write(chunk);
      },
      close: () => {
        handle.end();
      },
    });
  }
}

globalThis.CompressionStream ??= CompressionStream;
globalThis.DecompressionStream ??= CompressionStream;
