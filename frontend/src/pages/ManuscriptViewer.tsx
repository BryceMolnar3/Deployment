import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Input,
  FormControl,
  FormLabel,
  Textarea,
  IconButton,
} from '@chakra-ui/react';
import NavigationBar from '../components/NavigationBar';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useDisplaySettings } from '../contexts/DisplaySettingsContext';
import { DragHandleIcon, EditIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons';

// API base URL - can be configured based on environment
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

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

// Make `word_comparison` optional & do a defensive check
interface WordComparisonData {
  verseNumber: number;
  word1: string;
  word2: string;
  position: number;
  manuscriptSigla: string;
}

interface ComparisonResultData {
  id: number;
  is_significant: boolean;
  variation_type: string;
  timestamp: string;
  word_comparison?: WordComparisonData;
}

function ManuscriptViewer() {
  const navigate = useNavigate();
  const { sigla } = useParams();
  const { settings } = useDisplaySettings();
  const toast = useToast();

  const [manuscript, setManuscript] = useState<Manuscript | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for the comparisons
  const [comparisons, setComparisons] = useState<ComparisonResultData[]>([]);

  // For image uploads
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // For deleting the manuscript
  const [isDeleting, setIsDeleting] = useState(false);

  // Disclosure modals
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

  // For editing the manuscript
  const [editedManuscript, setEditedManuscript] = useState<Manuscript | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Verse drag-and-drop editing
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [editingVerseIndex, setEditingVerseIndex] = useState<number | null>(null);
  const [editingVerseText, setEditingVerseText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const verseHeight = useRef<number>(0);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Editing the image in the Edit Modal
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Theme-based colors
  const boxBg = settings.theme === 'dark' ? 'gray.800' : 'white';
  const textColor = settings.theme === 'dark' ? 'gray.100' : 'gray.900';
  const borderColor = settings.theme === 'dark' ? 'gray.600' : 'gray.300';
  const linkColor = settings.theme === 'dark' ? 'blue.300' : 'blue.600';

  //---------------------------------------------------------------------
  // 1) Fetch all comparisons from the backend (GET /api/comparisons/all)
  //---------------------------------------------------------------------
  useEffect(() => {
    async function fetchComparisons() {
      try {
        setError(null);
        const res = await fetch(`${API_BASE_URL}/comparisons/all`);
        if (!res.ok) {
          throw new Error('Failed to fetch comparisons');
        }
        const data = await res.json();
        setComparisons(data);
      } catch (error) {
        console.error('Error fetching comparisons:', error);
        setError(error instanceof Error ? error.message : 'Could not load comparisons');
      }
    }
    fetchComparisons();
  }, []);

  //---------------------------------------------------------------------
  // 2) Fetch the manuscript data by filename (sigla + .docx)
  //---------------------------------------------------------------------
  useEffect(() => {
    async function fetchManuscript() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/documents/${sigla}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch manuscript');
        }

        // Transform verses to ensure consistent format
        const transformedData = {
          ...data,
          verses: data.verses.map((verse: any) => {
            if (Array.isArray(verse)) {
              return {
                verse_number: parseInt(verse[0], 10),
                verse_text: verse[1],
              };
            }
            return verse;
          }),
        };

        setManuscript(transformedData);
        setEditedManuscript(transformedData);
      } catch (error) {
        console.error('Error fetching manuscript:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch manuscript');
      } finally {
        setIsLoading(false);
      }
    }

    if (sigla) {
      fetchManuscript();
    }
  }, [sigla]);

  //---------------------------------------------------------------------
  // 3) Compute the relevant comparisons for *this* manuscript
  //---------------------------------------------------------------------
  const currentManuscriptSigla = useMemo(() => {
    if (!manuscript) return '';
    return manuscript.filename.replace('.docx', '');
  }, [manuscript]);

  const relevantComparisons = useMemo(() => {
    return comparisons.filter((comp) => {
      const w = comp.word_comparison;
      if (!w) return false; // skip if missing
      return w.manuscriptSigla === currentManuscriptSigla && comp.is_significant;
    });
  }, [comparisons, currentManuscriptSigla]);

  //---------------------------------------------------------------------
  // 4) "Unsave" or "Delete" a saved comparison => 
  //    This calls DELETE /api/comparisons/:id
  //    Then removes it from local state, so it's no longer shown.
  //    Next time you open ManualDifferentiation, that difference 
  //    will appear again in the queue (because it's no longer in DB).
  //---------------------------------------------------------------------
  async function handleUnsaveComparison(compId: number) {
    try {
      const delRes = await fetch(`${API_BASE_URL}/comparisons/${compId}`, {
        method: 'DELETE',
      });
      if (!delRes.ok) {
        const errData = await delRes.json();
        throw new Error(errData.error || 'Failed to delete comparison');
      }
      // remove from local state
      setComparisons((prev) => prev.filter((c) => c.id !== compId));
      toast({
        title: 'Comparison unsaved',
        description: 'It will return to the "unconfirmed" list in Manual Differentiation.',
        status: 'success',
        duration: 2500,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error removing comparison',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  }

  //---------------------------------------------------------------------
  // 5) Image Upload Handling
  //---------------------------------------------------------------------
  function handleImageClick() {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (ev) {
        setSelectedImage(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleImageUpload() {
    if (!selectedImage || !manuscript) return;
    try {
      setIsUploading(true);
      const formData = new FormData();

      const response = await fetch(selectedImage);
      const blob = await response.blob();
      formData.append('image', blob, 'manuscript_image.jpg');

      formData.append(
        'document',
        JSON.stringify({
          ...manuscript,
          image_filename: 'manuscript_image.jpg',
        })
      );

      const uploadResponse = await fetch(
        `${API_BASE_URL}/documents/${manuscript.filename}/update-document`,
        {
          method: 'POST',
          body: formData,
        }
      );

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

  //---------------------------------------------------------------------
  // 6) Editing the manuscript
  //---------------------------------------------------------------------
  const handleEditClick = () => {
    if (manuscript) {
      setEditedManuscript({ ...manuscript });
      onEditOpen();
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (editedManuscript) {
      setEditedManuscript({
        ...editedManuscript,
        metadata: {
          ...editedManuscript.metadata,
          [field]: value,
        },
      });
    }
  };

  //---------------------------------------------------------------------
  // 7) Verse Reordering (Drag & Drop)
  //---------------------------------------------------------------------
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    (e.currentTarget as HTMLDivElement).style.opacity = '0.4';
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    (e.currentTarget as HTMLDivElement).style.opacity = '1';
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || !editedManuscript || draggedIndex === dropIndex) return;

    const verses = [...editedManuscript.verses];
    const [movedVerse] = verses.splice(draggedIndex, 1);
    verses.splice(dropIndex, 0, movedVerse);

    // Recalculate verse_number
    const updatedVerses = verses.map((verse, i) => ({
      ...verse,
      verse_number: i + 1,
    }));

    setEditedManuscript({
      ...editedManuscript,
      verses: updatedVerses,
    });

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const getVerseStyle = (index: number) => {
    if (index === draggedIndex) {
      return { opacity: 0.4 };
    }
    if (index === dragOverIndex) {
      return {
        borderTop: '2px solid #4299E1',
        marginTop: '-1px',
        backgroundColor: '#EBF8FF',
      };
    }
    return {};
  };

  const handleAddVerse = () => {
    if (editedManuscript) {
      const verseText = prompt('Enter the verse text:');
      if (verseText?.trim()) {
        const lastVerseNumber =
          editedManuscript.verses.length > 0
            ? editedManuscript.verses[editedManuscript.verses.length - 1].verse_number
            : 0;

        setEditedManuscript({
          ...editedManuscript,
          verses: [
            ...editedManuscript.verses,
            {
              verse_number: lastVerseNumber + 1,
              verse_text: verseText.trim(),
            },
          ],
        });
      }
    }
  };

  const handleRemoveVerse = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (editedManuscript) {
      const updatedVerses = editedManuscript.verses
        .filter((_, i) => i !== index)
        .map((verse, i) => ({
          ...verse,
          verse_number: i + 1,
        }));

      setEditedManuscript({
        ...editedManuscript,
        verses: updatedVerses,
      });
    }
  };

  //---------------------------------------------------------------------
  // 8) Editing Verse Text
  //---------------------------------------------------------------------
  const startEditingVerse = (index: number) => {
    setEditingVerseIndex(index);
    setEditingVerseText(editedManuscript?.verses[index].verse_text || '');
  };

  const cancelEditingVerse = () => {
    setEditingVerseIndex(null);
    setEditingVerseText('');
  };

  const saveVerseEdit = () => {
    if (editedManuscript && editingVerseIndex !== null) {
      const updatedVerses = [...editedManuscript.verses];
      updatedVerses[editingVerseIndex] = {
        ...updatedVerses[editingVerseIndex],
        verse_text: editingVerseText.trim(),
      };

      setEditedManuscript({
        ...editedManuscript,
        verses: updatedVerses,
      });

      setEditingVerseIndex(null);
      setEditingVerseText('');
    }
  };

  //---------------------------------------------------------------------
  // 9) Saving manuscript changes (PUT or POST)
  //---------------------------------------------------------------------
  const handleSave = async () => {
    if (!editedManuscript) return;
    try {
      setIsSaving(true);
      if (editedImage) {
        // If a new image is selected, upload with FormData
        const formData = new FormData();
        const response = await fetch(editedImage);
        const blob = await response.blob();
        formData.append('image', blob, 'manuscript_image.jpg');
        formData.append('document', JSON.stringify(editedManuscript));

        const uploadResponse = await fetch(
          `${API_BASE_URL}/documents/${editedManuscript.filename}/update-document`,
          {
            method: 'POST',
            body: formData,
          }
        );
        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || 'Failed to update manuscript');
        }
        const updatedManuscript = await uploadResponse.json();
        setManuscript(updatedManuscript);
        onEditClose();
        setEditedImage(null);
        toast({
          title: 'Manuscript updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        window.location.reload();
      } else {
        // No new image, use JSON update
        const response = await fetch(
          `${API_BASE_URL}/documents/${editedManuscript.filename}/update-manuscript`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editedManuscript),
          }
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update manuscript');
        }
        const updatedManuscript = await response.json();
        setManuscript(updatedManuscript);
        onEditClose();
        toast({
          title: 'Manuscript updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        window.location.reload();
      }
    } catch (error) {
      toast({
        title: 'Error updating manuscript',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  //---------------------------------------------------------------------
  // 10) Deleting the manuscript
  //---------------------------------------------------------------------
  const handleDelete = async () => {
    if (!manuscript) return;
    try {
      setIsDeleting(true);
      const response = await fetch(
        `${API_BASE_URL}/documents/${manuscript.filename}/delete`,
        {
          method: 'DELETE',
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete manuscript');
      }
      toast({
        title: 'Manuscript deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      // Navigate back to the search page
      navigate('/search-database');
    } catch (error) {
      toast({
        title: 'Error deleting manuscript',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
      onDeleteClose();
    }
  };

  //---------------------------------------------------------------------
  // RENDER
  //---------------------------------------------------------------------
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
        {/* Header section with "Edit Manuscript" button */}
        <Box bg="#08004F" py={8} px={6}>
          <Flex justify="space-between" align="center">
            <Heading fontWeight="normal" ml={8} color="lightgray" size="lg">
              Manuscript View
            </Heading>
            <Button colorScheme="blue" onClick={handleEditClick}>
              Edit Manuscript
            </Button>
          </Flex>
        </Box>

        {/* Main content */}
        <Box ml={8} p={6}>
          <Flex gap={12}>
            {/* Left side: Manuscript metadata & verses */}
            <Box flex={2} maxW="65%">
              <Flex mb={6}>
                <Text
                  fontSize="lg"
                  fontWeight="normal"
                  w="180px"
                  color={textColor}
                >
                  MS ID:
                </Text>
                <Text fontSize="lg" fontWeight="normal" flex={1} color={textColor}>
                  <u>{manuscript.metadata['MS ID:']}</u>
                </Text>
                <Text fontSize="lg" fontWeight="normal" ml={8} color={textColor}>
                  Sigla: <u>{manuscript.filename.replace('.docx', '')}</u>
                </Text>
              </Flex>

              <VStack spacing={4} align="stretch">
                <Flex>
                  <Text
                    fontSize="lg"
                    fontWeight="normal"
                    w="180px"
                    color={textColor}
                  >
                    Other Names:
                  </Text>
                  <Text fontSize="lg" fontWeight="normal" color={textColor}>
                    <u>{manuscript.metadata['Other Names:']}</u>
                  </Text>
                </Flex>
                <Flex>
                  <Text
                    fontSize="lg"
                    fontWeight="normal"
                    w="180px"
                    color={textColor}
                  >
                    Total Folia:
                  </Text>
                  <Text fontSize="lg" fontWeight="normal" color={textColor}>
                    <u>{manuscript.metadata['Total Folia:']}</u>
                  </Text>
                </Flex>
                <Flex>
                  <Text
                    fontSize="lg"
                    fontWeight="normal"
                    w="180px"
                    color={textColor}
                  >
                    Laod. Folia:
                  </Text>
                  <Text fontSize="lg" fontWeight="normal" color={textColor}>
                    <u>{manuscript.metadata['Laod Folia:']}</u>
                  </Text>
                </Flex>
                <Flex>
                  <Text
                    fontSize="lg"
                    fontWeight="normal"
                    w="180px"
                    color={textColor}
                  >
                    Dimensions:
                  </Text>
                  <Text fontSize="lg" fontWeight="normal" color={textColor}>
                    <u>{manuscript.metadata['Dimensions:']}</u>
                  </Text>
                </Flex>
                <Flex>
                  <Text
                    fontSize="lg"
                    fontWeight="normal"
                    w="180px"
                    color={textColor}
                  >
                    Place of Origin:
                  </Text>
                  <Text fontSize="lg" fontWeight="normal" color={textColor}>
                    <u>{manuscript.metadata['Origin:']}</u>
                  </Text>
                </Flex>
                <Flex>
                  <Text
                    fontSize="lg"
                    fontWeight="normal"
                    w="180px"
                    color={textColor}
                  >
                    Materials:
                  </Text>
                  <Text fontSize="lg" fontWeight="normal" color={textColor}>
                    <u>{manuscript.metadata['Materials:']}</u>
                  </Text>
                </Flex>
              </VStack>

              <Flex mt={4} mb={4}>
                <Text
                  fontSize="lg"
                  fontWeight="normal"
                  w="180px"
                  color={textColor}
                >
                  Format Description:
                </Text>
                <Text fontSize="lg" fontWeight="normal" flex={1} color={textColor}>
                  <u>{manuscript.metadata['Format Description:']}</u>
                </Text>
                <Text fontSize="lg" fontWeight="normal" ml={8} color={textColor}>
                  Date: <u>{manuscript.metadata['Date:']}</u>
                </Text>
              </Flex>

              {/* Verse display */}
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
                                verseText: verse.verse_text,
                              },
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

              {/* NEW SECTION: Relevant Differences for this manuscript */}
              <Box mt={8}>
                <Heading size="md" mb={3} color={textColor}>
                  Relevant Differences for <u>{currentManuscriptSigla}</u>
                </Heading>
                {relevantComparisons.length === 0 ? (
                  <Text color={textColor}>
                    No significant differences recorded for this manuscript.
                  </Text>
                ) : (
                  <VStack spacing={4} align="stretch">
                    {relevantComparisons.map((comp) => {
                      const w = comp.word_comparison;
                      return (
                        <Box
                          key={comp.id}
                          p={3}
                          borderWidth="1px"
                          borderColor={borderColor}
                          borderRadius="md"
                          bg={boxBg}
                        >
                          <Text color={textColor}>
                            <strong>Verse:</strong> {w?.verseNumber}
                          </Text>
                          <Text color={textColor}>
                            <strong>Position:</strong> {w?.position}
                          </Text>
                          <Text color={textColor}>
                            <strong>Word1:</strong> {w?.word1}
                          </Text>
                          <Text color={textColor}>
                            <strong>Word2:</strong> {w?.word2}
                          </Text>
                          <Text color={textColor}>
                            <strong>Variation Type:</strong> {comp.variation_type}
                          </Text>
                          <Text color={textColor}>
                            <strong>Timestamp:</strong> {comp.timestamp}
                          </Text>

                          {/* NEW: "Delete (Unsave)" button */}
                          <Button
                            colorScheme="red"
                            variant="outline"
                            size="sm"
                            mt={3}
                            onClick={async () => {
                              try {
                                // Call DELETE /api/comparisons/:id
                                const delRes = await fetch(
                                  `${API_BASE_URL}/comparisons/${comp.id}`,
                                  { method: 'DELETE' }
                                );
                                if (!delRes.ok) {
                                  const errData = await delRes.json();
                                  throw new Error(errData.error || 'Failed to delete comparison');
                                }
                                // Remove from local state
                                setComparisons((prev) => prev.filter((c) => c.id !== comp.id));
                                
                                toast({
                                  title: 'Comparison unsaved',
                                  description: 'It will return to the "unconfirmed" list in Manual Differentiation.',
                                  status: 'success',
                                  duration: 2500,
                                  isClosable: true,
                                });
                              } catch (err) {
                                toast({
                                  title: 'Error removing comparison',
                                  description: err instanceof Error ? err.message : 'Unknown error',
                                  status: 'error',
                                  duration: 4000,
                                  isClosable: true,
                                });
                              }
                            }}
                          >
                            Delete (Unsave)
                          </Button>
                        </Box>
                      );
                    })}
                  </VStack>
                )}
              </Box>
            </Box>

            {/* Right side: Manuscript image or placeholder */}
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
                  _hover={{ bg: 'gray.200' }}
                  onClick={onOpen}
                >
                  <VStack spacing={2}>
                    <Text color="gray.500" fontSize="lg">
                      No image available
                    </Text>
                    <Text color="gray.400" fontSize="sm">
                      Click to upload an image
                    </Text>
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
              _hover={{ bg: 'gray.200' }}
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
                  <Text color="gray.500" fontSize="lg">
                    Upload image
                  </Text>
                  <Text color="gray.400" fontSize="sm">
                    Click to select a file
                  </Text>
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

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="xl">
        <ModalOverlay />
        <ModalContent maxW="800px">
          <ModalHeader>Edit Manuscript Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {editedManuscript && (
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>MS ID</FormLabel>
                  <Input
                    value={editedManuscript.metadata['MS ID:']}
                    onChange={(e) =>
                      handleInputChange('MS ID:', e.target.value)
                    }
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Other Names</FormLabel>
                  <Input
                    value={editedManuscript.metadata['Other Names:']}
                    onChange={(e) =>
                      handleInputChange('Other Names:', e.target.value)
                    }
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Date</FormLabel>
                  <Input
                    value={editedManuscript.metadata['Date:']}
                    onChange={(e) =>
                      handleInputChange('Date:', e.target.value)
                    }
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Place of Origin</FormLabel>
                  <Input
                    value={editedManuscript.metadata['Origin:']}
                    onChange={(e) =>
                      handleInputChange('Origin:', e.target.value)
                    }
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Materials</FormLabel>
                  <Input
                    value={editedManuscript.metadata['Materials:']}
                    onChange={(e) =>
                      handleInputChange('Materials:', e.target.value)
                    }
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Format Description</FormLabel>
                  <Textarea
                    value={
                      editedManuscript.metadata['Format Description:']
                    }
                    onChange={(e) =>
                      handleInputChange('Format Description:', e.target.value)
                    }
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Manuscript Image</FormLabel>
                  <input
                    type="file"
                    ref={editFileInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = function (ev) {
                          setEditedImage(ev.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                  <Box
                    border="2px dashed"
                    borderColor="gray.400"
                    borderRadius="md"
                    height="200px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    bg="gray.100"
                    cursor="pointer"
                    _hover={{ bg: 'gray.200' }}
                    onClick={() => editFileInputRef.current?.click()}
                    position="relative"
                    overflow="hidden"
                    mb={2}
                  >
                    {editedImage ? (
                      <Image
                        src={editedImage}
                        alt="Selected manuscript"
                        objectFit="contain"
                        maxH="100%"
                        maxW="100%"
                      />
                    ) : (
                      <Image
                        src={
                          editedManuscript.image_filename
                            ? `${API_BASE_URL}/media/${editedManuscript.image_filename}`
                            : ''
                        }
                        alt="Current manuscript"
                        objectFit="contain"
                        maxH="100%"
                        maxW="100%"
                        fallback={
                          <VStack spacing={2}>
                            <Text color="gray.500" fontSize="lg">
                              Upload image
                            </Text>
                            <Text color="gray.400" fontSize="sm">
                              Click to select a file
                            </Text>
                          </VStack>
                        }
                      />
                    )}
                  </Box>
                </FormControl>

                {/* Verses Section */}
                <Box width="100%" mt={4}>
                  <Flex justify="space-between" align="center" mb={4}>
                    <Heading size="md">Verses</Heading>
                    <Button
                      size="sm"
                      colorScheme="blue"
                      onClick={handleAddVerse}
                    >
                      Add Verse
                    </Button>
                  </Flex>
                  <VStack spacing={2} align="stretch" position="relative">
                    {editedManuscript.verses.map((verse, index) => (
                      <Box
                        key={index}
                        p={4}
                        borderWidth="1px"
                        borderRadius="md"
                        bg="white"
                        draggable={editingVerseIndex !== index}
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragEnd={(e) => handleDragEnd(e)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={(e) => handleDrop(e, index)}
                        cursor={
                          editingVerseIndex === index ? 'default' : 'grab'
                        }
                        transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                        _hover={{ bg: 'gray.50' }}
                        style={getVerseStyle(index)}
                      >
                        <Flex justify="space-between" align="center">
                          <Flex align="center" flex={1}>
                            <Box
                              mr={3}
                              cursor={
                                editingVerseIndex === index
                                  ? 'default'
                                  : 'grab'
                              }
                              _active={{ cursor: 'grabbing' }}
                            >
                              <DragHandleIcon />
                            </Box>
                            {editingVerseIndex === index ? (
                              <Flex flex={1} align="center">
                                <Textarea
                                  value={editingVerseText}
                                  onChange={(e) =>
                                    setEditingVerseText(e.target.value)
                                  }
                                  size="sm"
                                  resize="vertical"
                                  mr={2}
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      saveVerseEdit();
                                    } else if (e.key === 'Escape') {
                                      cancelEditingVerse();
                                    }
                                  }}
                                />
                                <IconButton
                                  aria-label="Save verse"
                                  icon={<CheckIcon />}
                                  size="sm"
                                  colorScheme="green"
                                  mr={1}
                                  onClick={saveVerseEdit}
                                />
                                <IconButton
                                  aria-label="Cancel editing"
                                  icon={<CloseIcon />}
                                  size="sm"
                                  onClick={cancelEditingVerse}
                                />
                              </Flex>
                            ) : (
                              <Flex flex={1} align="center">
                                <Text fontWeight="bold" mr={4} flexShrink={0}>
                                  Verse {verse.verse_number}
                                </Text>
                                <Text
                                  flex={1}
                                  whiteSpace="pre-wrap"
                                  wordBreak="break-word"
                                >
                                  {verse.verse_text}
                                </Text>
                                <Box flexShrink={0}>
                                  <IconButton
                                    aria-label="Edit verse"
                                    icon={<EditIcon />}
                                    size="sm"
                                    variant="ghost"
                                    mr={2}
                                    onClick={() => startEditingVerse(index)}
                                  />
                                  <Button
                                    size="sm"
                                    colorScheme="red"
                                    variant="ghost"
                                    onClick={(e) =>
                                      handleRemoveVerse(e, index)
                                    }
                                  >
                                    Remove
                                  </Button>
                                </Box>
                              </Flex>
                            )}
                          </Flex>
                        </Flex>
                      </Box>
                    ))}
                  </VStack>
                </Box>

                <Button
                  colorScheme="blue"
                  onClick={handleSave}
                  isLoading={isSaving}
                  width="100%"
                  mt={4}
                >
                  Save Changes
                </Button>

                <Button
                  colorScheme="red"
                  onClick={onDeleteOpen}
                  width="100%"
                  mt={2}
                >
                  Delete Manuscript
                </Button>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Delete Manuscript</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Text>
              Are you sure you want to delete this manuscript? This action
              cannot be undone.
            </Text>
            <Text mt={2} fontWeight="bold">
              Manuscript:{' '}
              {manuscript?.filename.replace('.docx', '')}
            </Text>

            <Flex mt={4} gap={3}>
              <Button
                colorScheme="red"
                onClick={handleDelete}
                isLoading={isDeleting}
                flex={1}
              >
                Yes, Delete
              </Button>
              <Button onClick={onDeleteClose} flex={1}>
                Cancel
              </Button>
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default ManuscriptViewer;
