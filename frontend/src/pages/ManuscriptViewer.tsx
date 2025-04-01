import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Flex, 
  Heading, 
  Text, 
  Image, 
  VStack, 
  Spinner, 
  useToast,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react';
import NavigationBar from '../components/NavigationBar.tsx';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useDisplaySettings } from '../contexts/DisplaySettingsContext.tsx';

// API base URL - can be configured based on environment
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

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
    'Laod Folia:': string;
    'Format Description:': string;
  };
  verses: {
    verse_number: number;
    verse_text: string;
  }[];
  image_filename?: string;
}

function ManuscriptViewer() {
  const navigate = useNavigate();
  const { sigla } = useParams();
  const { settings } = useDisplaySettings();
  const [manuscript, setManuscript] = useState<Manuscript | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Theme-based colors
  const boxBg = settings.theme === 'dark' ? 'gray.800' : 'white';
  const textColor = settings.theme === 'dark' ? 'gray.100' : 'gray.900';
  const borderColor = settings.theme === 'dark' ? 'gray.600' : 'gray.300';
  const linkColor = settings.theme === 'dark' ? 'blue.300' : 'blue.600';

  useEffect(() => {
    async function fetchManuscript() {
      if (!sigla) return;
      
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`${API_BASE_URL}/api/documents/${sigla}.docx`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch manuscript');
        }

        const data = await response.json();
        // Transform verses from array of tuples to array of objects
        const transformedData = {
          ...data,
          verses: data.verses.map(([number, text]: [string, string]) => ({
            verse_number: parseInt(number),
            verse_text: text
          }))
        };
        setManuscript(transformedData);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An error occurred';
        setError(errorMessage);
        toast({
          title: 'Error loading manuscript',
          description: errorMessage,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchManuscript();
  }, [sigla, toast]);

  function handleImageClick() {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleImageUpload() {
    if (!selectedImage || !manuscript) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      
      // Convert base64 to blob
      const response = await fetch(selectedImage);
      const blob = await response.blob();
      formData.append('image', blob, 'manuscript_image.jpg');

      // Add the manuscript data
      formData.append('document', JSON.stringify({
        ...manuscript,
        image_filename: 'manuscript_image.jpg'
      }));

      const uploadResponse = await fetch(`${API_BASE_URL}/api/documents/${manuscript.filename}/update`, {
        method: 'PUT',
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }

      const updatedManuscript = await uploadResponse.json();
      setManuscript(updatedManuscript);
      onClose();

      toast({
        title: 'Image uploaded successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error uploading image',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUploading(false);
    }
  }

  if (isLoading) {
    return (
      <Box>
        <NavigationBar />
        <Flex justify="center" align="center" height="calc(100vh - 100px)">
          <Spinner size="xl" />
        </Flex>
      </Box>
    );
  }

  if (error || !manuscript) {
    return (
      <Box>
        <NavigationBar />
        <Box p={8}>
          <Text color="red.500">{error || 'Manuscript not found'}</Text>
        </Box>
      </Box>
    );
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
                <Text fontSize="lg" fontWeight="normal" flex={1} color={textColor}><u>{manuscript.metadata['MS ID:']}</u></Text>
                <Text fontSize="lg" fontWeight="normal" ml={8} color={textColor}>Sigla: <u>{manuscript.filename.replace('.docx', '')}</u></Text>
              </Flex>
              
              <VStack spacing={4} align="stretch">
                <Flex>
                  <Text fontSize="lg" fontWeight="normal" w="180px" color={textColor}>Other Names:</Text>
                  <Text fontSize="lg" fontWeight="normal" color={textColor}><u>{manuscript.metadata['Other Names:']}</u></Text>
                </Flex>
                <Flex>
                  <Text fontSize="lg" fontWeight="normal" w="180px" color={textColor}>Total Folia:</Text>
                  <Text fontSize="lg" fontWeight="normal" color={textColor}><u>{manuscript.metadata['Total Folia:']}</u></Text>
                </Flex>
                <Flex>
                  <Text fontSize="lg" fontWeight="normal" w="180px" color={textColor}>Laod. Folia:</Text>
                  <Text fontSize="lg" fontWeight="normal" color={textColor}><u>{manuscript.metadata['Laod Folia:']}</u></Text>
                </Flex>
                <Flex>
                  <Text fontSize="lg" fontWeight="normal" w="180px" color={textColor}>Dimensions:</Text>
                  <Text fontSize="lg" fontWeight="normal" color={textColor}><u>{manuscript.metadata['Dimensions:']}</u></Text>
                </Flex>
                <Flex>
                  <Text fontSize="lg" fontWeight="normal" w="180px" color={textColor}>Place of Origin:</Text>
                  <Text fontSize="lg" fontWeight="normal" color={textColor}><u>{manuscript.metadata['Origin:']}</u></Text>
                </Flex>
                <Flex>
                  <Text fontSize="lg" fontWeight="normal" w="180px" color={textColor}>Materials:</Text>
                  <Text fontSize="lg" fontWeight="normal" color={textColor}><u>{manuscript.metadata['Materials:']}</u></Text>
                </Flex>
              </VStack>

              <Flex mt={4} mb={4}>
                <Text fontSize="lg" fontWeight="normal" w="180px" color={textColor}>Format Description:</Text>
                <Text fontSize="lg" fontWeight="normal" flex={1} color={textColor}><u>{manuscript.metadata['Format Description:']}</u></Text>
                <Text fontSize="lg" fontWeight="normal" ml={8} color={textColor}>Date: <u>{manuscript.metadata['Date:']}</u></Text>
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
                <VStack spacing={2} align="stretch">
                  {manuscript.verses.map((verse, index) => (
                    <Box key={`${verse.verse_number}-${index}`}>
                      <Text color={textColor} display="inline">
                        <Text
                          as="span" 
                          cursor="pointer"
                          color={linkColor}
                          _hover={{ textDecoration: 'underline' }}
                          onClick={() => {
                            navigate(`/verse/${verse.verse_number}`, {
                              state: { 
                                verseNumber: verse.verse_number,
                                verseText: verse.verse_text
                              }
                            });
                          }}
                        >
                          <sup>{verse.verse_number}</sup>
                        </Text>
                        {' '}{verse.verse_text}
                      </Text>
                    </Box>
                  ))}
                </VStack>
              </Box>
            </Box>

            <Box flex={1} display="flex" justifyContent="flex-start">
              {manuscript.image_filename ? (
                <Image 
                  src={`${API_BASE_URL}/media/${manuscript.image_filename}`}
                  alt={`${manuscript.metadata['Other Names:']} manuscript page`}
                  maxH="900px"
                  objectFit="contain"
                />
              ) : (
                <Box 
                  border="2px dashed" 
                  borderColor="gray.400" 
                  borderRadius="md"
                  height="300px"
                  width="100%"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  bg="gray.100"
                  cursor="pointer"
                  _hover={{ bg: "gray.200" }}
                  onClick={onOpen}
                >
                  <VStack spacing={2}>
                    <Text color="gray.500" fontSize="lg">No image available</Text>
                    <Text color="gray.400" fontSize="sm">Click to upload an image</Text>
                  </VStack>
                </Box>
              )}
            </Box>
          </Flex>
        </Box>
      </Box>

      {/* Image Upload Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Upload Manuscript Image</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              style={{ display: 'none' }}
            />
            <Box 
              border="2px dashed" 
              borderColor="gray.400" 
              borderRadius="md"
              height="300px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              bg="gray.100"
              cursor="pointer"
              _hover={{ bg: "gray.200" }}
              onClick={handleImageClick}
              position="relative"
              overflow="hidden"
              mb={4}
            >
              {selectedImage ? (
                <Image
                  src={selectedImage}
                  alt="Selected manuscript"
                  objectFit="contain"
                  maxH="100%"
                  maxW="100%"
                />
              ) : (
                <VStack spacing={2}>
                  <Text color="gray.500" fontSize="lg">Upload image</Text>
                  <Text color="gray.400" fontSize="sm">Click to select a file</Text>
                </VStack>
              )}
            </Box>
            <Button
              colorScheme="blue"
              mr={3}
              onClick={handleImageUpload}
              isLoading={isUploading}
              width="100%"
              isDisabled={!selectedImage}
            >
              Upload Image
            </Button>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default ManuscriptViewer; 