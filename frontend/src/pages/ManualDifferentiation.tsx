import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Select,
  Progress,
  VStack,
  HStack,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import NavigationBar from '../components/NavigationBar.tsx';
import { useDisplaySettings } from '../contexts/DisplaySettingsContext.tsx';

// Types for API responses
interface WordComparison {
  verseNumber: number;
  word1: string;
  word2: string;
  position: number;
  manuscriptSigla: string;
}

interface ComparisonResult {
  comparisonId: string;
  isSignificant: boolean;
  variationType: string;
  wordComparison: WordComparison;
  timestamp: string;
}

interface Manuscript {
  _id: string;
  filename: string;
  metadata: {
    'MS ID:': string;
    'Other Names:': string;
    'Contents:': string;
    'Date:': string;
    'Origin:': string;
    'Total Folia:': string;
    'Dimensions:': string;
    'Materials:': string;
    'Laod. Folia:': string;
    'Format Description:': string;
  };
  verses: {
    verse_number: number;
    verse_text: string;
  }[];
}

// API base URL
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

// We generate word comparisons in the front end for the demonstration
// because the sample backend routes were minimal. Real systems might do this in the backend.
function generateWordComparisons(
  baseManuscript: Manuscript,
  comparisonManuscript: Manuscript
): WordComparison[] {
  const comparisons: WordComparison[] = [];

  // Compare each verse
  baseManuscript.verses.forEach((baseVerse) => {
    const compVerse = comparisonManuscript.verses.find(
      (v) => v.verse_number === baseVerse.verse_number
    );
    if (!compVerse) return;

    // Split and clean
    const baseWords = baseVerse.verse_text
      .toLowerCase()
      .replace(/[.,()]/g, '')
      .split(' ')
      .filter((word) => word.length > 0);

    const compWords = compVerse.verse_text
      .toLowerCase()
      .replace(/[.,()]/g, '')
      .split(' ')
      .filter((word) => word.length > 0);

    // Compare words one by one
    const maxLength = Math.max(baseWords.length, compWords.length);
    for (let i = 0; i < maxLength; i++) {
      const word1 = baseWords[i] || '[missing]';
      const word2 = compWords[i] || '[missing]';
      if (word1 !== word2) {
        comparisons.push({
          verseNumber: baseVerse.verse_number,
          word1,
          word2,
          position: i + 1,
          manuscriptSigla: comparisonManuscript.filename.replace('.docx', ''),
        });
      }
    }
  });

  return comparisons;
}

