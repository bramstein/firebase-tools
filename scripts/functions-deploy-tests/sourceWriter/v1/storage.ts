import functions from "firebase-functions";
import { maybeRunWith } from "../common";
import { V1Fragment } from "./common";

interface StorageFragment extends V1Fragment {
  bucket?: string;
}

function maybeBucket(bucket?: string): string {
  if (bucket) {
    return `.bucket(${bucket})`;
  }
  return "";
}

/**
 * Generates fragment for storage onFinalize function.
 */
export function onFinalize(opts?: functions.RuntimeOptions, bucket?: string): StorageFragment {
  return {
    bucket,
    opts,
    asString() {
      return `functions${maybeRunWith(this.opts)}.storage${maybeBucket(
        this.bucket
      )}.object().onFinalize(() => {});`;
    },
  };
}
