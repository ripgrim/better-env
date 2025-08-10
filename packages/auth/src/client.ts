import { createAuthClient } from "better-auth/react";
import { passkeyClient } from "better-auth/client/plugins";
import { organizationClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [
    passkeyClient(),
    organizationClient(),
  ],
});
