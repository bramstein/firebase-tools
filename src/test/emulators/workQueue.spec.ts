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

import { expect } from "chai";

import { WorkQueue } from "../../emulator/workQueue";
import { FunctionsExecutionMode } from "../../emulator/types";

function resolveIn(ms: number) {
  if (ms === 0) {
    return Promise.resolve();
  }

  return new Promise((res) => {
    setTimeout(res, ms);
  });
}

describe("WorkQueue", () => {
  describe("mode=AUTO", () => {
    const MAX_PARALLEL = 10;
    let queue: WorkQueue;

    beforeEach(() => {
      queue = new WorkQueue(FunctionsExecutionMode.AUTO, MAX_PARALLEL);
      queue.start();
    });

    afterEach(() => {
      if (queue) {
        queue.stop();
      }
    });

    it("never runs a job immediately", async () => {
      let hasRun = false;
      const work = () => {
        hasRun = true;
        return Promise.resolve();
      };

      queue.submit(work);
      expect(!hasRun, "hasRun=false");
      await resolveIn(10);
      expect(hasRun, "hasRun=true");
    });

    it("runs two jobs", async () => {
      let hasRun1 = false;
      const work1 = () => {
        hasRun1 = true;
        return Promise.resolve();
      };

      let hasRun2 = false;
      const work2 = () => {
        hasRun2 = true;
        return Promise.resolve();
      };

      queue.submit(work1);
      queue.submit(work2);

      expect(!hasRun1, "hasRun1=false");
      expect(!hasRun2, "hasRun2=false");
      await resolveIn(10);

      expect(hasRun1 && hasRun2, "hasRun1 && hasRun2");
    });

    it("never runs more than the maximum allowed parallel work", async () => {
      let numRun = 0;
      const timePerJob = 5;

      const numJobs = MAX_PARALLEL * 2;
      for (let i = 0; i < numJobs; i++) {
        const work = () => {
          numRun++;
          return resolveIn(timePerJob);
        };
        queue.submit(work);
      }

      await resolveIn(timePerJob - 1);
      expect(queue.getState().workRunningCount).to.eq(MAX_PARALLEL);

      await resolveIn(numJobs * timePerJob + 10);
      expect(numRun).to.eq(numJobs);
    });
  });

  describe("mode=SEQUENTIAL", () => {
    let queue: WorkQueue;
    beforeEach(() => {
      queue = new WorkQueue(FunctionsExecutionMode.SEQUENTIAL);
      queue.start();
    });

    afterEach(() => {
      if (queue) {
        queue.stop();
      }
    });

    it("finishes one job before running another", async () => {
      const timeout = 50;

      let hasRun1 = false;
      const work1 = async () => {
        await resolveIn(timeout);
        hasRun1 = true;
      };

      let hasRun2 = false;
      const work2 = async () => {
        await resolveIn(timeout);
        hasRun2 = true;
      };

      queue.submit(work1);
      queue.submit(work2);

      await resolveIn(timeout + 10);

      expect(hasRun1, "job 1 finished");
      expect(!hasRun2, "job 2 not finished");

      await resolveIn(timeout + 10);
      expect(hasRun2, "both jobs finished");
    });

    it("proceeds even if a job errors out", () => {
      let hasRun1 = false;
      const work1 = () => {
        hasRun1 = true;
        return Promise.reject();
      };

      let hasRun2 = false;
      const work2 = () => {
        hasRun2 = true;
        return Promise.resolve();
      };

      queue.submit(work1);
      queue.submit(work2);

      expect(hasRun1, "hasRun1");
      expect(hasRun2, "hasRun2");
    });
  });
});
