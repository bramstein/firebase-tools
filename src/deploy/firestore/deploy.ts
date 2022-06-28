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

import * as _ from "lodash";
import * as clc from "cli-color";

import { FirebaseError } from "../../error";
import { FirestoreIndexes } from "../../firestore/indexes";
import { logger } from "../../logger";
import utils = require("../../utils");
import { RulesDeploy, RulesetServiceType } from "../../rulesDeploy";

/**
 * Deploys Firestore Rules.
 * @param context The deploy context.
 */
async function deployRules(context: any): Promise<void> {
  const rulesDeploy: RulesDeploy = _.get(context, "firestore.rulesDeploy");
  if (!context.firestoreRules || !rulesDeploy) {
    return;
  }
  await rulesDeploy.createRulesets(RulesetServiceType.CLOUD_FIRESTORE);
}

/**
 * Deploys Firestore Indexes.
 * @param context The deploy context.
 * @param options The CLI options object.
 */
async function deployIndexes(context: any, options: any): Promise<void> {
  if (!context.firestoreIndexes) {
    return;
  }

  const indexesFileName = _.get(context, "firestore.indexes.name");
  const indexesSrc = _.get(context, "firestore.indexes.content");
  if (!indexesSrc) {
    logger.debug("No Firestore indexes present.");
    return;
  }

  const indexes = indexesSrc.indexes;
  if (!indexes) {
    throw new FirebaseError(`Index file must contain an "indexes" property.`);
  }

  const fieldOverrides = indexesSrc.fieldOverrides || [];

  await new FirestoreIndexes().deploy(options, indexes, fieldOverrides);
  utils.logSuccess(
    `${clc.bold.green("firestore:")} deployed indexes in ${clc.bold(indexesFileName)} successfully`
  );
}

/**
 * Deploy indexes.
 * @param context The deploy context.
 * @param options The CLI options object.
 */
export default async function (context: any, options: any): Promise<void> {
  await Promise.all([deployRules(context), deployIndexes(context, options)]);
}
