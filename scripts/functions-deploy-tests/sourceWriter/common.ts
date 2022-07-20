import * as functions from "firebase-functions";

/**
 * Optionally generate fragment for .runWith
 */
export function maybeRunWith(opts?: functions.RuntimeOptions): string {
  if (opts) {
    return `.runWith(${
      // Since 'JSON.stringify' hides 'undefined', the code bellow is necessary in
      // order to display the real param that have invoked the error.
      JSON.stringify(opts, (k, v) => (v === undefined ? "__undefined" : v)).replace(
        /"__undefined"/g,
        "undefined"
      )
    })`;
  }
  return "";
}

export interface Fragment extends Record<string, any> {
  asString: () => string;
}
