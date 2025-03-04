import React from 'react';
import { Box, Flex, Heading, Text } from '@chakra-ui/react';
import { useLocation, useNavigate } from 'react-router-dom';
import NavigationBar from '../../components/NavigationBar.tsx';
import { manuscripts } from '../../data/manuscripts.ts';

interface LocationState {
  verseNumber: number;
  verseText: string;
}

function VerseId() {
  const location = useLocation();
  const navigate = useNavigate();
  const { verseNumber } = location.state as LocationState;

  return (
    <Box>
      <NavigationBar />
      <Box bg="#08004F" py={8} px={6}>
          <Heading fontWeight="normal" ml={8} color="lightgray" size="lg">Verse View</Heading>
        </Box>
      <Box p={6} ml={8}>
        <Heading size="lg" mb={4}>Verse {verseNumber}</Heading>
        {Object.entries(manuscripts).map(([manuscriptId, manuscript]) => {
          const verse = manuscript.verses.find(v => v.verse_number === verseNumber);
          return (
            <Box key={manuscriptId} mb={6}>
              <Flex ml={6}>
                <Heading 
                  size="md" 
                  mb={2} 
                  cursor="pointer"
                  color="blue.600"
                  onClick={function() {
                    navigate(`/manuscript-viewer/${manuscriptId}`, {
                      state: { manuscriptId }
                    });
                  }}
                >
                  {manuscriptId}
                </Heading>
                <Text fontSize="lg" ml={4}>{verse?.verse_text}</Text>
              </Flex>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export default VerseId;
