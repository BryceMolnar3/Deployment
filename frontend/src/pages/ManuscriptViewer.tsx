import React from 'react';
import { Box, Flex, Heading, Text, Image, VStack } from '@chakra-ui/react';
import NavigationBar from '../components/NavigationBar.tsx';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { manuscripts } from '../data/manuscripts.ts';
import { useDisplaySettings } from '../contexts/DisplaySettingsContext.tsx';

function ManuscriptViewer() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sigla } = useParams();
  const manuscriptId = sigla || location.state?.manuscriptId || null;
  const { settings } = useDisplaySettings();

  // Theme-based colors
  const boxBg = settings.theme === 'dark' ? 'gray.800' : 'white';
  const textColor = settings.theme === 'dark' ? 'gray.100' : 'gray.900';
  const borderColor = settings.theme === 'dark' ? 'gray.600' : 'gray.300';
  const linkColor = settings.theme === 'dark' ? 'blue.300' : 'blue.600';

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
                <Text fontSize="lg" fontWeight="normal" w="180px" color={textColor}>MS ID:</Text>
                <Text fontSize="lg" fontWeight="normal" flex={1} color={textColor}><u>{manuscripts[manuscriptId].ms_id}</u></Text>
                <Text fontSize="lg" fontWeight="normal" ml={8} color={textColor}>Sigla: <u>{manuscripts[manuscriptId].sigla}</u></Text>
              </Flex>
              
              <VStack spacing={4} align="stretch">
                <Flex>
                  <Text fontSize="lg" fontWeight="normal" w="180px" color={textColor}>Other Names:</Text>
                  <Text fontSize="lg" fontWeight="normal" color={textColor}><u>{manuscripts[manuscriptId].other_names}</u></Text>
                </Flex>
                <Flex>
                  <Text fontSize="lg" fontWeight="normal" w="180px" color={textColor}>Total Folia:</Text>
                  <Text fontSize="lg" fontWeight="normal" color={textColor}><u>{manuscripts[manuscriptId].total_folia}</u></Text>
                </Flex>
                <Flex>
                  <Text fontSize="lg" fontWeight="normal" w="180px" color={textColor}>Laod. Folia:</Text>
                  <Text fontSize="lg" fontWeight="normal" color={textColor}><u>{manuscripts[manuscriptId].laod_folia}</u></Text>
                </Flex>
                <Flex>
                  <Text fontSize="lg" fontWeight="normal" w="180px" color={textColor}>Dimensions:</Text>
                  <Text fontSize="lg" fontWeight="normal" color={textColor}><u>{manuscripts[manuscriptId].dimensions}</u></Text>
                </Flex>
                <Flex>
                  <Text fontSize="lg" fontWeight="normal" w="180px" color={textColor}>Place of Origin:</Text>
                  <Text fontSize="lg" fontWeight="normal" color={textColor}><u>{manuscripts[manuscriptId].place_of_origin}</u></Text>
                </Flex>
                <Flex>
                  <Text fontSize="lg" fontWeight="normal" w="180px" color={textColor}>Materials:</Text>
                  <Text fontSize="lg" fontWeight="normal" color={textColor}><u>{manuscripts[manuscriptId].materials}</u></Text>
                </Flex>
              </VStack>

              <Flex mt={4} mb={4}>
                <Text fontSize="lg" fontWeight="normal" w="180px" color={textColor}>Format Description:</Text>
                <Text fontSize="lg" fontWeight="normal" flex={1} color={textColor}><u>{manuscripts[manuscriptId].format_description}</u></Text>
                <Text fontSize="lg" fontWeight="normal" ml={8} color={textColor}>Date: <u>{manuscripts[manuscriptId].date}</u></Text>
              </Flex>

              <Box 
                border="1px solid" 
                borderColor={borderColor}
                borderRadius="md"
                p={4}
                height="500px"
                overflowY="auto"
                bg={boxBg}
              >
                <Text whiteSpace="pre-line" fontWeight="normal" color={textColor}>
                  {manuscripts[manuscriptId].verses.map(verse => (
                    <React.Fragment key={verse.verse_number}>
                      <Text color={textColor}>
                        <sup>
                          <Text
                            as="span" 
                            cursor="pointer"
                            color={linkColor}
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