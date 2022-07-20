import * as functions from "firebase-functions";
import { maybeRunWith } from "../common";
import { V1Fragment } from "./common";

interface HttpsFragment extends V1Fragment {
  opts?: functions.RuntimeOptions;
}
/**
 * Generates fragment for https callable function.
 */
export function onCall(opts?: functions.RuntimeOptions): HttpsFragment {
  return {
    opts,
    asString() {
      return `functions${maybeRunWith(this.opts)}.https.onCall(() => {});`;
    },
  };
}

/**
 * Generates fragment for http request function.
 */
export function onRequest(opts?: functions.RuntimeOptions): HttpsFragment {
  return {
    opts,
    asString() {
      return `functions${maybeRunWith(this.opts)}.https.onRequest(() => {});`;
    },
  };
}
