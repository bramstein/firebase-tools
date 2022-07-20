import functions from "firebase-functions";
import { maybeRunWith } from "../common";
import { V1Fragment } from "./common";

interface TQFragment extends V1Fragment {
  tqOpts?: functions.tasks.TaskQueueOptions;
}

/**
 * Generates fragment for task queue function.
 */
export function onDispatch(
  opts?: functions.RuntimeOptions,
  tqOpts?: functions.tasks.TaskQueueOptions
): TQFragment {
  return {
    opts,
    tqOpts,
    asString() {
      return `functions${maybeRunWith(this.opts)}.tasks.taskQueue(${
        this.tqOpts ? JSON.stringify(this.tqOpts) : ""
      }).onDispatch(() => {});`;
    },
  };
}