function ManualDifferentiation() {
  const { settings } = useDisplaySettings();
  const [variations, setVariations] = useState<WordComparison[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [isSignificant, setIsSignificant] = useState(true);
  const [variationType, setVariationType] = useState('Different Spelling');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [variationTypes, setVariationTypes] = useState<string[]>([
    "Different Spelling",
    "Abbreviation",
    "Word Choice",
    "Word Order",
    "Addition",
    "Omission"
  ]);
  const toast = useToast();

  // Theming
  const boxBg = settings.theme === 'dark' ? 'gray.800' : 'white';
  const boxBorderColor = settings.theme === 'dark' ? 'gray.600' : 'gray.200';
  const textColor = settings.theme === 'dark' ? 'gray.100' : 'gray.600';
  const inputBg = settings.theme === 'dark' ? 'gray.700' : 'gray.50';
  const inputBorderColor = settings.theme === 'dark' ? 'gray.500' : 'gray.300';

  useEffect(() => {
    // Attempt to load any custom variation types from localStorage
    const savedTypes = localStorage.getItem('variationTypes');
    if (savedTypes) {
      try {
        const types = JSON.parse(savedTypes);
        setVariationTypes(types);
        if (!types.includes(variationType)) {
          setVariationType(types[0]);
        }
      } catch (err) {
        console.error('Error loading variation types from local storage:', err);
      }
    }
  }, [variationType]);

  // Fetch manuscripts, generate comparisons
  useEffect(() => {
    async function fetchData() {
      try {
        setIsFetchingData(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/api/documents`);
        if (!response.ok) {
          throw new Error('Failed to fetch manuscripts');
        }
        const data: Manuscript[] = await response.json();

        // Find base manuscript "01.docx"
        const baseManuscript = data.find((m) => m.filename === '01.docx');
        if (!baseManuscript) {
          throw new Error('Base manuscript (01.docx) not found');
        }

        // Generate comparisons with all other manuscripts
        let allComparisons: WordComparison[] = [];
        data.forEach((m) => {
          if (m.filename !== '01.docx') {
            const comps = generateWordComparisons(baseManuscript, m);
            allComparisons = allComparisons.concat(comps);
          }
        });

        setVariations(allComparisons);
      } catch (error: any) {
        setError(error.message || 'Unknown error');
        toast({
          title: 'Error fetching comparisons',
          description: error.message || 'Unknown error occurred',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsFetchingData(false);
      }
    }

    fetchData();
  }, [toast]);

  const currentVariation = variations[currentIndex];
  const currentNumber = currentIndex + 1;
  const totalVariations = variations.length;

  async function handleConfirm() {
    if (!currentVariation) return;
    try {
      setIsLoading(true);
      setError(null);

      const body = {
        wordComparison: currentVariation,
        isSignificant,
        variationType,
      };

      const response = await fetch(`${API_BASE_URL}/api/comparisons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Failed to save comparison');
      }

      const result: ComparisonResult = await response.json();

      setCompletedCount((prev) => prev + 1);
      setCurrentIndex((prev) => prev + 1);

      toast({
        title: 'Variation recorded',
        description: `Comparison saved with ID: ${result.comparisonId}`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error: any) {
      setError(error.message || 'Failed to save comparison');
      toast({
        title: 'Error recording variation',
        description: error.message || 'Unknown error occurred',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }

  function handleSkip() {
    setCurrentIndex((prev) => prev + 1);
  }

  if (isFetchingData) {
    return (
      <Box>
        <NavigationBar />
        <Box>
          <Box bg="#08004F" py={8} px={6} position="relative">
            <Heading fontWeight="normal" ml={8} color="lightgray" size="lg">
              Manual Differentiation
            </Heading>
          </Box>
          <Box p={8} textAlign="center">
            <Spinner size="xl" />
            <Text mt={4} color={textColor}>Loading comparisons...</Text>
          </Box>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <NavigationBar />
        <Box>
          <Box bg="#08004F" py={8} px={6} position="relative">
            <Heading fontWeight="normal" ml={8} color="lightgray" size="lg">
              Manual Differentiation
            </Heading>
          </Box>
          <Box p={8}>
            <Alert status="error">
              <AlertIcon />
              {error}
            </Alert>
          </Box>
        </Box>
      </Box>
    );
  }

  if (!currentVariation) {
    // No more variations left
    return (
      <Box>
        <NavigationBar />
        <Box>
          <Box bg="#08004F" py={8} px={6} position="relative">
            <Heading fontWeight="normal" ml={8} color="lightgray" size="lg">
              Manual Differentiation
            </Heading>
          </Box>
          <Box p={8} textAlign="center">
            <Text fontSize="xl">All variations have been processed.</Text>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <NavigationBar />
      <Box>
        <Box bg="#08004F" py={8} px={6} position="relative">
          <Heading fontWeight="normal" ml={8} color="lightgray" size="lg">
            Manual Differentiation
          </Heading>
        </Box>

        <Box p={8} maxW="800px" mx="auto">
          <VStack spacing={8} align="stretch">
            <Box textAlign="center">
              <Text fontSize="2xl" mb={4} color={textColor}>
                {currentNumber} out of {totalVariations} variations
              </Text>
              <Progress
                value={(currentNumber / totalVariations) * 100}
                size="sm"
                colorScheme="blue"
                borderRadius="full"
              />
            </Box>

            <Box
              borderWidth={1}
              borderColor={boxBorderColor}
              borderRadius="lg"
              p={8}
              bg={boxBg}
              boxShadow="sm"
            >
              <VStack spacing={6} align="stretch">
                <HStack spacing={4} justify="center">
                  <Text fontSize="2xl" fontWeight="medium" color={textColor}>01</Text>
                  <Text fontSize="2xl" fontWeight="medium" color={textColor}>vs.</Text>
                  <Text fontSize="2xl" fontWeight="medium" color={textColor}>
                    {currentVariation.manuscriptSigla}
                  </Text>
                </HStack>

                <Text textAlign="center" fontSize="md" color={textColor}>
                  Verse {currentVariation.verseNumber}, Word {currentVariation.position}
                </Text>

                <VStack spacing={4}>
                  <Box
                    w="100%"
                    p={4}
                    borderWidth={1}
                    borderColor={inputBorderColor}
                    borderRadius="md"
                    textAlign="center"
                    bg={inputBg}
                  >
                    <Text fontSize="xl" color={textColor}>{currentVariation.word1}</Text>
                    <Text fontSize="sm" color={textColor} mt={1}>Manuscript 01</Text>
                  </Box>
                  
                  <Text fontSize="lg" color={textColor}>vs.</Text>
                  
                  <Box
                    w="100%"
                    p={4}
                    borderWidth={1}
                    borderColor={inputBorderColor}
                    borderRadius="md"
                    textAlign="center"
                    bg={inputBg}
                  >
                    <Text fontSize="xl" color={textColor}>{currentVariation.word2}</Text>
                    <Text fontSize="sm" color={textColor} mt={1}>
                      Manuscript {currentVariation.manuscriptSigla}
                    </Text>
                  </Box>
                </VStack>

                <Box>
                  <HStack spacing={0} mb={6}>
                    <Button
                      flex={1}
                      bg={isSignificant ? "green.500" : (settings.theme === 'dark' ? "gray.700" : "gray.200")}
                      color={isSignificant ? "white" : textColor}
                      onClick={() => setIsSignificant(true)}
                      _hover={{
                        bg: isSignificant ? "green.600" : (settings.theme === 'dark' ? "gray.600" : "gray.300")
                      }}
                      borderRightRadius={0}
                      py={6}
                    >
                      Significant
                    </Button>
                    <Button
                      flex={1}
                      bg={!isSignificant ? "gray.500" : (settings.theme === 'dark' ? "gray.700" : "gray.200")}
                      color={!isSignificant ? "white" : textColor}
                      onClick={() => setIsSignificant(false)}
                      _hover={{
                        bg: !isSignificant ? "gray.600" : (settings.theme === 'dark' ? "gray.600" : "gray.300")
                      }}
                      borderLeftRadius={0}
                      py={6}
                    >
                      Insignificant
                    </Button>
                  </HStack>

                  <Box mb={6}>
                    <Text mb={2} color={textColor}>Variation type</Text>
                    <Select
                      value={variationType}
                      onChange={(e) => setVariationType(e.target.value)}
                      size="lg"
                      borderColor={inputBorderColor}
                      bg={inputBg}
                      color={textColor}
                      _hover={{ borderColor: settings.theme === 'dark' ? "gray.400" : "gray.500" }}
                    >
                      {variationTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </Select>
                  </Box>

                  <Flex gap={4} justify="space-between">
                    <Button
                      bg="#B8860B"
                      color="white"
                      _hover={{ bg: "#9A7B0A" }}
                      onClick={handleSkip}
                      size="lg"
                      px={8}
                      isDisabled={isLoading}
                      borderRadius="full"
                    >
                      Skip for later
                    </Button>
                    <Button
                      colorScheme="green"
                      onClick={handleConfirm}
                      size="lg"
                      px={12}
                      isLoading={isLoading}
                      loadingText="Confirming..."
                      borderRadius="full"
                    >
                      Confirm
                    </Button>
                  </Flex>
                </Box>
              </VStack>
            </Box>
          </VStack>
        </Box>
      </Box>
    </Box>
  );
}

export default ManualDifferentiation;
