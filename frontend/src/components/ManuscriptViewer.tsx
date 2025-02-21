import React from 'react';
import { Box, Flex, Heading, Text, Image, IconButton, VStack } from '@chakra-ui/react';
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
      <Flex 
        bg="beige" 
        p={4} 
        justifyContent="space-between" 
        alignItems="center"
      >
        <Flex flex={1} gap={4} alignItems="center">
          <Image 
            src="/images/Hamilton_Logo.png"
            alt="Hamilton College Logo"
            height="80px"
            marginRight={4}
          />
          <Flex flex={1} justifyContent="center">
            <Text textAlign="center" color="gray.600" fontSize={20} fontWeight={200}>Search <br />database</Text>
            <Text color="gray.600" mx={8} my={2} fontSize={25} fontWeight={100}>|</Text>
            <Text textAlign="center" color="gray.600" fontSize={20} fontWeight={200}>New <br />data entry</Text>
            <Text color="gray.600" mx={8} my={2} fontSize={25} fontWeight={100}>|</Text>
            <Text textAlign="center" color="gray.600" fontSize={20} fontWeight={200}>Manual<br />differentiation</Text>
            <Text color="gray.600" mx={8} my={2} fontSize={25} fontWeight={100}>|</Text>
            <Text textAlign="center" color="gray.600" fontSize={20} fontWeight={200}>Phylogenetic<br />analysis</Text>
          </Flex>
        </Flex>
        <IconButton
          aria-label="Settings"
          as={SettingsIcon}
          variant="ghost"
        />
      </Flex>

      <Box>
        <Box bg="navy" py={8} px={6}>
          <Heading fontWeight="normal" ml={8} color="lightgray" size="lg">Manuscript View</Heading>
        </Box>

        <Box ml={8} p={6}>
          <Flex gap={12}>
            <Box flex={2} maxW="65%">
              <Flex mb={6}>
                <Text fontSize="lg" fontWeight="normal" w="180px">MS ID:</Text>
                <Text fontSize="lg" fontWeight="normal" flex={1}><u>{manuscript.ms_id}</u></Text>
                <Text fontSize="lg" fontWeight="normal" ml={8}>Sigla: <u>{manuscript.sigla}</u></Text>
              </Flex>
              
              <VStack spacing={4} align="stretch">
                <Flex>
                  <Text fontSize="lg" fontWeight="normal" w="180px">Other Names:</Text>
                  <Text fontSize="lg" fontWeight="normal"><u>{manuscript.other_names}</u></Text>
                </Flex>
                <Flex>
                  <Text fontSize="lg" fontWeight="normal" w="180px">Total Folia:</Text>
                  <Text fontSize="lg" fontWeight="normal"><u>{manuscript.total_folia}</u></Text>
                </Flex>
                <Flex>
                  <Text fontSize="lg" fontWeight="normal" w="180px">Laod. Folia:</Text>
                  <Text fontSize="lg" fontWeight="normal"><u>{manuscript.laod_folia}</u></Text>
                </Flex>
                <Flex>
                  <Text fontSize="lg" fontWeight="normal" w="180px">Dimensions:</Text>
                  <Text fontSize="lg" fontWeight="normal"><u>{manuscript.dimensions}</u></Text>
                </Flex>
                <Flex>
                  <Text fontSize="lg" fontWeight="normal" w="180px">Place of Origin:</Text>
                  <Text fontSize="lg" fontWeight="normal"><u>{manuscript.place_of_origin}</u></Text>
                </Flex>
                <Flex>
                  <Text fontSize="lg" fontWeight="normal" w="180px">Materials:</Text>
                  <Text fontSize="lg" fontWeight="normal"><u>{manuscript.materials}</u></Text>
                </Flex>
              </VStack>

              <Flex mt={4} mb={4}>
                <Text fontSize="lg" fontWeight="normal" w="180px">Format Description:</Text>
                <Text fontSize="lg" fontWeight="normal" flex={1}><u>{manuscript.format_description}</u></Text>
                <Text fontSize="lg" fontWeight="normal" ml={8}>Date: <u>{manuscript.date}</u></Text>
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
                  Paulus apostolus non ab hominibus. Neque per hominem sed per in(esu)m xp(istu)m. Fratribus qui sunt laodiciae.

                  Gratia vobis es pax a d(e)o patre et d(omi)no ih(es)u xp(ist)o.
                  Gratias ago xp(ist)o per omnem orationem me(am). Quod permanentes estis in eo et perseuerantes in operibus eius promissum expectantes in diem iudici.
                </Text>
              </Box>
            </Box>

            <Box flex={1} display="flex" justifyContent="flex-start">
              <Image 
                src="/images/manuscript-image.png" 
                alt="Manuscript page"
                maxH="900px"
                objectFit="contain"
                border="1px solid"
                borderColor="gray.300"
              />
            </Box>
          </Flex>
        </Box>
      </Box>
    </Box>
  );
}

export default ManuscriptViewer; 