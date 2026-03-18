import test from "node:test";
import assert from "node:assert/strict";

import {
  GUEST_QUERY_SCOPE,
  getHabitInvalidationKeys,
  getQueryScope,
  getTaskInvalidationKeys,
  queryKeys,
} from "../src/api/query-keys";
import { invalidateQueryKeys } from "../src/api/invalidate";

test("getQueryScope falls back to guest", () => {
  assert.equal(getQueryScope(null), GUEST_QUERY_SCOPE);
  assert.equal(getQueryScope(undefined), GUEST_QUERY_SCOPE);
  assert.equal(getQueryScope("user_123"), "user_123");
});

test("queryKeys scope all cache entries by user", () => {
  assert.deepEqual(queryKeys.me("user_123"), ["session", "user_123", "me"]);
  assert.deepEqual(queryKeys.habits("user_123", true), [
    "session",
    "user_123",
    "habits",
    { includeArchived: true },
  ]);
  assert.deepEqual(queryKeys.tasks("user_123", "completed"), [
    "session",
    "user_123",
    "tasks",
    { status: "completed" },
  ]);
  assert.deepEqual(queryKeys.today("user_123", "America/New_York"), [
    "session",
    "user_123",
    "today",
    "America/New_York",
  ]);
});

test("habit and task invalidation groups refresh dependent views", () => {
  assert.deepEqual(getHabitInvalidationKeys("user_123"), [
    ["session", "user_123", "habits"],
    ["session", "user_123", "today"],
    ["session", "user_123", "progression"],
  ]);
  assert.deepEqual(getTaskInvalidationKeys("user_123"), [
    ["session", "user_123", "tasks"],
    ["session", "user_123", "today"],
    ["session", "user_123", "progression"],
  ]);
});

test("invalidateQueryKeys fans out each invalidation request", async () => {
  const calls: unknown[] = [];

  await invalidateQueryKeys(
    {
      invalidateQueries: async (filters: any) => {
        calls.push(filters?.queryKey);
      },
    },
    [["a"], ["b"], ["c"]],
  );

  assert.deepEqual(calls, [["a"], ["b"], ["c"]]);
});
