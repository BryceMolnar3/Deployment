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
import NavigationBar from '../components/NavigationBar';
import { useDisplaySettings } from '../contexts/DisplaySettingsContext';

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
  wordComparison?: WordComparison; 
  timestamp: string;
  manuscriptSigla: string;
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

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

function createComparisonKey(w: WordComparison): string {
  return `${w.verseNumber}-${w.word1}-${w.word2}-${w.position}-${w.manuscriptSigla}`;
}

//
// 1) Edit-Distance alignment
//    Standard dynamic programming for Levenshtein distance, but we also
//    reconstruct an alignment to get two arrays of equal length.
//    Cost = 0 if same word, 1 if mismatch, 1 for insertion, 1 for deletion.
//
function alignWordsByEditDistance(
  baseWords: string[],
  compWords: string[]
): [string[], string[]] {
  const m = baseWords.length;
  const n = compWords.length;

  // dp[i][j] = minimum edit distance between baseWords[:i] and compWords[:j]
  // We'll store cost plus the "move" we made to reconstruct
  const dp = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );
  const move = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill('')
  );

  // Initialize
  // dp[i][0] = i (delete i times)
  // dp[0][j] = j (insert j times)
  for (let i = 1; i <= m; i++) {
    dp[i][0] = i;
    move[i][0] = 'D'; // Deletion
  }
  for (let j = 1; j <= n; j++) {
    dp[0][j] = j;
    move[0][j] = 'I'; // Insertion
  }

  // Fill dp table
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (baseWords[i - 1] === compWords[j - 1]) {
        // match => no additional cost
        dp[i][j] = dp[i - 1][j - 1];
        move[i][j] = 'M'; // match
      } else {
        // substitution cost = 1
        const subCost = dp[i - 1][j - 1] + 1;
        // insertion cost = 1 (compWords[j-1] inserted)
        const insCost = dp[i][j - 1] + 1;
        // deletion cost = 1 (baseWords[i-1] deleted)
        const delCost = dp[i - 1][j] + 1;

        const minCost = Math.min(subCost, insCost, delCost);
        dp[i][j] = minCost;
        if (minCost === subCost) {
          move[i][j] = 'S'; // substitution
        } else if (minCost === insCost) {
          move[i][j] = 'I'; // insertion
        } else {
          move[i][j] = 'D'; // deletion
        }
      }
    }
  }

  // Reconstruct alignment
  const alignedBase: string[] = [];
  const alignedComp: string[] = [];

  let i = m, j = n;
  while (i > 0 || j > 0) {
    const mv = move[i][j];
    if (mv === 'M') {
      // match
      alignedBase.unshift(baseWords[i - 1]);
      alignedComp.unshift(compWords[j - 1]);
      i--;
      j--;
    } else if (mv === 'S') {
      // substitution
      alignedBase.unshift(baseWords[i - 1]);
      alignedComp.unshift(compWords[j - 1]);
      i--;
      j--;
    } else if (mv === 'I') {
      // insertion => means compWords[j-1] was inserted
      alignedBase.unshift('[missing]');
      alignedComp.unshift(compWords[j - 1]);
      j--;
    } else if (mv === 'D') {
      // deletion => means baseWords[i-1] was deleted
      alignedBase.unshift(baseWords[i - 1]);
      alignedComp.unshift('[missing]');
      i--;
    } else {
      // If we have no move label, it might be the boundary case
      if (i > 0 && j > 0) {
        alignedBase.unshift(baseWords[i - 1]);
        alignedComp.unshift(compWords[j - 1]);
        i--;
        j--;
      } else if (i > 0) {
        alignedBase.unshift(baseWords[i - 1]);
        alignedComp.unshift('[missing]');
        i--;
      } else {
        alignedBase.unshift('[missing]');
        alignedComp.unshift(compWords[j - 1]);
        j--;
      }
    }
  }

  return [alignedBase, alignedComp];
}

//
// 2) Generate WordComparisons by aligning each verse with the minimal-edit alignment
//
function generateWordComparisons(
  baseManuscript: Manuscript,
  comparisonManuscript: Manuscript
): WordComparison[] {
  const comparisons: WordComparison[] = [];

  baseManuscript.verses.forEach((baseVerse) => {
    const compVerse = comparisonManuscript.verses.find(
      (v) => v.verse_number === baseVerse.verse_number
    );
    if (!compVerse) return;

    // Normalize
    const baseWords = baseVerse.verse_text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[.,();`'']/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 0);

    const compWords = compVerse.verse_text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[.,();`'']/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 0);

    // Use edit-distance alignment
    const [alignedBase, alignedComp] = alignWordsByEditDistance(
      baseWords,
      compWords
    );

    // Compare aligned
    for (let i = 0; i < alignedBase.length; i++) {
      const w1 = alignedBase[i];
      const w2 = alignedComp[i];
      if (w1 !== w2) {
        comparisons.push({
          verseNumber: baseVerse.verse_number,
          word1: w1,
          word2: w2,
          position: i + 1,
          manuscriptSigla: comparisonManuscript.filename.replace('.docx', ''),
        });
      }
    }
  });

  return comparisons;
}

const defaultVariationTypes = [
  'Different Spelling',
  'Abbreviation',
  'Word Choice',
  'Word Order',
  'Addition',
  'Omission',
];

