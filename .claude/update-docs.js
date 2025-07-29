import { execSync } from "child_process";

// Get git diff since last push
const diff = execSync("git diff origin/main...HEAD").toString();

if (!diff.trim()) {
  console.log("No changes to analyze");
  process.exit(0);
}

// Single Claude call with comprehensive instructions
const prompt = `
Analyze this git diff and update documentation accordingly:

${diff}

INSTRUCTIONS:
1. Look at the code changes and identify what features/functionality changed, if any.
2. Check docs/features/ directory for existing documentation that needs updates
3. Update existing docs using the Edit tool
4. Create new docs using the Write tool for any new features
5. Focus on user-facing changes, new APIs, and behavioral modifications

- Do not document changes that aren't relevant to the features/implementation of the application.
- Styling changes should not be documented.

Working directory: ${process.cwd()}
`;

// Execute claude in headless mode - let it use its tools
try {
  execSync(`claude -p "${prompt}"`, { stdio: "inherit" });
  console.log("✅ Documentation update completed");
} catch (error) {
  console.warn("⚠️ Documentation update failed, continuing push...");
}
