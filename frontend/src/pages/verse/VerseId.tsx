import React from 'react';
import { Box, Flex, Heading, Text } from '@chakra-ui/react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import NavigationBar from '../../components/NavigationBar.tsx';
import { manuscripts } from '../../data/manuscripts.ts';
import { useDisplaySettings } from '../../contexts/DisplaySettingsContext.tsx';

interface LocationState {
  verseNumber?: number;
  verseText?: string;
}

function VerseId() {
  const location = useLocation();
  const navigate = useNavigate();
  const { verseNumber: verseNumberParam } = useParams();
  const { settings } = useDisplaySettings();
  const locationState = location.state as LocationState;
  
  // Get verse number from either URL param or location state
  const verseNumber = verseNumberParam ? parseInt(verseNumberParam) : locationState?.verseNumber;

  // Theme-based colors
  const textColor = settings.theme === 'dark' ? 'gray.100' : 'gray.900';
  const linkColor = settings.theme === 'dark' ? 'blue.300' : 'blue.600';

  if (!verseNumber) {
    return <Box>No verse number provided</Box>;
  }

  return (
    <Box>
      <NavigationBar />
      <Box bg="#08004F" py={8} px={6}>
        <Heading fontWeight="normal" ml={8} color="lightgray" size="lg">Verse View</Heading>
      </Box>
      <Box p={6} ml={8}>
        <Heading size="lg" mb={4} color={textColor}>Verse {verseNumber}</Heading>
        {Object.entries(manuscripts).map(([manuscriptId, manuscript]) => {
          const verse = manuscript.verses.find(v => v.verse_number === verseNumber);
          return (
            <Box key={manuscriptId} mb={6}>
              <Flex ml={6}>
                <Heading 
                  size="md" 
                  mb={2} 
                  cursor="pointer"
                  color={linkColor}
                  _hover={{ textDecoration: 'underline' }}
                  onClick={function() {
                    navigate(`/manuscript-viewer/${manuscriptId}`, {
                      state: { manuscriptId }
                    });
                  }}
                >
                  {manuscriptId}
                </Heading>
                <Text fontSize="lg" ml={4} color={textColor}>{verse?.verse_text}</Text>
              </Flex>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export default VerseId;
