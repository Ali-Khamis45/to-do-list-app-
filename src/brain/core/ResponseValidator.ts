export class ResponseValidator {
  validate(text: string): { valid: boolean; cleanedText: string } {
    let lines = text.split('\n');
    const uniqueLines: string[] = [];
    let modified = false;

    // Remove direct duplicate lines
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length > 5 && uniqueLines.includes(trimmed)) {
        modified = true;
        continue;
      }
      uniqueLines.push(line);
    }

    return {
      valid: !modified,
      cleanedText: uniqueLines.join('\n')
    };
  }
}
