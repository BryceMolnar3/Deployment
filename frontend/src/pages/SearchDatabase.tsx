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
import { manuscripts, Manuscript } from '../data/manuscripts.ts';

type SortOption = 'date-asc' | 'origin-az' | 'country-az' | 'sigla-asc' | 'sigla-desc';

function normalizeCountry(country: string): string {
  // Remove leading/trailing spaces and convert to lowercase for comparison
  const normalized = country.trim().toLowerCase();
  
  // Handle special cases
  if (normalized.includes('italy')) return 'Italy';
  if (normalized.includes('egypt')) return 'Egypt';
  if (normalized.includes('rome')) return 'Italy';
  if (normalized.includes('capua')) return 'Italy';
  if (normalized.includes('alexandria')) return 'Egypt';
  if (normalized.includes('caesarea')) return 'Israel';
  
  // If no special case matches, capitalize first letter of each word
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
  const navigate = useNavigate();
  const toast = useToast();

  // Load all manuscripts when component mounts
  useEffect(function() {
    const allManuscripts = Object.values(manuscripts);
    setSearchResults(sortManuscripts(allManuscripts, 'sigla-asc'));
  }, []);

  function sortManuscripts(manuscripts: Manuscript[], sortOption: SortOption): Manuscript[] {
    const sortedManuscripts = [...manuscripts];
    
    switch (sortOption) {
      case 'date-asc':
        return sortedManuscripts.sort((a, b) => {
          const yearA = parseInt(a.date.match(/\d+/)?.[0] || '0');
          const yearB = parseInt(b.date.match(/\d+/)?.[0] || '0');
          return yearA - yearB;
        });
      
      case 'origin-az':
        return sortedManuscripts.sort((a, b) => 
          a.place_of_origin.localeCompare(b.place_of_origin)
        );

      case 'country-az':
        return sortedManuscripts.sort((a, b) => {
          const countryA = getCountryFromOrigin(a.place_of_origin);
          const countryB = getCountryFromOrigin(b.place_of_origin);
          
          // First sort by country
          const countryCompare = countryA.localeCompare(countryB);
          
          // If countries are the same, sort by the full origin string
          if (countryCompare === 0) {
            return a.place_of_origin.localeCompare(b.place_of_origin);
          }
          
          return countryCompare;
        });
      
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

  function handleSort(e: React.ChangeEvent<HTMLSelectElement>) {
    const sortOption = e.target.value as SortOption;
    setSortBy(sortOption);
    setSearchResults(sortManuscripts(searchResults, sortOption));
  }

  function handleSearch() {
    setIsLoading(true);
    try {
      let results;
      if (!searchQuery.trim()) {
        results = Object.values(manuscripts);
      } else {
        const query = searchQuery.toLowerCase();
        results = Object.values(manuscripts).filter(manuscript => 
          manuscript.ms_id.toLowerCase().includes(query) ||
          manuscript.sigla.toLowerCase().includes(query) ||
          manuscript.other_names.toLowerCase().includes(query) ||
          manuscript.place_of_origin.toLowerCase().includes(query) ||
          manuscript.date.toLowerCase().includes(query) ||
          manuscript.materials.toLowerCase().includes(query) ||
          manuscript.format_description.toLowerCase().includes(query)
        );
      }

      // Apply current sort to search results
      setSearchResults(sortManuscripts(results, sortBy));

      if (results.length === 0) {
        toast({
          title: 'No results found',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Error performing search',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
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
                <option value="date-asc">Date (Oldest first)</option>
                <option value="origin-az">City/Region (A-Z)</option>
                <option value="country-az">Country (A-Z)</option>
                <option value="sigla-asc">Sigla (Ascending)</option>
                <option value="sigla-desc">Sigla (Descending)</option>
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