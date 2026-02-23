/**
 * Converts a string to a valid camelCase TypeScript variable name.
 * Removes special characters and ensures the name starts with a lowercase letter.
 */
export function toCamelCase(name: string): string {
  // Remove special characters, keep alphanumeric and spaces
  const cleaned = name.replace(/[^a-zA-Z0-9\s]/g, " ");
  
  // Split into words
  const words = cleaned.split(/\s+/).filter(w => w.length > 0);
  
  if (words.length === 0) {
    return "unnamed";
  }
  
  // First word lowercase, rest capitalized
  const first = words[0].toLowerCase();
  const rest = words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  
  const result = first + rest.join("");
  
  // If result starts with a number, prefix with "_"
  if (/^\d/.test(result)) {
    return "_" + result;
  }
  
  // Ensure it's a valid identifier
  if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(result)) {
    return "unnamed";
  }
  
  return result;
}

/**
 * Generates a unique variable name by appending a number suffix if needed.
 */
export function generateUniqueName(
  baseName: string,
  existingNames: Set<string>
): string {
  if (!existingNames.has(baseName)) {
    return baseName;
  }
  
  let counter = 1;
  let candidate = `${baseName}${counter}`;
  
  while (existingNames.has(candidate)) {
    counter++;
    candidate = `${baseName}${counter}`;
  }
  
  return candidate;
}

/**
 * Escapes a string for use in TypeScript code.
 */
export function escapeString(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}

/**
 * Formats a value for TypeScript code output.
 */
export function formatValue(value: unknown, indent = 0): string {
  const indentStr = "  ".repeat(indent);
  
  if (value === null) {
    return "null";
  }
  
  if (value === undefined) {
    return "undefined";
  }
  
  if (typeof value === "string") {
    return `"${escapeString(value)}"`;
  }
  
  if (typeof value === "number") {
    return String(value);
  }
  
  if (typeof value === "boolean") {
    return String(value);
  }
  
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "[]";
    }
    const items = value.map(v => formatValue(v, indent + 1)).join(", ");
    return `[${items}]`;
  }
  
  if (typeof value === "object") {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      return "{}";
    }
    const formattedEntries = entries
      .map(([key, val]) => {
        const formattedKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) 
          ? key 
          : `"${escapeString(key)}"`;
        return `${indentStr}  ${formattedKey}: ${formatValue(val, indent + 1)}`;
      })
      .join(",\n");
    return `{\n${formattedEntries},\n${indentStr}}`;
  }
  
  return String(value);
}

/**
 * Infers TypeScript type from a value.
 */
export function inferType(value: unknown): string {
  if (value === null) {
    return "null";
  }
  
  if (value === undefined) {
    return "undefined";
  }
  
  if (typeof value === "string") {
    return "string";
  }
  
  if (typeof value === "number") {
    return "number";
  }
  
  if (typeof value === "boolean") {
    return "boolean";
  }
  
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "unknown[]";
    }
    const elementTypes = new Set(value.map(inferType));
    if (elementTypes.size === 1) {
      return `${Array.from(elementTypes)[0]}[]`;
    }
    return `(${Array.from(elementTypes).join(" | ")})[]`;
  }
  
  if (typeof value === "object") {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      return "Record<string, never>";
    }
    const props = entries
      .map(([key, val]) => {
        const optional = val === undefined ? "?" : "";
        return `"${key}"${optional}: ${inferType(val)}`;
      })
      .join("; ");
    return `{ ${props} }`;
  }
  
  return "unknown";
}
