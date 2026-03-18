import test from "node:test";
import assert from "node:assert/strict";

import {
  ApiError,
  isApiErrorEnvelope,
  unwrapResponse,
} from "../src/shared/types/api";

test("unwrapResponse returns data for success envelopes", () => {
  const data = unwrapResponse({
    success: true,
    data: { ok: true },
    error: null,
  });

  assert.deepEqual(data, { ok: true });
});

test("unwrapResponse throws ApiError for backend error envelopes", () => {
  assert.throws(
    () =>
      unwrapResponse({
        success: false,
        data: null,
        error: {
          message: "Nope",
          code: "BAD_THING",
        },
      }),
    (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.message, "Nope");
      assert.equal(error.code, "BAD_THING");
      return true;
    },
  );
});

test("isApiErrorEnvelope recognizes the shared backend shape", () => {
  assert.equal(
    isApiErrorEnvelope({
      success: false,
      data: null,
      error: { message: "Broken", code: "BROKEN" },
    }),
    true,
  );
  assert.equal(isApiErrorEnvelope({ success: true }), false);
  assert.equal(isApiErrorEnvelope(null), false);
});
