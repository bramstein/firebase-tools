/**
 * Copyright (c) 2022 Google LLC
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import { logger } from "../logger";
import { Client } from "../apiv2";
import { firebaseExtensionsRegistryOrigin } from "../api";

const EXTENSIONS_REGISTRY_ENDPOINT = "/extensions.json";

/**
 * An Entry on the deprecated registry.json list.
 */
export interface RegistryEntry {
  publisher: string;
}

/**
 * Fetches the published extensions registry.
 * @param onlyFeatured If true, only return the featured extensions.
 */
export async function getExtensionRegistry(
  onlyFeatured = false
): Promise<Record<string, RegistryEntry>> {
  const client = new Client({ urlPrefix: firebaseExtensionsRegistryOrigin });
  const res = await client.get<{
    mods?: Record<string, RegistryEntry>;
    featured?: { discover?: string[] };
  }>(EXTENSIONS_REGISTRY_ENDPOINT);
  const extensions: Record<string, RegistryEntry> = res.body.mods || {};

  if (onlyFeatured) {
    const featuredList = new Set(res.body.featured?.discover || []);
    const filteredExtensions: Record<string, RegistryEntry> = {};
    for (const [name, extension] of Object.entries(extensions)) {
      if (featuredList.has(name)) {
        filteredExtensions[name] = extension;
      }
    }
    return filteredExtensions;
  }
  return extensions;
}

/**
 * Fetches a list all publishers that appear in the v1 registry.
 */
export async function getTrustedPublishers(): Promise<string[]> {
  let registry: { [key: string]: RegistryEntry };
  try {
    registry = await getExtensionRegistry();
  } catch (err: any) {
    logger.debug(
      "Couldn't get extensions registry, assuming no trusted publishers except Firebase."
    );
    return ["firebase"];
  }
  const publisherIds = new Set<string>();

  // eslint-disable-next-line guard-for-in
  for (const entry in registry) {
    publisherIds.add(registry[entry].publisher);
  }
  return Array.from(publisherIds);
}