//
// The service object that fetches comparisons
//
const manuscriptService = {
  async fetchComparisons(): Promise<WordComparison[]> {
    const res = await fetch(`${API_BASE_URL}/api/documents/`);
    if (!res.ok) {
      throw new Error('Failed to fetch manuscripts');
    }
    const allManuscripts: Manuscript[] = await res.json();

    // Base = '1.docx'
    const baseManuscript = allManuscripts.find(
      (m) => m.filename === '1.docx'
    );
    if (!baseManuscript) {
      throw new Error(`Base manuscript (1.docx) not found`);
    }

    const allComparisons: WordComparison[] = [];
    for (const ms of allManuscripts) {
      if (ms.filename !== '1.docx') {
        const comps = generateWordComparisons(baseManuscript, ms);
        allComparisons.push(...comps);
      }
    }
    return allComparisons;
  },

  async fetchSavedComparisons(): Promise<ComparisonResult[]> {
    const res = await fetch(`${API_BASE_URL}/api/comparisons/all`);
    if (!res.ok) {
      throw new Error('Failed to fetch saved comparisons');
    }
    return await res.json();
  },

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
// The main React component
//
function ManualDifferentiation() {
  const { settings } = useDisplaySettings();
  const toast = useToast();

  const [variations, setVariations] = useState<WordComparison[]>([]);
  const [savedComparisons, setSavedComparisons] = useState<ComparisonResult[]>([]);
  const [ignoredKeys, setIgnoredKeys] = useState<string[]>([]);
  const [currentDiffKey, setCurrentDiffKey] = useState<string | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [isSignificant, setIsSignificant] = useState(true);
  const [variationType, setVariationType] = useState('Different Spelling');
  const [variationTypes, setVariationTypes] = useState<string[]>(defaultVariationTypes);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Color mode styling
  const boxBg = settings.theme === 'dark' ? 'gray.800' : 'white';
  const boxBorderColor = settings.theme === 'dark' ? 'gray.600' : 'gray.200';
  const textColor = settings.theme === 'dark' ? 'gray.100' : 'gray.600';
  const inputBg = settings.theme === 'dark' ? 'gray.700' : 'gray.50';
  const inputBorderColor = settings.theme === 'dark' ? 'gray.500' : 'gray.300';

  // Variation types from localStorage
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

  // Ignored differences from localStorage
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

  // lastKey from localStorage
  useEffect(() => {
    const storedKey = localStorage.getItem('manualDiff_lastKey');
    if (storedKey) {
      setCurrentDiffKey(storedKey);
    }
  }, []);

  // fetch saved comparisons
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

  // fetch local comparisons (edit-distance-based)
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

  // Filter out saved / ignored
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

  // figure out which variation is "current"
  const currentVariation = useMemo(() => {
    if (!filteredVariations.length) return null;
    if (!currentDiffKey) {
      return filteredVariations[0];
    }
    const found = filteredVariations.find(
      (v) => createComparisonKey(v) === currentDiffKey
    );
    return found || filteredVariations[0];
  }, [filteredVariations, currentDiffKey]);

  // compute counters
  const currentIndex = useMemo(() => {
    if (!currentVariation) return 0;
    return filteredVariations.findIndex(
      (v) => createComparisonKey(v) === createComparisonKey(currentVariation)
    );
  }, [filteredVariations, currentVariation]);
  const totalVariations = filteredVariations.length;
  const currentNumber = currentIndex + 1;
  const progressValue = (currentNumber / totalVariations) * 100;

  // helper: go to next
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
      localStorage.removeItem('manualDiff_lastKey');
      setCurrentDiffKey(null);
    }
  }

  // confirm => save to DB
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

  // skip
  function handleSkip() {
    goToNext();
  }

  // remove => ignore
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

  // Render
  if (isFetchingData) {
    return (
      <Box>
        <NavigationBar />
        <Box bg="#08004F" py={8} px={6}>
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
    );
  }

  if (error) {
    return (
      <Box>
        <NavigationBar />
        <Box bg="#08004F" py={8} px={6}>
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
    );
  }

  if (!currentVariation) {
    return (
      <Box>
        <NavigationBar />
        <Box bg="#08004F" py={8} px={6}>
          <Heading fontWeight="normal" ml={8} color="lightgray" size="lg">
            Manual Differentiation
          </Heading>
        </Box>
        <Box p={8} textAlign="center">
          <Text fontSize="xl">All variations have been processed or removed.</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <NavigationBar />
      <Box bg="#08004F" py={8} px={6}>
        <Heading fontWeight="normal" ml={8} color="lightgray" size="lg">
          Manual Differentiation
        </Heading>
      </Box>

      <Box p={8} maxW="800px" mx="auto">
        <VStack spacing={8} align="stretch">
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
                      borderColor:
                        settings.theme === 'dark' ? 'gray.400' : 'gray.500',
                    }}
                  >
                    {variationTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </Select>
                </Box>

                <Flex gap={4} justify="space-between" wrap="wrap">
                  <Button
                    bg="#B8860B"
                    color="white"
                    _hover={{ bg: '#9A7B0A' }}
                    onClick={handleSkip}
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
                    onClick={handleRemove}
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
  );
}

export default ManualDifferentiation;
