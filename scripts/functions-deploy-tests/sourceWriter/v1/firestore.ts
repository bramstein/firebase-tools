import functions from "firebase-functions";
import { maybeRunWith } from "../common";
import { V1Fragment } from "./common";

interface FirestoreFragment extends V1Fragment {
  documentPath: string;
}

/**
 * Generates fragment for Firestore onWrite function.
 */
export function onWrite(documentPath: string, opts?: functions.RuntimeOptions): FirestoreFragment {
  return {
    documentPath,
    opts,
    asString() {
      return `functions${maybeRunWith(this.opts)}.firestore.document("${
        this.documentPath
      }").onWrite(() => {});`;
    },
  };
}
