import type { QueryClient, QueryKey } from "@tanstack/react-query";

export async function invalidateQueryKeys(
  queryClient: Pick<QueryClient, "invalidateQueries">,
  queryKeys: readonly QueryKey[],
): Promise<void> {
  await Promise.all(
    queryKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
  );
}
