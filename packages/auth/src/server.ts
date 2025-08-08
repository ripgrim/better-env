import { betterAuth } from "better-auth"
import { passkey } from "better-auth/plugins/passkey"
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@better-env/db";
import * as schema from "@better-env/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
    usePlural: false,
  }),
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    passkey({
      rpID: process.env.NODE_ENV === "production" ? "bounty.new" : "localhost",
      rpName: "Bounty.new",
      origin: process.env.NODE_ENV === "production" ? "https://bounty.new" : "http://localhost:3000",
    }),
  ],
  secret: process.env.BETTER_AUTH_SECRET,
});