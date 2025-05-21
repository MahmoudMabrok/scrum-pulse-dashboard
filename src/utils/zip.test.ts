import { extractPRInfo } from './zip';

describe('extractPRInfo', () => {
    it('should extract PR info from text with correct format', () => {
        const text = `- chore: [Manual PR] rc/beta-2.2.0 to master 19/05/2025 (#[11696])
- feat: Add new feature (#[11697])`;

        const result = extractPRInfo(text);

        expect(result).toEqual([
            {
                number: '11696',
                title: 'chore: [Manual PR] rc/beta-2.2.0 to master 19/05/2025'
            },
            {
                number: '11697', 
                title: 'feat: Add new feature'
            }
        ]);
    });

    it('should return empty array for text with no PR info', () => {
        const text = 'Some text without PR numbers';
        const result = extractPRInfo(text);
        expect(result).toEqual([]);
    });

    it('should handle empty string input', () => {
        const result = extractPRInfo('');
        expect(result).toEqual([]);
    });

    it('should handle text with invalid PR format', () => {
        const text = '- Invalid PR format #123';
        const result = extractPRInfo(text);
        expect(result).toEqual([]);
    });
});