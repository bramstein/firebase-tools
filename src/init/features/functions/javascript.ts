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
import * as fs from "fs";
import * as path from "path";

import { askInstallDependencies } from "./npm-dependencies";
import { prompt } from "../../../prompt";

const TEMPLATE_ROOT = path.resolve(__dirname, "../../../../templates/init/functions/javascript/");
const INDEX_TEMPLATE = fs.readFileSync(path.join(TEMPLATE_ROOT, "index.js"), "utf8");
const PACKAGE_LINTING_TEMPLATE = fs.readFileSync(
  path.join(TEMPLATE_ROOT, "package.lint.json"),
  "utf8"
);
const PACKAGE_NO_LINTING_TEMPLATE = fs.readFileSync(
  path.join(TEMPLATE_ROOT, "package.nolint.json"),
  "utf8"
);
const ESLINT_TEMPLATE = fs.readFileSync(path.join(TEMPLATE_ROOT, "_eslintrc"), "utf8");
const GITIGNORE_TEMPLATE = fs.readFileSync(path.join(TEMPLATE_ROOT, "_gitignore"), "utf8");

export function setup(setup: any, config: any): Promise<any> {
  return prompt(setup.functions, [
    {
      name: "lint",
      type: "confirm",
      message: "Do you want to use ESLint to catch probable bugs and enforce style?",
      default: false,
    },
  ])
    .then(() => {
      if (setup.functions.lint) {
        _.set(setup, "config.functions.predeploy", ['npm --prefix "$RESOURCE_DIR" run lint']);
        return config
          .askWriteProjectFile("functions/package.json", PACKAGE_LINTING_TEMPLATE)
          .then(() => {
            config.askWriteProjectFile("functions/.eslintrc.js", ESLINT_TEMPLATE);
          });
      }
      return config.askWriteProjectFile("functions/package.json", PACKAGE_NO_LINTING_TEMPLATE);
    })
    .then(() => {
      return config.askWriteProjectFile("functions/index.js", INDEX_TEMPLATE);
    })
    .then(() => {
      return config.askWriteProjectFile("functions/.gitignore", GITIGNORE_TEMPLATE);
    })
    .then(() => {
      return askInstallDependencies(setup.functions, config);
    });
}
