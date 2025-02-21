import React from 'react';
import { Box, Flex, Heading, Text, Image, IconButton } from '@chakra-ui/react';
import { SettingsIcon } from '@chakra-ui/icons';

interface ManuscriptMetadata {
  ms_id: string;
  sigla: string;
  other_names: string;
  total_folia: number;
  laod_folia: string;
  dimensions: string;
  place_of_origin: string;
  materials: string;
  format_description: string;
  date: string;
}

function ManuscriptViewer() {
  // Replace with actual manuscript data from the database
  const manuscript: ManuscriptMetadata = {
    ms_id: "Fulda, Hochschul- und Landesbibliothek, Bonifatianus 1",
    sigla: "01",
    other_names: "Codex Fuldensis",
    total_folia: 1018,
    laod_folia: "316v-317v",
    dimensions: "15×6×5 in",
    place_of_origin: "Capua, Northern Italy",
    materials: "Parchment",
    format_description: "Single Column",
    date: "541-546"
  };

  return (
    <Box>
      {/* Navigation Bar */}
      <Flex 
        bg="beige" 
        p={4} 
        justifyContent="space-between" 
        alignItems="center"
      >
        <Flex gap={4}>
          <Text>Search database</Text>
          <Text>New data entry</Text>
          <Text>Manual differentiation</Text>
          <Text>Phylogenetic analysis</Text>
        </Flex>
        <IconButton
          aria-label="Settings"
          as={SettingsIcon}
          variant="ghost"
        />
      </Flex>

      {/* Main Content */}
      <Box p={6}>
        <Box bg="navy" py={4} px={6} mb={6}>
          <Heading color="white" size="lg">Manuscript View</Heading>
        </Box>

        {/* Manuscript Details */}
        <Flex gap={8}>
          <Box flex={1}>
            <Flex justify="space-between" mb={4}>
              <Text>MS ID: {manuscript.ms_id}</Text>
              <Text>Sigla: {manuscript.sigla}</Text>
            </Flex>
            
            <Text mb={2}>Other Names: {manuscript.other_names}</Text>
            <Text mb={2}>Total Folia: {manuscript.total_folia}</Text>
            <Text mb={2}>Laod. Folia: {manuscript.laod_folia}</Text>
            <Text mb={2}>Dimensions: {manuscript.dimensions}</Text>
            <Text mb={2}>Place of Origin: {manuscript.place_of_origin}</Text>
            <Text mb={2}>Materials: {manuscript.materials}</Text>
            <Text mb={2}>Format Description: {manuscript.format_description}</Text>
            <Text mb={2}>Date: {manuscript.date}</Text>

            {/* Text Content Area */}
            <Box 
              mt={6} 
              border="1px solid" 
              borderColor="gray.300" 
              borderRadius="md"
              p={4}
              height="500px"
              overflowY="auto"
            >
              <Text whiteSpace="pre-line">
                Paulus apostolus non ab hominibus. Neque per hominem sed per in(esu)m xp(istu)m. Fratribus qui sunt laodiciae.

                Gratia vobis es pax a d(e)o patre et d(omi)no ih(es)u xp(ist)o.
                Gratias ago xp(ist)o per omnem orationem me(am). Quod permanentes estis in eo et perseuerantes in operibus eius promissum expectantes in diem iudici.
                
                {/* Add more text content as needed */}
              </Text>
            </Box>
          </Box>

          {/* Manuscript Image */}
          <Box flex={1}>
            <Image 
              src="/manuscript-image.jpg" 
              alt="Manuscript page"
              maxH="800px"
              objectFit="contain"
            />
          </Box>
        </Flex>
      </Box>
    </Box>
  );
}

export default ManuscriptViewer; 