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

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
const { marked } = require("marked");
import TerminalRenderer = require("marked-terminal");

import { FirebaseError } from "../error";
import { ExtensionSpec } from "./types";
import { logPrefix } from "./extensionsHelper";
import { promptOnce } from "../prompt";
import * as utils from "../utils";

marked.setOptions({
  renderer: new TerminalRenderer(),
});

const urlPricingExamples = "https://cloud.google.com/functions/pricing#pricing_examples";
const urlFAQ = "https://firebase.google.com/support/faq/#extensions-pricing";

const billingMsgUpdate =
  "This update includes an upgrade to Node.js 10 from Node.js 8, which is no" +
  " longer maintained. Starting with this update, you will be charged a" +
  " small amount (typically around $0.01/month) for the Firebase resources" +
  " required by this extension (even if it is not used), in addition to any" +
  " charges associated with its usage.\n\n" +
  `See pricing examples: **[${urlPricingExamples}](${urlPricingExamples})**\n` +
  `See the FAQ: **[${urlFAQ}](${urlFAQ})**\n`;
const billingMsgCreate =
  "You will be charged around $0.01/month for the Firebase resources" +
  " required by this extension (even if it is not used). Additionally," +
  " using this extension will contribute to your project's overall usage" +
  " level of Firebase services. However, you'll only be charged for usage" +
  " that exceeds Firebase's free tier for those services.\n\n" +
  `See pricing examples: **[${urlPricingExamples}](${urlPricingExamples})**\n` +
  `See the FAQ: **[${urlFAQ}](${urlFAQ})**\n`;

const defaultSpecVersion = "v1beta";
const defaultRuntimes: { [key: string]: string } = {
  v1beta: "nodejs8",
};

function hasRuntime(spec: ExtensionSpec, runtime: string): boolean {
  const specVersion = spec.specVersion || defaultSpecVersion;
  const defaultRuntime = defaultRuntimes[specVersion];
  const resources = spec.resources || [];
  return resources.some((r) => runtime === (r.properties?.runtime || defaultRuntime));
}

/**
 * Displays billing changes if the update contains new billing requirements.
 *
 * @param curSpec A current extensionSpec
 * @param newSpec A extensionSpec to compare to
 */
export function displayNode10UpdateBillingNotice(
  curSpec: ExtensionSpec,
  newSpec: ExtensionSpec
): void {
  if (hasRuntime(curSpec, "nodejs8") && hasRuntime(newSpec, "nodejs10")) {
    utils.logLabeledWarning(logPrefix, marked(billingMsgUpdate));
  }
}

/**
 * Displays billing changes if the extension contains new billing requirements.
 *
 * @param spec A currenta extensionSpec
 * @param prompt If true, prompts user for confirmation
 */
export async function displayNode10CreateBillingNotice(
  spec: ExtensionSpec,
  prompt: boolean
): Promise<void> {
  if (hasRuntime(spec, "nodejs10")) {
    utils.logLabeledWarning(logPrefix, marked(billingMsgCreate));
    if (prompt) {
      const continueUpdate = await promptOnce({
        type: "confirm",
        message: "Do you wish to continue?",
        default: true,
      });
      if (!continueUpdate) {
        throw new FirebaseError(`Cancelled.`, { exit: 2 });
      }
    }
  }
}
