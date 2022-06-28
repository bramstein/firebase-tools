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

import { client } from "./client";
import { logger } from "../../logger";
import { needProjectNumber } from "../../projectUtils";
import * as utils from "../../utils";
import { convertConfig } from "./convertConfig";
import { Payload } from "./args";

/**
 *  Release finalized a Hosting release.
 */
export async function release(context: any, options: any, payload: Payload): Promise<void> {
  if (!context.hosting || !context.hosting.deploys) {
    return;
  }

  const projectNumber = await needProjectNumber(options);

  logger.debug(JSON.stringify(context.hosting.deploys, null, 2));
  await Promise.all(
    context.hosting.deploys.map(async (deploy: any) => {
      utils.logLabeledBullet(`hosting[${deploy.site}]`, "finalizing version...");

      const config = await convertConfig(context, payload, deploy.config, true);
      const data = { status: "FINALIZED", config };
      const queryParams = { updateMask: "status,config" };

      const finalizeResult = await client.patch(`/${deploy.version}`, data, { queryParams });

      logger.debug(`[hosting] finalized version for ${deploy.site}:${finalizeResult.body}`);
      utils.logLabeledSuccess(`hosting[${deploy.site}]`, "version finalized");
      utils.logLabeledBullet(`hosting[${deploy.site}]`, "releasing new version...");

      // TODO: We should deploy to the resource we're given rather than have to check for a channel here.
      const channelSegment =
        context.hostingChannel && context.hostingChannel !== "live"
          ? `/channels/${context.hostingChannel}`
          : "";
      if (channelSegment) {
        logger.debug("[hosting] releasing to channel:", context.hostingChannel);
      }

      const releaseResult = await client.post(
        `/projects/${projectNumber}/sites/${deploy.site}${channelSegment}/releases`,
        { message: options.message || null },
        { queryParams: { versionName: deploy.version } }
      );
      logger.debug("[hosting] release:", releaseResult.body);
      utils.logLabeledSuccess(`hosting[${deploy.site}]`, "release complete");
    })
  );
}
