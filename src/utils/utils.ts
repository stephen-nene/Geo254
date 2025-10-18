export class SearchUtils {
  static calculateSimilarity(str1: string, str2: string): number {
    const normalize = (str: string) => str.toLowerCase().trim();
    const a = normalize(str1);
    const b = normalize(str2);
    
    if (a === b) return 1;
    if (a.includes(b) || b.includes(a)) return 0.8;
    
    // Levenshtein distance for fuzzy matching
    const matrix = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(null));
    
    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
    
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    
    const maxLen = Math.max(a.length, b.length);
    return 1 - matrix[a.length][b.length] / maxLen;
  }

  static encodeBase64(obj: any): string {
    return Buffer.from(JSON.stringify(obj)).toString('base64');
  }

  static decodeBase64(cursor: string): any {
    try {
      return JSON.parse(Buffer.from(cursor, 'base64').toString());
    } catch {
      throw new KenyaAdminError('Invalid cursor format', 'INVALID_CURSOR');
    }
  }
}
