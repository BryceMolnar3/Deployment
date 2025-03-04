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
  Select
} from '@chakra-ui/react';
import NavigationBar from '../components/NavigationBar.tsx';
import { useNavigate } from 'react-router-dom';
// Temporarily keep local data for development
import { manuscripts as localManuscripts, Manuscript } from '../data/manuscripts.ts';

// API base URL - can be configured based on environment
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

function sortManuscripts(manuscripts: Manuscript[], sortOption: SortOption): Manuscript[] {
  const sortedManuscripts = [...manuscripts];
  
  switch (sortOption) {
    case 'date-asc':
      return sortedManuscripts.sort((a, b) => {
        const yearA = parseInt(a.date.match(/\d+/)?.[0] || '0');
        const yearB = parseInt(b.date.match(/\d+/)?.[0] || '0');
        return yearA - yearB;
      });
    
    case 'date-desc':
      return sortedManuscripts.sort((a, b) => {
        const yearA = parseInt(a.date.match(/\d+/)?.[0] || '0');
        const yearB = parseInt(b.date.match(/\d+/)?.[0] || '0');
        return yearB - yearA;
      });

    case 'origin-az':
      return sortedManuscripts.sort((a, b) => 
        a.place_of_origin.localeCompare(b.place_of_origin)
      );

    case 'origin-za':
      return sortedManuscripts.sort((a, b) => 
        b.place_of_origin.localeCompare(a.place_of_origin)
      );

    case 'country-az':
      return sortedManuscripts.sort((a, b) => {
        const countryA = getCountryFromOrigin(a.place_of_origin);
        const countryB = getCountryFromOrigin(b.place_of_origin);
        
        const countryCompare = countryA.localeCompare(countryB);
        
        if (countryCompare === 0) {
          return a.place_of_origin.localeCompare(b.place_of_origin);
        }
        
        return countryCompare;
      });

    case 'country-za':
      return sortedManuscripts.sort((a, b) => {
        const countryA = getCountryFromOrigin(a.place_of_origin);
        const countryB = getCountryFromOrigin(b.place_of_origin);
        
        const countryCompare = countryB.localeCompare(countryA);
        
        if (countryCompare === 0) {
          return b.place_of_origin.localeCompare(a.place_of_origin);
        }
        
        return countryCompare;
      });
    
    case 'msid-az':
      return sortedManuscripts.sort((a, b) => 
        a.ms_id.localeCompare(b.ms_id)
      );

    case 'msid-za':
      return sortedManuscripts.sort((a, b) => 
        b.ms_id.localeCompare(a.ms_id)
      );

    case 'other-names-az':
      return sortedManuscripts.sort((a, b) => 
        a.other_names.localeCompare(b.other_names)
      );

    case 'other-names-za':
      return sortedManuscripts.sort((a, b) => 
        b.other_names.localeCompare(a.other_names)
      );
    
    case 'sigla-asc':
      return sortedManuscripts.sort((a, b) => 
        a.sigla.localeCompare(b.sigla)
      );
    
    case 'sigla-desc':
      return sortedManuscripts.sort((a, b) => 
        b.sigla.localeCompare(a.sigla)
      );
    
    default:
      return sortedManuscripts;
  }
}

// API service for manuscript operations
const manuscriptService = {
  async getAllManuscripts(): Promise<Manuscript[]> {
    try {
      // When ready to switch to backend, uncomment this code:
      // const response = await fetch(`${API_BASE_URL}/manuscripts`);
      // if (!response.ok) throw new Error('Failed to fetch manuscripts');
      // return await response.json();
      
      // For now, return local data
      return Object.values(localManuscripts);
    } catch (error) {
      console.error('Error fetching manuscripts:', error);
      throw error;
    }
  },

  async searchManuscripts(query: string): Promise<Manuscript[]> {
    try {
      // When ready to switch to backend, uncomment this code:
      // const response = await fetch(`${API_BASE_URL}/manuscripts/search?q=${encodeURIComponent(query)}`);
      // if (!response.ok) throw new Error('Failed to search manuscripts');
      // return await response.json();
      
      // For now, search local data
      const searchQuery = query.toLowerCase();
      return Object.values(localManuscripts).filter(manuscript => 
        manuscript.ms_id.toLowerCase().includes(searchQuery) ||
        manuscript.sigla.toLowerCase().includes(searchQuery) ||
        manuscript.other_names.toLowerCase().includes(searchQuery) ||
        manuscript.place_of_origin.toLowerCase().includes(searchQuery) ||
        manuscript.date.toLowerCase().includes(searchQuery) ||
        manuscript.materials.toLowerCase().includes(searchQuery) ||
        manuscript.format_description.toLowerCase().includes(searchQuery)
      );
    } catch (error) {
      console.error('Error searching manuscripts:', error);
      throw error;
    }
  },

  async getSortedManuscripts(manuscripts: Manuscript[], sortOption: SortOption): Promise<Manuscript[]> {
    try {
      // When ready to switch to backend, uncomment this code:
      // const response = await fetch(`${API_BASE_URL}/manuscripts/sort?option=${sortOption}`);
      // if (!response.ok) throw new Error('Failed to sort manuscripts');
      // return await response.json();
      
      // For now, sort locally
      return sortManuscripts(manuscripts, sortOption);
    } catch (error) {
      console.error('Error sorting manuscripts:', error);
      throw error;
    }
  }
};

