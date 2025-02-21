import React from 'react';
import { Box, Flex, Heading, Text, Image, VStack } from '@chakra-ui/react';
import NavigationBar from './NavigationBar.tsx';

interface VerseMetadata {
  sigla: string;
  verse: string;
}

function VerseViewer() {
  const verses: VerseMetadata[] = [
    {
      sigla: "01",
      verse: "Paulus apostolus non ab hominibus. Neque per hominem sed perih(esu)m χρ(istu)m. Fratribus qui sunt laodiciae."
    },
    {
      sigla: "02", 
      verse: "Gratia vobis et pax a deo patre et domino nostro ih(es)u χρ(ist)o."
    },
    {
      sigla: "03",
      verse: "Gratias ago deo meo semper pro vobis orans."
    }
  ];

  return (
    <Box>
      <NavigationBar />
    </Box>
  );
}
