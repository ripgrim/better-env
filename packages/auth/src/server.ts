import { betterAuth } from "better-auth"
import { passkey } from "better-auth/plugins/passkey"
import { organization } from "better-auth/plugins"
// @ts-ignore
import { Resend } from "resend";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@better-env/db";
import * as schema from "@better-env/db";
import OrganizationInvitationEmail from "./emails/organization-invitation";
import { render } from "@react-email/render";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
    usePlural: false,
  }),
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || "",
    process.env.APP_URL || "",
    "http://localhost:3000",
    "https://better-env.com",
    "https://www.better-env.com",
  ].filter(Boolean) as string[],
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
    organization({
      async sendInvitationEmail(data) {
        const base = process.env.APP_URL || (process.env.NODE_ENV === "production" ? "https://better-env.com" : "http://localhost:3000");
        const inviteLink = `${base}/invite/${data.id}`;
        const resendKey = process.env.RESEND_API_KEY;
        if (!resendKey) {
          console.log("sendInvitationEmail (no RESEND_API_KEY)", { to: data.email, inviteLink });
          return;
        }
        try {
          const resend = new Resend(resendKey);
          const html = await render(
            OrganizationInvitationEmail({
              inviterName: data.inviter.user.name || data.inviter.user.email,
              inviteeName: data.email,
              organizationName: data.organization.name,
              acceptUrl: inviteLink,
            })
          );
          const result = await resend.emails.send({
            from: process.env.EMAIL_FROM || "onboarding@resend.dev",
            to: data.email,
            subject: `${data.inviter.user.name || data.inviter.user.email} invited you to ${data.organization.name}`,
            html,
          });
          console.log("resend.sent", result);
        } catch (e) {
          console.error("resend.error", e);
        }
      },
    }),
  ],
  secret: process.env.BETTER_AUTH_SECRET,
});