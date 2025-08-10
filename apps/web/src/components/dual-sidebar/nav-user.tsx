"use client";

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    image: string | null;
  };
}) {

  // const handleUpgrade = async () => {
  //   if (!session?.user) {
  //     toast.error("Please sign in to upgrade your account.");
  //     return;
  //   }
  //   setPricingDialogOpen(true);
  // };

  return (
    <>
      <div className="flex items-center gap-2">
        <span>
          {user.name}
        </span>
        <span>
          {user.email}
        </span>
      </div>
    </>
  );
}
