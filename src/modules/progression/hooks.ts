import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/api/query-keys";
import { fetchProgression } from "./api";

export function useProgression() {
  const { isLoaded, userId } = useAuth();

  return useQuery({
    queryKey: queryKeys.progression(userId),
    queryFn: fetchProgression,
    enabled: isLoaded && !!userId,
  });
}
