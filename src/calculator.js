const MAX_EXPRESSION_LENGTH = 120;

export function evaluateExpression(input) {
  if (typeof input !== "string" || !input.trim() || input.length > MAX_EXPRESSION_LENGTH) {
    throw new Error("Invalid expression.");
  }
  const expression = input.replace(/\s+/g, "");
  if (!/^[0-9+*/().-]+$/.test(expression)) throw new Error("Unsupported character.");
  const tokens = expression.match(/(?:\d+(?:\.\d*)?|\.\d+)|[()+*/-]/g);
  if (!tokens || tokens.join("") !== expression) throw new Error("Malformed expression.");

  let index = 0;
  function factor() {
    const token = tokens[index];
    if (token === "+" || token === "-") {
      index++;
      return (token === "-" ? -1 : 1) * factor();
    }
    if (token === "(") {
      index++;
      const value = sum();
      if (tokens[index++] !== ")") throw new Error("Missing closing parenthesis.");
      return value;
    }
    if (token === undefined || token === ")") throw new Error("Expected a number.");
    if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(token)) throw new Error("Expected a number.");
    index++;
    return Number(token);
  }
  function product() {
    let value = factor();
    while (tokens[index] === "*" || tokens[index] === "/") {
      const operator = tokens[index++];
      const right = factor();
      if (operator === "/" && right === 0) throw new Error("Cannot divide by zero.");
      value = operator === "*" ? value * right : value / right;
    }
    return value;
  }
  function sum() {
    let value = product();
    while (tokens[index] === "+" || tokens[index] === "-") {
      const operator = tokens[index++];
      const right = product();
      value = operator === "+" ? value + right : value - right;
    }
    return value;
  }
  const result = sum();
  if (index !== tokens.length || !Number.isFinite(result)) throw new Error("Invalid expression.");
  return Number(result.toPrecision(12));
}
