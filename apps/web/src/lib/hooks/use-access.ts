"use client";

import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";

export function useAccess() {
  const { data, isLoading, error } = useQuery(trpc.healthCheck.queryOptions());
  return { hasAccess: !!data, isLoading, error };
}

export function useCurrentUser() {
  return { user: null, isLoading: false, error: null };
}