type SortOption = 'date-asc' | 'date-desc' | 'origin-az' | 'origin-za' | 'country-az' | 'country-za' | 
                  'sigla-asc' | 'sigla-desc' | 'msid-az' | 'msid-za' | 'other-names-az' | 'other-names-za';

function normalizeCountry(country: string): string {
  // Remove leading/trailing spaces and convert to lowercase for comparison
  const normalized = country.trim().toLowerCase();
  
  // Handle geographic indicators first
  if (normalized.includes('northern') || normalized.includes('southern') ||
      normalized.includes('eastern') || normalized.includes('western') ||
      normalized.includes('central')) {
    // Return the full normalized string since it likely contains important geographic context
    return normalized.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Split into words and check if any word is a likely country name
  // Countries tend to be single words and longer than 3 letters
  const words = normalized.split(/[\s,]+/);
  const likelyCountry = words.find(word => 
    word.length > 3 && 
    !['the', 'and', 'near', 'region', 'province', 'city'].includes(word)
  );

  if (likelyCountry) {
    return likelyCountry.charAt(0).toUpperCase() + likelyCountry.slice(1);
  }
  
  // If no country detected, capitalize first letter of each word
  return country.trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function getCountryFromOrigin(origin: string): string {
  const parts = origin.split(',');
  let country;
  
  if (parts.length > 1) {
    // If there's a comma, use the last part (country)
    country = parts[parts.length - 1].trim();
  } else {
    // If no comma, check if it's a city we know the country for
    country = origin.trim();
  }
  
  return normalizeCountry(country);
}

function SearchDatabase() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Manuscript[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('sigla-asc');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const toast = useToast();

  // Load all manuscripts when component mounts
  useEffect(() => {
    async function loadInitialData() {
      try {
        setIsLoading(true);
        setError(null);
        const manuscripts = await manuscriptService.getAllManuscripts();
        const sortedManuscripts = await manuscriptService.getSortedManuscripts(manuscripts, 'sigla-asc');
        setSearchResults(sortedManuscripts);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load manuscripts';
        setError(errorMessage);
        toast({
          title: 'Error loading manuscripts',
          description: errorMessage,
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

  async function handleSort(e: React.ChangeEvent<HTMLSelectElement>) {
    const sortOption = e.target.value as SortOption;
    setSortBy(sortOption);
    
    try {
      setIsLoading(true);
      setError(null);
      const sortedResults = await manuscriptService.getSortedManuscripts(searchResults, sortOption);
      setSearchResults(sortedResults);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sort manuscripts';
      setError(errorMessage);
      toast({
        title: 'Error sorting manuscripts',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim() && searchResults.length === 0) {
      // If empty query and no results, load all manuscripts
      try {
        setIsLoading(true);
        setError(null);
        const manuscripts = await manuscriptService.getAllManuscripts();
        const sortedManuscripts = await manuscriptService.getSortedManuscripts(manuscripts, sortBy);
        setSearchResults(sortedManuscripts);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load manuscripts';
        setError(errorMessage);
        toast({
          title: 'Error loading manuscripts',
          description: errorMessage,
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
      const sortedResults = await manuscriptService.getSortedManuscripts(results, sortBy);
      setSearchResults(sortedResults);

      if (results.length === 0) {
        toast({
          title: 'No results found',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to search manuscripts';
      setError(errorMessage);
      toast({
        title: 'Error searching manuscripts',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }

  function handleViewManuscript(sigla: string) {
    navigate(`/manuscript-viewer/${sigla}`);
  }

  return (
    <Box>
      <NavigationBar />
      <Box>
        <Box bg="#08004F" py={8} px={6} position="relative">
          <Heading fontWeight="normal" ml={8} color="lightgray" size="lg">Search Database</Heading>
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
              <Select
                size="lg"
                value={sortBy}
                onChange={handleSort}
                borderColor="gray.400"
              >
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
              _hover={{ bg: "#160082" }}
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

          <Box borderWidth={1} borderColor="gray.200" borderRadius="md" overflow="hidden">
            <Table variant="simple">
              <Thead bg="gray.50">
                <Tr>
                  <Th>MS ID</Th>
                  <Th>Sigla</Th>
                  <Th>Other Names</Th>
                  <Th>Date</Th>
                  <Th>Place of Origin</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {searchResults.map((manuscript) => (
                  <Tr key={manuscript.sigla}>
                    <Td>{manuscript.ms_id}</Td>
                    <Td>{manuscript.sigla}</Td>
                    <Td>{manuscript.other_names}</Td>
                    <Td>{manuscript.date}</Td>
                    <Td>{manuscript.place_of_origin}</Td>
                    <Td>
                      <Button
                        bg="#08004F"
                        color="white"
                        _hover={{ bg: "#160082" }}
                        size="sm"
                        onClick={() => handleViewManuscript(manuscript.sigla)}
                        borderRadius="full"
                      >
                        View
                      </Button>
                    </Td>
                  </Tr>
                ))}
                {searchResults.length === 0 && !isLoading && (
                  <Tr>
                    <Td colSpan={6} textAlign="center" py={4}>
                      No results found
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default SearchDatabase; 