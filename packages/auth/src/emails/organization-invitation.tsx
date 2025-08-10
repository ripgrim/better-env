import * as React from "react";
import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Text,
  Button,
  Link,
  Tailwind,
  Section,
} from "@react-email/components";

type Props = {
  inviterName: string;
  inviteeName?: string;
  organizationName: string;
  acceptUrl: string;
};

export default function OrganizationInvitationEmail({ inviterName, inviteeName, organizationName, acceptUrl }: Props) {
  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Preview>You're invited to {organizationName} on better-env</Preview>
        <Body className="bg-[#0b0b0b] font-sans py-[40px]">
          <Container className="mx-auto bg-white rounded-[16px] max-w-[600px] px-[40px] py-[40px]">
            <Section className="text-center mb-[28px]">
              <Text className="text-[14px] uppercase tracking-[0.12em] text-gray-500 m-0">better-env</Text>
            </Section>

            <Section className="text-center mb-[28px]">
              <Text className="text-[26px] font-bold text-black m-0 mb-[8px]">Join {organizationName}</Text>
              <Text className="text-[16px] text-gray-600 m-0">{inviterName} invited you to their workspace</Text>
            </Section>

            <Section className="mb-[32px]">
              <Text className="text-[16px] text-black m-0 mb-[16px]">Hi {inviteeName || "there"},</Text>
              <Text className="text-[15px] text-gray-700 m-0 mb-[20px] leading-[24px]">
                Accept this invite to collaborate with your team and manage environment variables securely across projects.
              </Text>
            </Section>

            <Section className="text-center mb-[28px]">
              <Button href={acceptUrl} className="bg-[#0ea5e9] text-white px-[28px] py-[14px] rounded-[10px] text-[15px] font-medium no-underline inline-block">
                Accept invitation
              </Button>
            </Section>

            <Section className="text-center mb-[32px]">
              <Text className="text-[13px] text-gray-600 m-0 mb-[6px]">Button not working?</Text>
              <Link href={acceptUrl} className="text-black text-[13px] underline">
                Open invite link
              </Link>
            </Section>

            <Section className="border-t border-solid border-gray-200 pt-[24px]">
              <Text className="text-[12px] text-gray-500 m-0 mb-[6px]">
                This invite was sent by {inviterName}. If you didn’t expect this, you can safely ignore it.
              </Text>
              <Text className="text-[12px] text-gray-500 m-0">© {new Date().getFullYear()} better-env</Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

;(OrganizationInvitationEmail as any).PreviewProps = {
  inviterName: "grim",
  inviteeName: "friend",
  organizationName: "acme",
  acceptUrl: "http://localhost:3000/invite/abc123",
} satisfies Props as any;


