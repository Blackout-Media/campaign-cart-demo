export class CssProcessor {
  constructor() {
    this.deletedVariables = new Set();
  }

  async process(cssContent) {
    // Process the CSS content
    let processedCss = cssContent;

    // First pass: collect deleted variable names and remove declarations
    processedCss = this.collectAndRemoveDeletedVariables(processedCss);

    // Second pass: clean up var() references to deleted variables
    processedCss = this.cleanupDeletedVariableReferences(processedCss);

    return processedCss;
  }

  collectAndRemoveDeletedVariables(cssContent) {
    // Split into lines
    const lines = cssContent.split('\n');
    const filteredLines = [];

    for (const line of lines) {
      // Check if this is a variable declaration with <deleted
      if (line.includes('<deleted') && line.trim().startsWith('--')) {
        // Extract the variable name (everything before the colon)
        const match = line.match(/^\s*(--[^:]+):/);
        if (match) {
          // Store the full variable name including the <deleted part
          const varName = match[1].trim();
          this.deletedVariables.add(varName);
        }
        continue; // Skip this line
      }
      filteredLines.push(line);
    }

    return filteredLines.join('\n');
  }

  cleanupDeletedVariableReferences(cssContent) {
    // For each deleted variable, remove var() references to it
    this.deletedVariables.forEach(varName => {
      // Escape special characters in regex
      const escapedVarName = varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Replace var(--deleted-var) with 'inherit' or remove the entire property
      const varRegex = new RegExp(`var\\(${escapedVarName}\\)`, 'g');
      
      // For now, replace with 'inherit' to maintain CSS validity
      cssContent = cssContent.replace(varRegex, 'inherit');
    });

    return cssContent;
  }
}

export default CssProcessor;