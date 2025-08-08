import { auth } from "@better-env/auth/server";
import { toNextJsHandler } from "better-auth/next-js";
import { grim } from "@better-env/dev-logger";

const { log } = grim();

export const { GET, POST } = toNextJsHandler(auth.handler);
log(auth.handler);
log("the jawn has been hitted");
