import * as path from "node:path";
import * as fs from "node:fs/promises";

import { expect } from "chai";

import { CLIProcess } from "../integration-helpers/cli";
import {} from "./sourceWriter/writeFn";

const FIREBASE_PROJECT = process.env.FBTOOLS_TARGET_PROJECT || "";

// const sourceCode = `module.exports = (${triggerSource.toString()})();\n`;

describe("firebase deploy", function (this) {
  this.timeout(300_000);

  let cli: CLIProcess;

  before(() => {
    expect(FIREBASE_PROJECT).to.not.be.empty;
    cli = new CLIProcess("default", __dirname);
  });

  after(async () => {
    await cli.stop();
  });

  it("deploys v1 functions successfully", async () => {
    const sourceHeader = `import * as functions from "firebase-functions";`;
    await fs.writeFile(
      path.join(__dirname, "functions", "v1.js"),
      `${sourceHeader}\n${eagerV1Fns.join("\n")}`
    );

    await cli.start("deploy", FIREBASE_PROJECT, [
      "--only",
      "functions",
      "--non-interactive",
      "--force",
    ]);

    //   let output: any;
    //   await cli.start("ext:list", FIREBASE_PROJECT, ["--json"], (data: any) => {
    //     output = JSON.parse(data);
    //     return true;
    //   });
    //
    //   expect(output.result.length).to.eq(2);
    //   expect(
    //     output.result.some(
    //       (i: any) =>
    //         i.instanceId === "test-instance1" &&
    //         i.extension === "firebase/firestore-bigquery-export" &&
    //         i.state === "ACTIVE"
    //     )
    //   ).to.be.true;
    //   expect(
    //     output.result.some(
    //       (i: any) =>
    //         i.instanceId === "test-instance2" &&
    //         i.extension === "firebase/storage-resize-images" &&
    //         i.state === "ACTIVE"
    //     )
    //   ).to.be.true;
  });
});
