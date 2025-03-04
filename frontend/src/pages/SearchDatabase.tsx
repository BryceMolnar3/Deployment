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
  useToast
} from '@chakra-ui/react';
import NavigationBar from '../components/NavigationBar.tsx';
import { useNavigate } from 'react-router-dom';
import { manuscripts, Manuscript } from '../data/manuscripts.ts';

function SearchDatabase() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Manuscript[]>([]);
  const navigate = useNavigate();
  const toast = useToast();

  // Load all manuscripts when component mounts
  useEffect(function() {
    const allManuscripts = Object.values(manuscripts);
    console.log('Available manuscripts:', allManuscripts);
    setSearchResults(allManuscripts);
  }, []);

  function handleSearch() {
    setIsLoading(true);
    try {
      let results;
      if (!searchQuery.trim()) {
        // If search is empty, show all manuscripts
        results = Object.values(manuscripts);
      } else {
        // Filter manuscripts based on search query
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

      console.log('Search results:', results);
      setSearchResults(results);

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
    console.log('Viewing manuscript:', sigla);
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
          <Flex gap={4} mb={8}>
            <Input
              placeholder="Search by MS ID, Sigla, Other Names, Place of Origin, Date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="lg"
              borderColor="gray.400"
              flex={1}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
            />
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