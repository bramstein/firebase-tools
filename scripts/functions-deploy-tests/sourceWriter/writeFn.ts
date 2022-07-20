import * as functions from "firebase-functions";

function maybeRunWith(opts?: functions.RuntimeOptions): string {
  if (opts) {
    return `.runWith(${opts}}`;
  }
  return "";
}

function exprt(id: string): string {
  return `export const ${id}`;
}

/**
 * Generates source for v1 callable function.
 */
export function httpsOnCall(id: string, opts?: functions.RuntimeOptions): string {
  return `${exprt(id)}=functions${maybeRunWith(opts)}.https.onCall(() => {});`;
}

/**
 * Generates source for v1 task queue function.
 */
export function tqOnDispatch(
  id: string,
  tqOpts?: functions.tasks.TaskQueueOptions,
  opts?: functions.RuntimeOptions
): string {
  return `${exprt(id)}=functions${maybeRunWith(opts)}.tasks.taskQueue(${
    tqOpts || ""
  }).onDispatch(() => {});`;
}

export function authOnCreate();
