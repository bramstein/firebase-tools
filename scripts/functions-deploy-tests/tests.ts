import * as path from "node:path";
import * as fs from "node:fs/promises";

import { expect } from "chai";
import * as functions from "firebase-functions";

import { CLIProcess } from "../integration-helpers/cli";
import { Endpoint } from "../../src/deploy/functions/backend";
import * as srcWriter from "./sourceWriter";

const FIREBASE_PROJECT = process.env.CF3_DEPLOY_TEST_PROJECT || "danielylee-test-6";

function genRandomId(n = 10): string {
  const charset = "abcdefghijklmnopqrstuvwxyz";
  let text = "";
  for (let i = 0; i < n; i++) {
    text += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return text;
}

async function listFns(cli: CLIProcess, stripId = "dvtuqrxfjr"): Promise<Record<string, Endpoint>> {
  let output: any;
  await cli.start("functions:list", FIREBASE_PROJECT, ["--json"], (data: any) => {
    output = JSON.parse(data.toString());
    return true;
  });

  const eps: Record<string, Endpoint> = {};
  for (const ep of output.result as Endpoint[]) {
    const id = ep.id.replace(`${stripId}-`, "");
    eps[id] = ep;
  }
  return eps;
}

describe("firebase deploy", function (this) {
  this.timeout(300_000);

  const FUNCTIONS_DIR = path.join(__dirname, "functions");
  const BASE_FUNCTIONS = {
    tq: srcWriter.v1.tasks.onDispatch(),
    fire: srcWriter.v1.firestore.onWrite("foo/bar"),
    db: srcWriter.v1.database.onWrite("foo/bar"),
    storage: srcWriter.v1.storage.onFinalize(),
  };
  const RUN_ID = genRandomId();
  let cli: CLIProcess;

  async function cleanup() {
    const files = await fs.readdir(FUNCTIONS_DIR);
    for (const f of files) {
      if (f.endsWith(".js")) {
        await fs.unlink(path.join(FUNCTIONS_DIR, f));
      }
    }
  }

  before(async () => {
    await cleanup();
    expect(FIREBASE_PROJECT).to.not.be.empty;
    cli = new CLIProcess("default", __dirname);
  });

  after(async function () {
    await cli.stop();

    // Cleanup generated .js files if test succeeds.
    // Otherwise, keep the files for debugging.
    // eslint-disable-next-line @typescript-eslint/no-invalid-this
    if (this.currentTest?.state === "passed") {
      await cleanup();
    }
  });

  it("deploys functions with runtime options", async () => {
    const opts: functions.RuntimeOptions = {
      timeoutSeconds: 10,
      maxInstances: 5,
      memory: "128MB",
    };

    const fns = { ...BASE_FUNCTIONS };
    for (const fn of Object.values(fns)) {
      fn.opts = opts;
    }
    await srcWriter.write(FUNCTIONS_DIR, {
      [RUN_ID]: fns,
    });

    await cli.start("deploy", FIREBASE_PROJECT, [
      "--only",
      "functions",
      "--non-interactive",
      "--force",
    ]);

    const endpoints = await listFns(cli, RUN_ID);
    for (const fn of Object.keys(fns)) {
      expect(endpoints[fn]).to.exist;
      expect(endpoints[fn].timeoutSeconds).to.equal(10);
      expect(endpoints[fn].maxInstances).to.equal(5);
      expect(endpoints[fn].availableMemoryMb).to.equal(128);
    }
  });

  it("leaves existing options when unspecified", async () => {
    const fns = { ...BASE_FUNCTIONS };
    await srcWriter.write(FUNCTIONS_DIR, {
      [RUN_ID]: fns,
    });

    await cli.start("deploy", FIREBASE_PROJECT, [
      "--only",
      "functions",
      "--non-interactive",
      "--force",
    ]);

    const endpoints = await listFns(cli, RUN_ID);
    for (const fn of Object.keys(fns)) {
      expect(endpoints[fn]).to.exist;
      expect(endpoints[fn].timeoutSeconds).to.equal(10);
      expect(endpoints[fn].maxInstances).to.equal(5);
      expect(endpoints[fn].availableMemoryMb).to.equal(128);
    }
  });

  it("restores defaults value when cleared out", async () => {
    const opts: functions.RuntimeOptions = {
      timeoutSeconds: undefined,
      maxInstances: undefined,
      memory: undefined,
    };

    const fns = { ...BASE_FUNCTIONS };
    for (const fn of Object.values(fns)) {
      fn.opts = opts;
    }

    await srcWriter.write(FUNCTIONS_DIR, {
      [RUN_ID]: fns,
    });

    await cli.start("deploy", FIREBASE_PROJECT, [
      "--only",
      "functions",
      "--non-interactive",
      "--force",
    ]);

    const endpoints = await listFns(cli, RUN_ID);
    for (const fn of Object.keys(fns)) {
      expect(endpoints[fn]).to.exist;
      expect(endpoints[fn].timeoutSeconds).to.equal(60);
      expect(endpoints[fn].maxInstances).to.equal(0);
      expect(endpoints[fn].availableMemoryMb).to.equal(256);
    }
  });
});
