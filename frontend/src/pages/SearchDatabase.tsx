import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Input,
  Button,
  VStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Select,
  Stack,
} from '@chakra-ui/react';
import NavigationBar from '../components/NavigationBar.tsx';
import { useNavigate } from 'react-router-dom';

// Define the Manuscript interface to match your DB structure
interface Manuscript {
  _id: string;
  filename: string;
  metadata: {
    'MS ID:': string;
    'Other Names:': string;
    'Contents:': string;
    'Date:': string;
    'Origin:': string;
    'Total Folia:': string;
    'Dimensions:': string;
    'Materials:': string;
    'Laod Folia:': string;      // Match whatever is stored in DB
    'Format Description:': string;
  };
  verses: {
    verse_number: number;
    verse_text: string;
  }[];
}

// API base URL - can be configured via .env
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

// Sorting options
type SortOption =
  | 'date-asc'
  | 'date-desc'
  | 'origin-az'
  | 'origin-za'
  | 'country-az'
  | 'country-za'
  | 'sigla-asc'
  | 'sigla-desc'
  | 'msid-az'
  | 'msid-za'
  | 'other-names-az'
  | 'other-names-za';

/** Normalize strings for sorting countries. */
function normalizeCountry(country: string): string {
  const normalized = country.trim().toLowerCase();

  // Check if there's a known directional label
  if (
    normalized.includes('northern') ||
    normalized.includes('southern') ||
    normalized.includes('eastern') ||
    normalized.includes('western') ||
    normalized.includes('central')
  ) {
    // Return the words capitalized
    return normalized
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Look for a likely single-word country name
  const words = normalized.split(/[\s,]+/);
  const likelyCountry = words.find(
    (word) =>
      word.length > 3 &&
      !['the', 'and', 'near', 'region', 'province', 'city'].includes(word)
  );

  if (likelyCountry) {
    return likelyCountry.charAt(0).toUpperCase() + likelyCountry.slice(1);
  }

  // Fallback: capitalizes each word
  return country
    .trim()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/** Extracts the 'country' part from an 'Origin:' field. */
function getCountryFromOrigin(origin: string): string {
  const parts = origin.split(',');
  let country: string;

  if (parts.length > 1) {
    country = parts[parts.length - 1].trim();
  } else {
    country = origin.trim();
  }

  return normalizeCountry(country);
}

/** Client-side sorting for manuscripts. */
function sortManuscripts(manuscripts: Manuscript[], sortOption: SortOption): Manuscript[] {
  const sorted = [...manuscripts];

  switch (sortOption) {
    case 'date-asc':
      return sorted.sort((a, b) => {
        // Attempt to parse a year from 'Date:'
        const yearA = parseInt(a.metadata['Date:'].match(/\d+/)?.[0] || '0', 10);
        const yearB = parseInt(b.metadata['Date:'].match(/\d+/)?.[0] || '0', 10);
        return yearA - yearB;
      });

    case 'date-desc':
      return sorted.sort((a, b) => {
        const yearA = parseInt(a.metadata['Date:'].match(/\d+/)?.[0] || '0', 10);
        const yearB = parseInt(b.metadata['Date:'].match(/\d+/)?.[0] || '0', 10);
        return yearB - yearA;
      });

    case 'origin-az':
      return sorted.sort((a, b) =>
        a.metadata['Origin:'].localeCompare(b.metadata['Origin:'])
      );

    case 'origin-za':
      return sorted.sort((a, b) =>
        b.metadata['Origin:'].localeCompare(a.metadata['Origin:'])
      );

    case 'country-az':
      return sorted.sort((a, b) => {
        const countryA = getCountryFromOrigin(a.metadata['Origin:']);
        const countryB = getCountryFromOrigin(b.metadata['Origin:']);
        const compare = countryA.localeCompare(countryB);
        if (compare === 0) {
          return a.metadata['Origin:'].localeCompare(b.metadata['Origin:']);
        }
        return compare;
      });

    case 'country-za':
      return sorted.sort((a, b) => {
        const countryA = getCountryFromOrigin(a.metadata['Origin:']);
        const countryB = getCountryFromOrigin(b.metadata['Origin:']);
        const compare = countryB.localeCompare(countryA);
        if (compare === 0) {
          return b.metadata['Origin:'].localeCompare(a.metadata['Origin:']);
        }
        return compare;
      });

    case 'msid-az':
      return sorted.sort((a, b) =>
        a.metadata['MS ID:'].localeCompare(b.metadata['MS ID:'])
      );

    case 'msid-za':
      return sorted.sort((a, b) =>
        b.metadata['MS ID:'].localeCompare(a.metadata['MS ID:'])
      );

    case 'other-names-az':
      return sorted.sort((a, b) =>
        a.metadata['Other Names:'].localeCompare(b.metadata['Other Names:'])
      );

    case 'other-names-za':
      return sorted.sort((a, b) =>
        b.metadata['Other Names:'].localeCompare(a.metadata['Other Names:'])
      );

    case 'sigla-asc':
      return sorted.sort((a, b) => a.filename.localeCompare(b.filename));

    case 'sigla-desc':
      return sorted.sort((a, b) => b.filename.localeCompare(a.filename));

    default:
      return manuscripts;
  }
}

/** Minimal service for fetch-based calls to the backend. */
const manuscriptService = {
  async getAllManuscripts(): Promise<Manuscript[]> {
    const response = await fetch(`${API_BASE_URL}/api/documents/`);
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to fetch manuscripts: ${errText}`);
    }
    return response.json();
  },

  async searchManuscripts(query: string): Promise<Manuscript[]> {
    // Adjust the backend route if your API differs
    const response = await fetch(
      `${API_BASE_URL}/api/documents/search/?q=${encodeURIComponent(query)}`
    );
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to search manuscripts: ${errText}`);
    }
    return response.json();
  },

  async deleteManuscript(filename: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/documents/${filename}/delete`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to delete manuscript: ${errText}`);
    }
  },

  // The backend doesn't support sorting server-side, so do it client-side
  async getSortedManuscripts(
    manuscripts: Manuscript[],
    sortOption: SortOption
  ): Promise<Manuscript[]> {
    return sortManuscripts(manuscripts, sortOption);
  },
};

