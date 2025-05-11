import { API_BASE_URL } from '../config';

interface CollationResult {
  differences: {
    [verseNumber: string]: {
      witnesses: string[];
      table: any[][];
    };
  };
}

interface WordComparison {
  verseNumber: number;
  word1: string;
  word2: string;
  position: number;
  manuscriptSigla: string;
}

interface ComparisonResult {
  comparisonId: string;
  isSignificant: boolean;
  variationType: string;
  wordComparison: WordComparison;
  timestamp: string;
}

export const collationService = {
  async collateManuscripts(): Promise<CollationResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/collate/`, {
        headers: {
          ...this.getAuthHeader(),
        },
      });
      if (!response.ok) {
        throw new Error('Failed to collate manuscripts');
      }
      return await response.json();
    } catch (error) {
      throw new Error('Error during collation: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  },

  async saveComparison(data: {
    wordComparison: WordComparison;
    isSignificant: boolean;
    variationType: string;
  }): Promise<ComparisonResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/comparisons/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeader(),
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save comparison');
      }

      return await response.json();
    } catch (error) {
      throw new Error('Error saving comparison: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  },

  async getVerses(manuscriptId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/verses/${manuscriptId}/`, {
        headers: {
          ...this.getAuthHeader(),
        },
      });
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
      const response = await fetch(`${API_BASE_URL}/verses/${manuscriptId}/${verseNumber}/`, {
        headers: {
          ...this.getAuthHeader(),
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch verse');
      }
      return await response.json();
    } catch (error) {
      throw new Error('Error fetching verse: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  },

  async getPhylogeneticTree(format: 'base64' | 'newick' = 'base64'): Promise<{ tree_image?: string; newick_tree?: string; manuscript_count: number }> {
    try {
      const response = await fetch(`${API_BASE_URL}/generate_phylogenetic_tree/?format2=${format}`, {
        headers: {
          ...this.getAuthHeader(),
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch phylogenetic tree');
      }
      return await response.json();
    } catch (error) {
      throw new Error('Error fetching phylogenetic tree: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  },

  async login(username: string, password: string): Promise<{ access: string; refresh: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      localStorage.setItem('accessToken', data.access);
      localStorage.setItem('refreshToken', data.refresh);
      return data;
    } catch (error) {
      throw new Error('Error during login: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  },

  async logout(): Promise<void> {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  getAuthHeader(): { Authorization: string } | {} {
    const token = localStorage.getItem('accessToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}; 