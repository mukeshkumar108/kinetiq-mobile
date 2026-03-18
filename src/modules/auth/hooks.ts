import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/api/query-keys";
import { fetchMe } from "./api";

export function useMe() {
  const { isLoaded, userId } = useAuth();

  return useQuery({
    queryKey: queryKeys.me(userId),
    queryFn: fetchMe,
    enabled: isLoaded && !!userId,
  });
}
