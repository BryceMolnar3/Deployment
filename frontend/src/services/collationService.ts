import { API_BASE_URL } from '../config.ts';

interface CollationResult {
  differences: {
    [verseNumber: string]: {
      witnesses: string[];
      table: any[][];
    };
  };
}

export const collationService = {
  async collateManuscripts(): Promise<CollationResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/collate/`);
      if (!response.ok) {
        throw new Error('Failed to collate manuscripts');
      }
      return await response.json();
    } catch (error) {
      throw new Error('Error during collation: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  },

  async getVerses(manuscriptId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/verses/${manuscriptId}/`);
      if (!response.ok) {
        throw new Error('Failed to fetch verses');
      }
      return await response.json();
    } catch (error) {
      throw new Error('Error fetching verses: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  },

  async getVerse(manuscriptId: string, verseNumber: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/verses/${manuscriptId}/${verseNumber}/`);
      if (!response.ok) {
        throw new Error('Failed to fetch verse');
      }
      return await response.json();
    } catch (error) {
      throw new Error('Error fetching verse: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }
}; 