function SearchDatabase() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [manuscripts, setManuscripts] = useState<Manuscript[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('sigla-asc');
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    // Load all manuscripts on mount
    async function loadInitialData() {
      try {
        setIsLoading(true);
        setError(null);
        const all = await manuscriptService.getAllManuscripts();
        const sorted = await manuscriptService.getSortedManuscripts(all, 'sigla-asc');
        setManuscripts(sorted);
      } catch (err: any) {
        const msg = err.message || 'Failed to load manuscripts';
        setError(msg);
        toast({
          title: 'Error loading manuscripts',
          description: msg,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialData();
  }, [toast]);

  /** Handles client-side sorting. */
  async function handleSort(e: React.ChangeEvent<HTMLSelectElement>) {
    const sortOption = e.target.value as SortOption;
    setSortBy(sortOption);

    try {
      setIsLoading(true);
      setError(null);
      const sorted = await manuscriptService.getSortedManuscripts(manuscripts, sortOption);
      setManuscripts(sorted);
    } catch (err: any) {
      const msg = err.message || 'Failed to sort manuscripts';
      setError(msg);
      toast({
        title: 'Error sorting manuscripts',
        description: msg,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }

  /** Search logic to fetch from backend (or load all if empty). */
  async function handleSearch() {
    if (!searchQuery.trim()) {
      // If empty query, reload everything
      try {
        setIsLoading(true);
        setError(null);
        const all = await manuscriptService.getAllManuscripts();
        const sorted = await manuscriptService.getSortedManuscripts(all, sortBy);
        setManuscripts(sorted);
      } catch (err: any) {
        const msg = err.message || 'Failed to load manuscripts';
        setError(msg);
        toast({
          title: 'Error loading manuscripts',
          description: msg,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const results = await manuscriptService.searchManuscripts(searchQuery);
      const sorted = await manuscriptService.getSortedManuscripts(results, sortBy);
      setManuscripts(sorted);

      if (results.length === 0) {
        toast({
          title: 'No results found',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (err: any) {
      const msg = err.message || 'Failed to search manuscripts';
      setError(msg);
      toast({
        title: 'Error searching manuscripts',
        description: msg,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }

  /** Navigates to the viewer page for a given 'sigla' (filename minus .docx) */
  function handleViewManuscript(sigla: string) {
    navigate(`/manuscript-viewer/${sigla}`);
  }

  /** Example delete function, if you want a "Delete" button in the table. */
  async function handleDelete(filename: string) {
    try {
      await manuscriptService.deleteManuscript(filename);
      // Remove from local state
      const updated = manuscripts.filter((m) => m.filename !== filename);
      setManuscripts(updated);
      toast({
        title: `Manuscript ${filename} deleted`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err: any) {
      const msg = err.message || 'Failed to delete manuscript';
      toast({
        title: 'Error',
        description: msg,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }

  return (
    <Box>
      <NavigationBar />
      <Box>
        <Box bg="#08004F" py={8} px={6}>
          <Heading fontWeight="normal" ml={8} color="lightgray" size="lg">
            Search Database
          </Heading>
        </Box>

        <Box p={8}>
          {error && (
            <Box mb={4} p={4} bg="red.50" color="red.600" borderRadius="md">
              {error}
            </Box>
          )}

          <Flex gap={4} mb={8} alignItems="flex-start">
            <Box flex={1}>
              <Input
                placeholder="Search by MS ID, Sigla, Other Names, Place of Origin, Date..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="lg"
                borderColor="gray.400"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
              />
            </Box>
            <Box width="200px">
              <Select size="lg" value={sortBy} onChange={handleSort} borderColor="gray.400">
                <option value="msid-az">MS ID (A-Z)</option>
                <option value="msid-za">MS ID (Z-A)</option>
                <option value="sigla-asc">Sigla (Ascending)</option>
                <option value="sigla-desc">Sigla (Descending)</option>
                <option value="other-names-az">Other Names (A-Z)</option>
                <option value="other-names-za">Other Names (Z-A)</option>
                <option value="date-asc">Date (Oldest First)</option>
                <option value="date-desc">Date (Newest First)</option>
                <option value="origin-az">City/Region (A-Z)</option>
                <option value="origin-za">City/Region (Z-A)</option>
                <option value="country-az">Country (A-Z)</option>
                <option value="country-za">Country (Z-A)</option>
              </Select>
            </Box>
            <Button
              bg="#08004F"
              color="white"
              _hover={{ bg: '#160082' }}
              onClick={handleSearch}
              size="lg"
              px={8}
              isLoading={isLoading}
              loadingText="Searching..."
              borderRadius="full"
            >
              Search
            </Button>
          </Flex>

          {isLoading ? (
            <Text>Loading...</Text>
          ) : manuscripts.length > 0 ? (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Sigla</Th>
                  <Th>MS ID</Th>
                  <Th>Other Names</Th>
                  <Th>Date</Th>
                  <Th>Origin</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {manuscripts.map((m) => (
                  <Tr key={m._id}>
                    {/* remove .docx if you stored filename that way */}
                    <Td>{m.filename.replace('.docx', '')}</Td>
                    <Td>{m.metadata['MS ID:']}</Td>
                    <Td>{m.metadata['Other Names:']}</Td>
                    <Td>{m.metadata['Date:']}</Td>
                    <Td>{m.metadata['Origin:']}</Td>
                    <Td>
                      <Stack direction="row" spacing={2}>
                        <Button
                          size="sm"
                          colorScheme="blue"
                          onClick={() =>
                            handleViewManuscript(m.filename.replace('.docx', ''))
                          }
                        >
                          View
                        </Button>
                        {/* Optional: add a Delete button 
                        <Button
                          size="sm"
                          colorScheme="red"
                          onClick={() => handleDelete(m.filename)}
                        >
                          Delete
                        </Button> 
                        */}
                      </Stack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          ) : (
            <Text>No manuscripts found</Text>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default SearchDatabase;
