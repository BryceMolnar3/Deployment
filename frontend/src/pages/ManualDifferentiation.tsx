import React, { useState } from 'react';
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
  useToast
} from '@chakra-ui/react';
import NavigationBar from '../components/NavigationBar.tsx';

function ManualDifferentiation() {
  const [currentVariation, setCurrentVariation] = useState(6);
  const [totalVariations] = useState(30);
  const [completedVariations, setCompletedVariations] = useState(5);
  const [isSignificant, setIsSignificant] = useState(true);
  const [variationType, setVariationType] = useState('different spelling');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  async function handleConfirm() {
    try {
      setIsLoading(true);
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulated API call

      setCompletedVariations(prev => prev + 1);
      setCurrentVariation(prev => prev + 1);

      toast({
        title: 'Variation recorded',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error recording variation',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }

  function handleSkip() {
    setCurrentVariation(prev => prev + 1);
  }

  return (
    <Box>
      <NavigationBar />
      <Box>
        <Box bg="#08004F" py={8} px={6} position="relative">
          <Heading fontWeight="normal" ml={8} color="lightgray" size="lg">Manual Differentiation</Heading>
        </Box>

        <Box p={8} maxW="800px" mx="auto">
          <VStack spacing={8} align="stretch">
            <Box textAlign="center">
              <Text fontSize="2xl" mb={4}>
                {completedVariations} out of {totalVariations} variations completed
              </Text>
              <Progress 
                value={(completedVariations / totalVariations) * 100} 
                size="sm" 
                colorScheme="blue" 
                borderRadius="full"
              />
            </Box>

            <Box 
              borderWidth={1} 
              borderColor="gray.200" 
              borderRadius="lg" 
              p={8}
              bg="white"
              boxShadow="sm"
            >
              <VStack spacing={6} align="stretch">
                <Text fontSize="2xl" textAlign="center" fontWeight="medium">
                  {currentVariation}.
                </Text>

                <VStack spacing={4}>
                  <Box 
                    w="100%" 
                    p={4} 
                    borderWidth={1} 
                    borderColor="gray.300" 
                    borderRadius="md"
                    textAlign="center"
                  >
                    <Text fontSize="xl">porttitor</Text>
                  </Box>
                  
                  <Text fontSize="lg" color="gray.600">vs.</Text>
                  
                  <Box 
                    w="100%" 
                    p={4} 
                    borderWidth={1} 
                    borderColor="gray.300" 
                    borderRadius="md"
                    textAlign="center"
                  >
                    <Text fontSize="xl">porttita</Text>
                  </Box>
                </VStack>

                <Box>
                  <HStack spacing={0} mb={6}>
                    <Button
                      flex={1}
                      bg={isSignificant ? "green.500" : "gray.200"}
                      color={isSignificant ? "white" : "gray.600"}
                      onClick={() => setIsSignificant(true)}
                      _hover={{ bg: isSignificant ? "green.600" : "gray.300" }}
                      borderRightRadius={0}
                      py={6}
                    >
                      Significant
                    </Button>
                    <Button
                      flex={1}
                      bg={!isSignificant ? "gray.500" : "gray.200"}
                      color={!isSignificant ? "white" : "gray.600"}
                      onClick={() => setIsSignificant(false)}
                      _hover={{ bg: !isSignificant ? "gray.600" : "gray.300" }}
                      borderLeftRadius={0}
                      py={6}
                    >
                      Insignificant
                    </Button>
                  </HStack>

                  <Box mb={6}>
                    <Text mb={2}>Variation type</Text>
                    <Select
                      value={variationType}
                      onChange={(e) => setVariationType(e.target.value)}
                      size="lg"
                      borderColor="gray.400"
                    >
                      <option value="different spelling">different spelling</option>
                      <option value="abbreviation">abbreviation</option>
                      <option value="word choice">word choice</option>
                      <option value="word order">word order</option>
                      <option value="addition">addition</option>
                      <option value="omission">omission</option>
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