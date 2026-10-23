import test from "node:test";
import assert from "node:assert/strict";
import { evaluateExpression } from "../src/calculator.js";

test("observes precedence and parentheses", () => {
  assert.equal(evaluateExpression("2+3*4"), 14);
  assert.equal(evaluateExpression("(2+3)*4"), 20);
  assert.equal(evaluateExpression("18/3-2"), 4);
});
test("handles decimals, unary minus and whitespace", () => {
  assert.equal(evaluateExpression(" .5 + 0.25 "), 0.75);
  assert.equal(evaluateExpression("-3 * (-2)"), 6);
  assert.equal(evaluateExpression("1.5 / 2"), 0.75);
});
test("rounds floating-point artifacts", () => {
  assert.equal(evaluateExpression("0.1+0.2"), 0.3);
});
test("rejects invalid and potentially executable expressions", () => {
  for (const input of ["", "1+", "1..2", "2(3)", "(1+2", "1/0", "1+alert(1)", "2**4", "9".repeat(121)]) {
    assert.throws(() => evaluateExpression(input), Error, input);
  }
});
