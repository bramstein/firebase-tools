import * as fs from "node:fs/promises";
import * as path from "node:path";
import { Fragment } from "./common";

/**
 * Write function source to a file.
 */
export async function write(fpath: string, fnSources: Record<string, Record<string, Fragment>>) {
  for (const [prefix, fragments] of Object.entries(fnSources)) {
    const sourceHeader = `import * as functions from "firebase-functions";`;
    const sourceBody = Object.entries(fragments)
      .map(([id, frag]) => `export const ${id}=${frag.asString()}`)
      .join("\n");
    await fs.writeFile(path.join(fpath, `${prefix}.js`), `${sourceHeader}\n${sourceBody}`);
  }

  await fs.writeFile(
    path.join(fpath, "index.js"),
    Object.keys(fnSources)
      .map((prefix) => `export * as ${prefix} from "./${prefix}.js";`)
      .join("\n")
  );
}

export * as v1 from "./v1";
