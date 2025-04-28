import React, { useState, useEffect, useMemo } from 'react';
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

//
// -- Types for API responses and requests --
//
interface WordComparison {
  verseNumber: number;
  word1: string;
  word2: string;
  position: number;
  manuscriptSigla: string;
}

interface ComparisonResult {
  comparisonId: string;  // ID assigned when saving
  isSignificant: boolean;
  variationType: string;
  wordComparison?: WordComparison; 
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

// Base URL to your backend
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

//
// Helper to generate a unique key for each difference
//
function createComparisonKey(w: WordComparison): string {
  return `${w.verseNumber}-${w.word1}-${w.word2}-${w.position}-${w.manuscriptSigla}`;
}

//
// A small service object to fetch manuscripts, comparisons, etc.
//
const manuscriptService = {
  //
  // 1) Fetch the manuscripts, find '3.docx' as "base" manuscript,
  //    generate comparisons with all others except '01.docx'
  //    (based on your example).
  //
  async fetchComparisons(): Promise<WordComparison[]> {
    const res = await fetch(`${API_BASE_URL}/api/documents/`);
    if (!res.ok) {
      throw new Error('Failed to fetch manuscripts');
    }
    const allManuscripts: Manuscript[] = await res.json();

    // Find the base manuscript with filename '3.docx'
    const baseManuscript = allManuscripts.find(
      (m) => m.filename === '3.docx'
    );
    if (!baseManuscript) {
      throw new Error(`Base manuscript (3.docx) not found in /api/documents/`);
    }

    // Generate comparisons with all other manuscripts except "01.docx"
    const allComparisons: WordComparison[] = [];
    for (const manuscript of allManuscripts) {
      if (manuscript.filename !== '01.docx') {
        const comps = generateWordComparisons(baseManuscript, manuscript);
        allComparisons.push(...comps);
      }
    }
    return allComparisons;
  },

  //
  // 2) Fetch saved comparisons from /api/comparisons/all
  //
  async fetchSavedComparisons(): Promise<ComparisonResult[]> {
    const res = await fetch(`${API_BASE_URL}/api/comparisons/all`);
    if (!res.ok) {
      throw new Error('Failed to fetch saved comparisons');
    }
    const data = await res.json();
    return data;
  },

  //
  // 3) POST a new comparison to /api/comparisons/
  //
  async saveComparison(data: {
    wordComparison: WordComparison;
    isSignificant: boolean;
    variationType: string;
  }): Promise<ComparisonResult> {
    const res = await fetch(`${API_BASE_URL}/api/comparisons/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error('Failed to save comparison');
    }
    return await res.json();
  },
};

//
// The local function that does a verse-by-verse, word-by-word comparison
// between baseManuscript and comparisonManuscript
//
function generateWordComparisons(baseManuscript: Manuscript, comparisonManuscript: Manuscript): WordComparison[] {
  const comparisons: WordComparison[] = [];

  // For each verse in base
  baseManuscript.verses.forEach((baseVerse) => {
    const comparisonVerse = comparisonManuscript.verses.find(
      (v) => v.verse_number === baseVerse.verse_number
    );
    if (!comparisonVerse) {
      return; // no matching verse => skip
    }

    // Normalize text, strip punctuation, etc.
    const baseWords = baseVerse.verse_text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[.,()]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 0);

    const comparisonWords = comparisonVerse.verse_text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[.,()]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 0);

    const maxLength = Math.max(baseWords.length, comparisonWords.length);
    for (let i = 0; i < maxLength; i++) {
      const word1 = baseWords[i] || '[missing]';
      const word2 = comparisonWords[i] || '[missing]';
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

//
// Variation Types
//
const defaultVariationTypes = [
  'Different Spelling',
  'Abbreviation',
  'Word Choice',
  'Word Order',
  'Addition',
  'Omission',
];

//
// The main component
//
function ManualDifferentiation() {
  const { settings } = useDisplaySettings();
  const toast = useToast();

  // All differences (before filtering)
  const [variations, setVariations] = useState<WordComparison[]>([]);
  // Already-saved comparisons from DB
  const [savedComparisons, setSavedComparisons] = useState<ComparisonResult[]>([]);
  // Ignored difference keys
  const [ignoredKeys, setIgnoredKeys] = useState<string[]>([]);

  // The difference currently being viewed: we track by a "key"
  const [currentDiffKey, setCurrentDiffKey] = useState<string | null>(null);

  // Some counters/displays
  const [completedCount, setCompletedCount] = useState(0);

  // For "Significant?" toggle
  const [isSignificant, setIsSignificant] = useState(true);
  const [variationType, setVariationType] = useState('Different Spelling');

  // Variation type list (from localStorage or default)
  const [variationTypes, setVariationTypes] = useState<string[]>(defaultVariationTypes);

  // Loading/spinner states
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  //
  // Color mode
  //
  const boxBg = settings.theme === 'dark' ? 'gray.800' : 'white';
  const boxBorderColor = settings.theme === 'dark' ? 'gray.600' : 'gray.200';
  const textColor = settings.theme === 'dark' ? 'gray.100' : 'gray.600';
  const inputBg = settings.theme === 'dark' ? 'gray.700' : 'gray.50';
  const inputBorderColor = settings.theme === 'dark' ? 'gray.500' : 'gray.300';

  // ---------------------------
  // 1) Load variation types from localStorage
  // ---------------------------
  useEffect(() => {
    const savedTypes = localStorage.getItem('variationTypes');
    if (savedTypes) {
      try {
        const typeArr = JSON.parse(savedTypes);
        setVariationTypes(typeArr);
        if (!typeArr.includes(variationType)) {
          setVariationType(typeArr[0]);
        }
      } catch (e) {
        console.error('Error loading variation types:', e);
      }
    }
  }, [variationType]);

  // ---------------------------
  // 2) Load ignored differences from localStorage
  // ---------------------------
  useEffect(() => {
    const storedIgnored = localStorage.getItem('ignoredDifferences');
    if (storedIgnored) {
      try {
        setIgnoredKeys(JSON.parse(storedIgnored));
      } catch (e) {
        console.error('Error loading ignored differences:', e);
      }
    }
  }, []);
  useEffect(() => {
    localStorage.setItem('ignoredDifferences', JSON.stringify(ignoredKeys));
  }, [ignoredKeys]);

  // ---------------------------
  // 3) Load the currentDiffKey from localStorage
  // ---------------------------
  useEffect(() => {
    const storedKey = localStorage.getItem('manualDiff_lastKey');
    if (storedKey) {
      setCurrentDiffKey(storedKey);
    }
  }, []);

  // ---------------------------
  // 4) Fetch saved comparisons from DB
  // ---------------------------
  useEffect(() => {
    (async () => {
      try {
        const data = await manuscriptService.fetchSavedComparisons();
        setSavedComparisons(data);
      } catch (err) {
        console.error('Error fetching saved comparisons:', err);
      }
    })();
  }, []);

  // ---------------------------
  // 5) Fetch new differences (local generation)
  // ---------------------------
  useEffect(() => {
    (async () => {
      try {
        setIsFetchingData(true);
        setError(null);

        const rawVariations = await manuscriptService.fetchComparisons();
        setVariations(rawVariations);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error fetching comparisons';
        setError(msg);
        toast({
          title: 'Error fetching comparisons',
          description: msg,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsFetchingData(false);
      }
    })();
  }, [toast]);

  // ---------------------------
  // 6) Filter out saved/ignored
  // ---------------------------
  const filteredVariations = useMemo(() => {
    const savedKeys = new Set<string>(
      savedComparisons
        .filter((c) => c.wordComparison)
        .map((c) => createComparisonKey(c.wordComparison!))
    );
    return variations.filter(
      (v) =>
        !savedKeys.has(createComparisonKey(v)) &&
        !ignoredKeys.includes(createComparisonKey(v))
    );
  }, [variations, savedComparisons, ignoredKeys]);

  // ---------------------------
  // 7) Figure out which difference is "current" by currentDiffKey
  //    If we have none or can't find it, default to the first in array
  // ---------------------------
  const currentVariation = useMemo(() => {
    if (!filteredVariations.length) return null;
    if (!currentDiffKey) {
      // If we haven't set a key yet, pick the first difference
      return filteredVariations[0];
    }
    const found = filteredVariations.find(
      (v) => createComparisonKey(v) === currentDiffKey
    );
    return found || filteredVariations[0];
  }, [filteredVariations, currentDiffKey]);

  // We'll compute an index for display
  const currentIndex = useMemo(() => {
    if (!currentVariation) return 0;
    return filteredVariations.findIndex(
      (v) => createComparisonKey(v) === createComparisonKey(currentVariation)
    );
  }, [filteredVariations, currentVariation]);
  const totalVariations = filteredVariations.length;
  const currentNumber = currentIndex + 1;

  // Helper: store "next" difference's key in localStorage
  function goToNext() {
    if (!currentVariation) return;
    const idx = filteredVariations.findIndex(
      (v) => createComparisonKey(v) === createComparisonKey(currentVariation)
    );
    const nextIndex = idx + 1;
    if (nextIndex < filteredVariations.length) {
      const nextDiff = filteredVariations[nextIndex];
      const nextKey = createComparisonKey(nextDiff);
      localStorage.setItem('manualDiff_lastKey', nextKey);
      setCurrentDiffKey(nextKey);
    } else {
      // none left => remove key from localStorage
      localStorage.removeItem('manualDiff_lastKey');
      setCurrentDiffKey(null);
    }
  }

  // ---------------------------
  // 8) Confirm => save
  // ---------------------------
  async function handleConfirm() {
    if (!currentVariation) return;
    try {
      setIsLoading(true);
      setError(null);

      const result = await manuscriptService.saveComparison({
        wordComparison: currentVariation,
        isSignificant,
        variationType,
      });

      setCompletedCount((prev) => prev + 1);

      toast({
        title: 'Variation recorded',
        description: `Comparison saved with ID: ${result.comparisonId}`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      });

      goToNext();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save comparison';
      setError(msg);
      toast({
        title: 'Error recording variation',
        description: msg,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Skip => just goToNext
  function handleSkip() {
    goToNext();
  }

  // Remove => add to ignored, goToNext
  function handleRemove() {
    if (!currentVariation) return;
    const key = createComparisonKey(currentVariation);
    setIgnoredKeys((prev) => [...prev, key]);
    toast({
      title: 'Difference removed',
      description: 'It will not appear again in this list.',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
    goToNext();
  }

  // ---------------------------
  // RENDER
  // ---------------------------
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
            <Text mt={4} color={textColor}>
              Loading comparisons...
            </Text>
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

  // If no differences remain
  if (!currentVariation) {
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
            <Text fontSize="xl">
              All variations have been processed or removed.
            </Text>
          </Box>
        </Box>
      </Box>
    );
  }

  const progressValue = (currentNumber / totalVariations) * 100;

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
            {/* Progress Bar */}
            <Box textAlign="center">
              <Text fontSize="2xl" mb={4} color={textColor}>
                {currentNumber} of {totalVariations} variations
              </Text>
              <Progress
                value={progressValue}
                size="sm"
                colorScheme="blue"
                borderRadius="full"
              />
            </Box>

            {/* The difference display */}
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
                  <Text fontSize="2xl" fontWeight="medium" color={textColor}>
                    01
                  </Text>
                  <Text fontSize="2xl" fontWeight="medium" color={textColor}>
                    vs.
                  </Text>
                  <Text fontSize="2xl" fontWeight="medium" color={textColor}>
                    {currentVariation.manuscriptSigla}
                  </Text>
                </HStack>

                <Text textAlign="center" fontSize="md" color={textColor}>
                  Verse {currentVariation.verseNumber}, Word {currentVariation.position}
                </Text>

                {/* The "word1 vs word2" boxes */}
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
                    <Text fontSize="xl" color={textColor}>
                      {currentVariation.word1}
                    </Text>
                    <Text fontSize="sm" color={textColor} mt={1}>
                      Manuscript 01
                    </Text>
                  </Box>

                  <Text fontSize="lg" color={textColor}>
                    vs.
                  </Text>

                  <Box
                    w="100%"
                    p={4}
                    borderWidth={1}
                    borderColor={inputBorderColor}
                    borderRadius="md"
                    textAlign="center"
                    bg={inputBg}
                  >
                    <Text fontSize="xl" color={textColor}>
                      {currentVariation.word2}
                    </Text>
                    <Text fontSize="sm" color={textColor} mt={1}>
                      Manuscript {currentVariation.manuscriptSigla}
                    </Text>
                  </Box>
                </VStack>

                <Box>
                  {/* Significant/Insignificant toggle */}
                  <HStack spacing={0} mb={6}>
                    <Button
                      flex={1}
                      bg={
                        isSignificant
                          ? 'green.500'
                          : settings.theme === 'dark'
                          ? 'gray.700'
                          : 'gray.200'
                      }
                      color={isSignificant ? 'white' : textColor}
                      onClick={() => setIsSignificant(true)}
                      _hover={{
                        bg: isSignificant
                          ? 'green.600'
                          : settings.theme === 'dark'
                          ? 'gray.600'
                          : 'gray.300',
                      }}
                      borderRightRadius={0}
                      py={6}
                    >
                      Significant
                    </Button>
                    <Button
                      flex={1}
                      bg={
                        !isSignificant
                          ? 'gray.500'
                          : settings.theme === 'dark'
                          ? 'gray.700'
                          : 'gray.200'
                      }
                      color={!isSignificant ? 'white' : textColor}
                      onClick={() => setIsSignificant(false)}
                      _hover={{
                        bg: !isSignificant
                          ? 'gray.600'
                          : settings.theme === 'dark'
                          ? 'gray.600'
                          : 'gray.300',
                      }}
                      borderLeftRadius={0}
                      py={6}
                    >
                      Insignificant
                    </Button>
                  </HStack>

                  {/* Variation type dropdown */}
                  <Box mb={6}>
                    <Text mb={2} color={textColor}>
                      Variation type
                    </Text>
                    <Select
                      value={variationType}
                      onChange={(e) => setVariationType(e.target.value)}
                      size="lg"
                      borderColor={inputBorderColor}
                      bg={inputBg}
                      color={textColor}
                      _hover={{
                        borderColor: settings.theme === 'dark' ? 'gray.400' : 'gray.500',
                      }}
                    >
                      {variationTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </Select>
                  </Box>

                  {/* Action buttons */}
                  <Flex gap={4} justify="space-between" wrap="wrap">
                    <Button
                      bg="#B8860B"
                      color="white"
                      _hover={{ bg: '#9A7B0A' }}
                      onClick={() => {
                        // Skip => do not save, just next
                        goToNext();
                      }}
                      size="lg"
                      px={8}
                      isDisabled={isLoading}
                      borderRadius="full"
                    >
                      Skip
                    </Button>
                    <Button
                      variant="outline"
                      colorScheme="red"
                      onClick={() => {
                        // Remove => add to ignored
                        const key = createComparisonKey(currentVariation);
                        setIgnoredKeys((prev) => [...prev, key]);
                        toast({
                          title: 'Difference removed',
                          description: 'It will not appear again in this list.',
                          status: 'info',
                          duration: 2000,
                          isClosable: true,
                        });
                        goToNext();
                      }}
                      size="lg"
                      borderRadius="full"
                    >
                      Remove
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
