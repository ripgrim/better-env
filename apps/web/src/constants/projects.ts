export type Device = { name: string; status: "online" | "offline" };

export type Project = {
  id: string;
  name: string;
  logoUrl: string;
  devices: Device[];
  lastSyncTime: string;
  envs: Record<string, string>;
};

export const PROJECTS: Project[] = [
  {
    id: "proj_oss_now",
    name: "oss.now",
    logoUrl:
      "https://cdn.discordapp.com/attachments/915489116970418186/1402974394170478653/ossdotnow.png?ex=6895dd39&is=68948bb9&hm=7e9ea7f51b39b81d4a9c31e1f6de3c2d8d26aa8a90c9b8f212569803f1e80173&",
    devices: [
      { name: "macncheese", status: "online" },
      { name: "grim's desktop", status: "offline" },
    ],
    lastSyncTime: "2 minutes ago",
    envs: {
      DATABASE_URL: "postgresql://user:pass@localhost:5432/oss",
      BETTER_AUTH_SECRET: "some-secret",
      STRIPE_SECRET_KEY: "sk_test_abc",
      STRIPE_PUBLISHABLE_KEY: "pk_test_abc",
      NEXT_PUBLIC_APP_URL: "https://oss.now",
      POSTHOG_API_KEY: "phc_123",
      SENDGRID_API_KEY: "SG.abc",
    },
  },
  {
    id: "proj_bounty_new",
    name: "bounty.new",
    logoUrl:
      "https://cdn.discordapp.com/attachments/915489116970418186/1402974642636980345/bountydark.png?ex=6895dd74&is=68948bf4&hm=86338a50a3694509cb3d35dcee12c8464cc5bf6cc34a65cfc4ef2d67d5ae031e&",
    devices: [
      { name: "grim's desktop", status: "online" },
      { name: "macncheese", status: "offline" },
    ],
    lastSyncTime: "1 hour ago",
    envs: {
      DATABASE_URL: "postgresql://user:pass@localhost:5432/bounty",
      BETTER_AUTH_PUBLIC_KEY: "some-public",
      BETTER_AUTH_PRIVATE_KEY: "some-private",
      NEXT_PUBLIC_APP_URL: "https://bounty.new",
      STRIPE_SECRET_KEY: "sk_live_xyz",
      STRIPE_PUBLISHABLE_KEY: "pk_live_xyz",
      AWS_REGION: "us-east-1",
    },
  },
  {
    id: "proj_mail0",
    name: "mail0",
    logoUrl:
      "https://cdn.discordapp.com/attachments/915489116970418186/1402974643169661082/mail0dark.png?ex=6895dd74&is=68948bf4&hm=0e1c0fd8e4b9db4de86ee698b6c140a7cc969206de61a9e89c7be1988fccd22c&",
    devices: [
      { name: "macncheese", status: "online" },
      { name: "grim's desktop", status: "offline" },
    ],
    lastSyncTime: "5 hours ago",
    envs: {
      DATABASE_URL: "postgresql://user:pass@localhost:5432/mail0",
      NEXT_PUBLIC_APP_URL: "https://mail0.app",
      POSTHOG_HOST: "https://us.i.posthog.com",
      POSTHOG_API_KEY: "phc_456",
      REDIS_URL: "redis://localhost:6379",
      RESEND_API_KEY: "re_abc",
    },
  },
  {
    id: "proj_analog_now",
    name: "analog.now",
    logoUrl:
      "https://cdn.discordapp.com/attachments/915489116970418186/1402975302946394152/analogdotballs.png?ex=6895de12&is=68948c92&hm=d9bfe24d174d7084cc8e996be1ab912b6b7603fba9f2af4027692bbfcb8f7601&",
    devices: [
      { name: "grim's desktop", status: "online" },
      { name: "macncheese", status: "offline" },
    ],
    lastSyncTime: "1 day ago",
    envs: {
      DATABASE_URL: "postgresql://user:pass@localhost:5432/analog",
      BETTER_AUTH_SECRET: "another-secret",
      NEXT_PUBLIC_APP_URL: "https://analog.now",
      VERCEL_URL: "analog.vercel.app",
    },
  },
  {
    id: "proj_call0",
    name: "call0",
    logoUrl:
      "https://cdn.discordapp.com/attachments/915489116970418186/1402974642926522378/call0jawn.png?ex=6895dd74&is=68948bf4&hm=691be61ce125af91089a76b7dccdf211b85c69d7afa5787916ec70853a211d2e&",
    devices: [
      { name: "macncheese", status: "online" },
      { name: "grim's desktop", status: "offline" },
    ],
    lastSyncTime: "3 days ago",
    envs: {
      DATABASE_URL: "postgresql://user:pass@localhost:5432/call0",
      NEXT_PUBLIC_APP_URL: "https://call0.dev",
      CLOUDFLARE_ACCOUNT_ID: "cf_123",
      CLOUDFLARE_API_TOKEN: "cf_token",
    },
  },
  {
    id: "proj_env_new",
    name: "env.new",
    logoUrl: "",
    devices: [
      { name: "grim's desktop", status: "online" },
      { name: "macncheese", status: "offline" },
    ],
    lastSyncTime: "1 week ago",
    envs: {
      DATABASE_URL: "postgresql://user:pass@localhost:5432/envnew",
      NEXT_PUBLIC_APP_URL: "https://env.new",
      UPSTASH_REDIS_REST_URL: "https://u.example",
      UPSTASH_REDIS_REST_TOKEN: "u_token",
    },
  },
];

