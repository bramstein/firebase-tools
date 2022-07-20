import { RuntimeOptions } from "firebase-functions";
import { Fragment } from "../common";

export interface V1Fragment extends Fragment {
  opts?: RuntimeOptions;
}
