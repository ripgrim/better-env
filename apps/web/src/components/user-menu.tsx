import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import Image from "next/image";
import { Button } from "@/components/ui/button";

import { authClient } from "@better-env/auth/client";
import { Skeleton } from "./ui/skeleton";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Check } from "lucide-react";
import { trpc, queryClient } from "@/utils/trpc";

export default function UserMenu() {
  const session = authClient.useSession();
  const { setTheme } = useTheme();
  const router = useRouter();
  const activeOrg = authClient.useActiveOrganization();
  const orgs = authClient.useListOrganizations();
  if (session.isPending) {
    return <Skeleton className="h-9 w-9 rounded-full" />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="text"
          size="icon"
          className="rounded-full p-0 h-auto w-auto"
        >
          <Image
            src={session.data?.user?.image || "/placeholder.svg?height=32&width=32"}
            width={32}
            height={32}
            alt="User Avatar"
            className="rounded-full"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push("/profile")}>
            Profile
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Workspace</DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuItem
                onClick={async () => {
                  await authClient.organization.setActive({ organizationId: null as unknown as string });
                  queryClient.invalidateQueries({ queryKey: trpc.projects.list.queryKey() });
                  router.refresh();
                }}
              >
                {!activeOrg.data?.id && <Check className="mr-2 h-4 w-4" />} Personal workspace
              </DropdownMenuItem>
              {Array.isArray(orgs.data) && orgs.data.map((o, idx) => (
                <DropdownMenuItem
                  key={o.id}
                  onClick={async () => {
                    if (activeOrg.data?.id === o.id) return;
                    await authClient.organization.setActive({ organizationId: o.id });
                    queryClient.invalidateQueries({ queryKey: trpc.projects.list.queryKey() });
                    router.refresh();
                  }}
                >
                  {activeOrg.data?.id === o.id && <Check className="mr-2 h-4 w-4" />} {o.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Theme</DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => authClient.signOut()}>
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
