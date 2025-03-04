import React from 'react';
import { Box, Flex, Heading, Text, Image, VStack } from '@chakra-ui/react';
import NavigationBar from '../components/NavigationBar.tsx';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { manuscripts } from '../data/manuscripts.ts';

function ManuscriptViewer() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const manuscriptId = id || location.state?.manuscriptId || null;

  if (!manuscriptId) {
    return <Box>No manuscript ID provided</Box>;
  }
  if (!manuscripts[manuscriptId]) {
    return <Box>Manuscript not found</Box>;
  }

  return (
    <Box>
      <NavigationBar />
      <Box>
        <Box bg="#08004F" py={8} px={6}>
          <Heading fontWeight="normal" ml={8} color="lightgray" size="lg">Manuscript View</Heading>
        </Box>

        <Box ml={8} p={6}>
          <Flex gap={12}>
            <Box flex={2} maxW="65%">
              <Flex mb={6}>
                <Text fontSize="lg" fontWeight="normal" w="180px">MS ID:</Text>
                <Text fontSize="lg" fontWeight="normal" flex={1}><u>{manuscripts[manuscriptId].ms_id}</u></Text>
                <Text fontSize="lg" fontWeight="normal" ml={8}>Sigla: <u>{manuscripts[manuscriptId].sigla}</u></Text>
              </Flex>
              
              <VStack spacing={4} align="stretch">
                <Flex>
                  <Text fontSize="lg" fontWeight="normal" w="180px">Other Names:</Text>
                  <Text fontSize="lg" fontWeight="normal"><u>{manuscripts[manuscriptId].other_names}</u></Text>
                </Flex>
                <Flex>
                  <Text fontSize="lg" fontWeight="normal" w="180px">Total Folia:</Text>
                  <Text fontSize="lg" fontWeight="normal"><u>{manuscripts[manuscriptId].total_folia}</u></Text>
                </Flex>
                <Flex>
                  <Text fontSize="lg" fontWeight="normal" w="180px">Laod. Folia:</Text>
                  <Text fontSize="lg" fontWeight="normal"><u>{manuscripts[manuscriptId].laod_folia}</u></Text>
                </Flex>
                <Flex>
                  <Text fontSize="lg" fontWeight="normal" w="180px">Dimensions:</Text>
                  <Text fontSize="lg" fontWeight="normal"><u>{manuscripts[manuscriptId].dimensions}</u></Text>
                </Flex>
                <Flex>
                  <Text fontSize="lg" fontWeight="normal" w="180px">Place of Origin:</Text>
                  <Text fontSize="lg" fontWeight="normal"><u>{manuscripts[manuscriptId].place_of_origin}</u></Text>
                </Flex>
                <Flex>
                  <Text fontSize="lg" fontWeight="normal" w="180px">Materials:</Text>
                  <Text fontSize="lg" fontWeight="normal"><u>{manuscripts[manuscriptId].materials}</u></Text>
                </Flex>
              </VStack>

              <Flex mt={4} mb={4}>
                <Text fontSize="lg" fontWeight="normal" w="180px">Format Description:</Text>
                <Text fontSize="lg" fontWeight="normal" flex={1}><u>{manuscripts[manuscriptId].format_description}</u></Text>
                <Text fontSize="lg" fontWeight="normal" ml={8}>Date: <u>{manuscripts[manuscriptId].date}</u></Text>
              </Flex>

              <Box 
                border="1px solid" 
                borderColor="gray.300" 
                borderRadius="md"
                p={4}
                height="500px"
                overflowY="auto"
                bg="white"
              >
                <Text whiteSpace="pre-line" fontWeight="normal">
                  {manuscripts[manuscriptId].verses.map(verse => (
                    <React.Fragment key={verse.verse_number}>
                      <Text>
                        <sup>
                          <Text
                            as="span" 
                            cursor="pointer"
                            color="blue.600"
                            _hover={{ textDecoration: 'underline' }}
                            onClick={function() {
                              navigate(`/verse/${verse.verse_number}`, {
                                state: { 
                                  verseNumber: verse.verse_number,
                                  verseText: verse.verse_text
                                }
                              });
                            }}
                          >
                            {verse.verse_number}
                          </Text>
                        </sup>
                        {verse.verse_text}
                      </Text>
                      <br/>
                    </React.Fragment>
                  ))}
                </Text>
              </Box>
            </Box>

            <Box flex={1} display="flex" justifyContent="flex-start">
              <Image 
                src={manuscripts[manuscriptId].image_src}
                alt={`${manuscripts[manuscriptId].other_names} manuscript page`}
                maxH="900px"
                objectFit="contain"
              />
            </Box>
          </Flex>
        </Box>
      </Box>
    </Box>
  );
}

export default ManuscriptViewer; 