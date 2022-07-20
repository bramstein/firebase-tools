import functions from "firebase-functions";
import { maybeRunWith } from "../common";
import { V1Fragment } from "./common";

interface DatabaseFragment extends V1Fragment {
  nodePath: string;
}

/**
 * Generates fragment for RTDB onWrite function.
 */
export function onWrite(nodePath: string, opts?: functions.RuntimeOptions): DatabaseFragment {
  return {
    nodePath,
    opts,
    asString() {
      return `functions${maybeRunWith(this.opts)}.database.ref("${
        this.nodePath
      }").onWrite(() => {});`;
    },
  };
}
