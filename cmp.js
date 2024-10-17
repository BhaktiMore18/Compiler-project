// Define the variables globally
const variables = {};

// Function to update a variable's value
function updateVariable(variableName, value) {
  variables[variableName] = value; // Update the variable
}

// Function to get the final output value
function getFinalOutput() {
  return Object.entries(variables)
    .map(([key, value]) => `${key} = ${value}`)
    .join("\n"); // Format the output as "variable = value"
}

// Function to translate code
function translateCode() {
  const highLevelCode = document.getElementById("highLevelCode").value;
  const lines = highLevelCode.split("\n");
  let assemblyCode = "";
  let loopCounter = 0; // To label loops uniquely
  let ifCounter = 0; // To label if statements uniquely
  let insideLoop = false; // To track if we are inside a loop
  let insideIf = false; // To track if we are inside an if statement
  let currentIfLabel = ""; // To track the current if label for jumps

  // Clear previous output
  document.getElementById("assemblyCode").textContent = "";
  document.getElementById("executionOutput").textContent = ""; // Clear output

  lines.forEach((line) => {
    // Remove single-line comments
    const singleLineCommentIndex = line.indexOf("//");
    if (singleLineCommentIndex !== -1) {
      line = line.substring(0, singleLineCommentIndex).trim();
    }

    // Remove multi-line comments
    const multiLineStartIndex = line.indexOf("/*");
    const multiLineEndIndex = line.indexOf("*/");
    if (multiLineStartIndex !== -1 && multiLineEndIndex !== -1) {
      line =
        line.substring(0, multiLineStartIndex).trim() +
        line.substring(multiLineEndIndex + 2).trim();
    } else if (multiLineStartIndex !== -1) {
      return; // If there is a start without an end, ignore the line
    } else if (multiLineEndIndex !== -1) {
      line = line.substring(multiLineEndIndex + 2).trim(); // If there is an end without a start
    }

    if (line === "") return; // Skip empty lines

    if (line.startsWith("for")) {
      const loopParts = line.match(
        /for\s*\(\s*([^;]*);\s*([^;]*);\s*([^;]*)\s*\)/
      );
      if (loopParts) {
        const initialization = loopParts[1].trim(); // e.g., i = 0
        const condition = loopParts[2].trim(); // e.g., i < 5
        const incrementVar = loopParts[3].trim(); // e.g., i++

        const varName = initialization.split("=")[0].trim();
        const initialValue = initialization.split("=")[1].trim();
        assemblyCode += `MOV ${varName}, ${initialValue}\n`;
        updateVariable(varName, Number(initialValue)); // Store the actual value as a number

        assemblyCode += `LOOP_START_${loopCounter}:\n`;
        assemblyCode += `CMP ${varName}, ${condition.split("<")[1].trim()}\n`;
        assemblyCode += `JGE LOOP_END_${loopCounter}\n`;
        insideLoop = true;
        loopCounter++;
      }
    } else if (line.startsWith("if")) {
      const ifParts = line.match(/if\s*\(\s*([^)]*)\s*\)/);
      if (ifParts) {
        const condition = ifParts[1].trim();
        currentIfLabel = `IF_END_${ifCounter}`;
        assemblyCode += `CMP ${condition.split("<")[0].trim()}, ${condition
          .split("<")[1]
          .trim()}\n`;
        assemblyCode += `JGE ${currentIfLabel}\n`;
        insideIf = true;
        ifCounter++;
      }
    } else if (line.startsWith("else") && insideIf) {
      assemblyCode += `JMP ELSE_END_${ifCounter}\n`;
      assemblyCode += `${currentIfLabel}:\n`;
      insideIf = false;
    } else if (line.includes("=")) {
      const [variable, expression] = line.split("=").map((part) => part.trim());
      assemblyCode += evaluateExpression(expression.trim(), variable);
      assemblyCode += `MOV ${variable}, ${variable}_temp\n`;

      // Update variable with its computed value without using eval
      const computedValue = computeExpression(expression.trim());
      updateVariable(variable, computedValue); // Update with the computed value
    } else if (line === "}" && insideLoop) {
      assemblyCode += `INC i\n`;
      assemblyCode += `JMP LOOP_START_${loopCounter - 1}\n`;
      assemblyCode += `LOOP_END_${loopCounter - 1}:\n`;
      insideLoop = false;
    } else if (line === "}" && insideIf) {
      assemblyCode += `${currentIfLabel}:\n`;
      insideIf = false;
    }
  });

  // Display the generated assembly code
  document.getElementById("assemblyCode").textContent =
    assemblyCode ||
    "No assembly code generated. Please check the input format.";

  // Display the final output values of the variables
  document.getElementById("executionOutput").textContent = getFinalOutput();
}

// Safe expression evaluator
function computeExpression(expression) {
  const tokens = expression.split(/[\+\-\*\/]/).map((token) => token.trim());
  const operators = expression.match(/[\+\-\*\/]/g) || [];

  let result = Number(variables[tokens[0]] || tokens[0]); // Start with the first operand
  for (let i = 0; i < operators.length; i++) {
    const nextValue = Number(variables[tokens[i + 1]] || tokens[i + 1]);
    switch (operators[i]) {
      case "+":
        result += nextValue;
        break;
      case "-":
        result -= nextValue;
        break;
      case "*":
        result *= nextValue;
        break;
      case "/":
        result /= nextValue;
        break;
    }
  }

  return result; // Return the computed value
}

// Improved simple expression evaluator
function evaluateExpression(expression, currentVariable) {
  const trimmedExp = expression.trim();
  const operators = /[\+\-\*\/]/; // Supported operators
  const tokens = trimmedExp.split(operators).map((token) => token.trim());
  const opTokens = trimmedExp
    .split(/[^+\-*\/]/)
    .filter((token) => token.trim());

  let assemblyOperations = "";

  for (let i = 0; i < opTokens.length; i++) {
    const operator = opTokens[i].trim();
    const nextValue = tokens[i + 1] ? tokens[i + 1] : "";

    if (operator === "+") {
      assemblyOperations += `ADD ${currentVariable}, ${nextValue}\n`;
    } else if (operator === "-") {
      assemblyOperations += `SUB ${currentVariable}, ${nextValue}\n`;
    } else if (operator === "*") {
      assemblyOperations += `MUL ${currentVariable}, ${nextValue}\n`;
    } else if (operator === "/") {
      assemblyOperations += `DIV ${currentVariable}, ${nextValue}\n`;
    }

    if (i < tokens.length - 1) {
      assemblyOperations += `MOV ${currentVariable}_temp, ${currentVariable}\n`;
    }
  }

  return assemblyOperations;
}

// Wrap the main logic in a DOMContentLoaded event listener
document.addEventListener("DOMContentLoaded", function () {
  // Any other code that needs to run after DOM is fully loaded can go here
});
