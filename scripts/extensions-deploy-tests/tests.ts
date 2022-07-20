import { expect } from "chai";

import { CLIProcess } from "../integration-helpers/cli";

const FIREBASE_PROJECT = process.env.FBTOOLS_TARGET_PROJECT || "";

const TEST_SETUP_TIMEOUT_MS = 10000;
const TEST_TIMEOUT_MS = 600000;

describe("firebase deploy --only extensions", function (this) {
  this.timeout(TEST_TIMEOUT_MS);

  let cli: CLIProcess;

  before(function (this) {
    this.timeout(TEST_SETUP_TIMEOUT_MS);
    expect(FIREBASE_PROJECT).should.not.be.empty(
      "string",
      "Set process.env.FBTOOLS_TARGET_PROJECT to your test project"
    );
    cli = new CLIProcess("deploy", __dirname);
  });

  after(() => {
    cli.stop();
  });

  it("should have deployed the expected extensions", async () => {
    await cli.start(
      "deploy",
      FIREBASE_PROJECT,
      ["--only", "extensions", "--non-interactive", "--force"],
      (data: any) => {
        if (/Deploy complete/.exec(`${data}`)) {
          return true;
        }
      }
    );
    let output: any;
    await cli.start("ext:list", FIREBASE_PROJECT, ["--json"], (data: any) => {
      output = JSON.parse(data);
      return true;
    });

    expect(output.result.length).to.eq(2);
    expect(
      output.result.some(
        (i: any) =>
          i.instanceId === "test-instance1" &&
          i.extension === "firebase/firestore-bigquery-export" &&
          i.state === "ACTIVE"
      )
    ).to.be.true;
    expect(
      output.result.some(
        (i: any) =>
          i.instanceId === "test-instance2" &&
          i.extension === "firebase/storage-resize-images" &&
          i.state === "ACTIVE"
      )
    ).to.be.true;
  });
});
