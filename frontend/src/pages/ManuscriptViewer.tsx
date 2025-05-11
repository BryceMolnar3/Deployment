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
  Input,
  FormControl,
  FormLabel,
  Textarea,
  IconButton,
} from '@chakra-ui/react';
import NavigationBar from '../components/NavigationBar.tsx';
import { useNavigate, useParams } from 'react-router-dom';
import { useDisplaySettings } from '../contexts/DisplaySettingsContext.tsx';
import { DragHandleIcon, EditIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons';

// API base URL - can be configured based on environment
const API_BASE_URL = 'http://localhost:8000';

interface Manuscript {
  _id: string;
  filename: string;  // e.g. "02.docx"
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
  const { sigla } = useParams();  // e.g. "02"
  const { settings } = useDisplaySettings();

  const [manuscript, setManuscript] = useState<Manuscript | null>(null);
  const [editedManuscript, setEditedManuscript] = useState<Manuscript | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  // Modal logic
  const { isOpen, onOpen, onClose } = useDisclosure();            // For image upload
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

  // Verse editing
  const [editingVerseIndex, setEditingVerseIndex] = useState<number | null>(null);
  const [editingVerseText, setEditingVerseText] = useState('');

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Theming
  const boxBg = settings.theme === 'dark' ? 'gray.800' : 'white';
  const textColor = settings.theme === 'dark' ? 'gray.100' : 'gray.900';
  const borderColor = settings.theme === 'dark' ? 'gray.600' : 'gray.300';
  const linkColor = settings.theme === 'dark' ? 'blue.300' : 'blue.600';


  useEffect(() => {
    async function fetchManuscript() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/documents/${sigla}`);
        if (!response.ok) {
          throw new Error('Failed to fetch manuscript dummy dummy');
        }
        const data = await response.json();
        setManuscript(data);
      } catch (err) {
        console.error(err);
      }
    }
  
    if (sigla) {
      fetchManuscript();
    }
  }, [sigla]);


  // 2. Image Upload Logic
  function handleImageClick() {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(evt) {
        if (evt.target?.result) {
          setSelectedImage(evt.target.result as string);
        }
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

      // Add the manuscript data as "document" JSON
      formData.append('document', JSON.stringify({
        ...manuscript,
        image_filename: 'manuscript_image.jpg',
      }));

      // PUT /api/documents/:filename/update
      // e.g. if manuscript.filename = "02.docx"
      const uploadResponse = await fetch(
        `${API_BASE_URL}/api/documents/${manuscript.filename}/update`,
        {
          method: 'PUT',
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
    } catch (err: any) {
      toast({
        title: 'Error uploading image',
        description: err.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUploading(false);
    }
  }

  // 3. Edit Manuscript Logic
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

  // 4. Verse Drag & Drop
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

    // Re-number them
    const updatedVerses = verses.map((v, i) => ({
      ...v,
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

  // 5. Verse CRUD
  const handleAddVerse = () => {
    if (!editedManuscript) return;
    const verseText = prompt('Enter the verse text:');
    if (!verseText || !verseText.trim()) return;

    const newVerses = [...editedManuscript.verses];
    const lastNum = newVerses.length ? newVerses[newVerses.length - 1].verse_number : 0;

    newVerses.push({
      verse_number: lastNum + 1,
      verse_text: verseText.trim(),
    });

    setEditedManuscript({
      ...editedManuscript,
      verses: newVerses,
    });
  };

  const handleRemoveVerse = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (!editedManuscript) return;

    const updated = editedManuscript.verses
      .filter((_, i) => i !== index)
      .map((v, i) => ({ ...v, verse_number: i + 1 }));

    setEditedManuscript({
      ...editedManuscript,
      verses: updated,
    });
  };

  // 6. Verse Inline Editing
  const startEditingVerse = (index: number) => {
    setEditingVerseIndex(index);
    setEditingVerseText(editedManuscript?.verses[index].verse_text || '');
  };

  const cancelEditingVerse = () => {
    setEditingVerseIndex(null);
    setEditingVerseText('');
  };

  const saveVerseEdit = () => {
    if (!editedManuscript || editingVerseIndex === null) return;
    const updated = [...editedManuscript.verses];
    updated[editingVerseIndex].verse_text = editingVerseText.trim();

    setEditedManuscript({
      ...editedManuscript,
      verses: updated,
    });
    setEditingVerseIndex(null);
    setEditingVerseText('');
  };

  // 7. Save Manuscript Edits
  const handleSave = async () => {
    if (!editedManuscript) return;

    try {
      setIsSaving(true);

      // PUT /api/documents/:filename/update-manuscript
      const response = await fetch(
        `${API_BASE_URL}/api/documents/${editedManuscript.filename}/update-manuscript`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
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
    } catch (err: any) {
      toast({
        title: 'Error updating manuscript',
        description: err.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 8. Delete Manuscript
  const handleDelete = async () => {
    if (!manuscript) return;

    try {
      setIsDeleting(true);

      // DELETE /api/documents/:filename/delete
      const response = await fetch(
        `${API_BASE_URL}/api/documents/${manuscript.filename}/delete`,
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

      navigate('/search-database');
    } catch (err: any) {
      toast({
        title: 'Error deleting manuscript',
        description: err.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
      onDeleteClose();
    }
  };

  // 9. Loading/Errors
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

  // 10. Main Render
  return (
    <Box>
      <NavigationBar />
      <Box>
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

        <Box ml={8} p={6}>
          <Flex gap={12}>
            {/* Left Column: Metadata + Verses */}
            <Box flex={2} maxW="65%">
              <Flex mb={6}>
                <Text fontSize="lg" fontWeight="normal" w="180px" color={textColor}>
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
                  <Text fontSize="lg" fontWeight="normal" w="180px" color={textColor}>
                    Other Names:
                  </Text>
                  <Text fontSize="lg" fontWeight="normal" color={textColor}>
                    <u>{manuscript.metadata['Other Names:']}</u>
                  </Text>
                </Flex>
                <Flex>
                  <Text fontSize="lg" fontWeight="normal" w="180px" color={textColor}>
                    Total Folia:
                  </Text>
                  <Text fontSize="lg" fontWeight="normal" color={textColor}>
                    <u>{manuscript.metadata['Total Folia:']}</u>
                  </Text>
                </Flex>
                <Flex>
                  <Text fontSize="lg" fontWeight="normal" w="180px" color={textColor}>
                    Laod. Folia:
                  </Text>
                  <Text fontSize="lg" fontWeight="normal" color={textColor}>
                    <u>{manuscript.metadata['Laod Folia:']}</u>
                  </Text>
                </Flex>
                <Flex>
                  <Text fontSize="lg" fontWeight="normal" w="180px" color={textColor}>
                    Dimensions:
                  </Text>
                  <Text fontSize="lg" fontWeight="normal" color={textColor}>
                    <u>{manuscript.metadata['Dimensions:']}</u>
                  </Text>
                </Flex>
                <Flex>
                  <Text fontSize="lg" fontWeight="normal" w="180px" color={textColor}>
                    Place of Origin:
                  </Text>
                  <Text fontSize="lg" fontWeight="normal" color={textColor}>
                    <u>{manuscript.metadata['Origin:']}</u>
                  </Text>
                </Flex>
                <Flex>
                  <Text fontSize="lg" fontWeight="normal" w="180px" color={textColor}>
                    Materials:
                  </Text>
                  <Text fontSize="lg" fontWeight="normal" color={textColor}>
                    <u>{manuscript.metadata['Materials:']}</u>
                  </Text>
                </Flex>
              </VStack>

              <Flex mt={4} mb={4}>
                <Text fontSize="lg" fontWeight="normal" w="180px" color={textColor}>
                  Format Description:
                </Text>
                <Text fontSize="lg" fontWeight="normal" flex={1} color={textColor}>
                  <u>{manuscript.metadata['Format Description:']}</u>
                </Text>
                <Text fontSize="lg" fontWeight="normal" ml={8} color={textColor}>
                  Date: <u>{manuscript.metadata['Date:']}</u>
                </Text>
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
            </Box>

            {/* Right Column: Image */}
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
                    onChange={(e) => handleInputChange('MS ID:', e.target.value)}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Other Names</FormLabel>
                  <Input
                    value={editedManuscript.metadata['Other Names:']}
                    onChange={(e) => handleInputChange('Other Names:', e.target.value)}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Date</FormLabel>
                  <Input
                    value={editedManuscript.metadata['Date:']}
                    onChange={(e) => handleInputChange('Date:', e.target.value)}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Place of Origin</FormLabel>
                  <Input
                    value={editedManuscript.metadata['Origin:']}
                    onChange={(e) => handleInputChange('Origin:', e.target.value)}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Materials</FormLabel>
                  <Input
                    value={editedManuscript.metadata['Materials:']}
                    onChange={(e) => handleInputChange('Materials:', e.target.value)}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Format Description</FormLabel>
                  <Textarea
                    value={editedManuscript.metadata['Format Description:']}
                    onChange={(e) => handleInputChange('Format Description:', e.target.value)}
                  />
                </FormControl>

                {/* Verses Section */}
                <Box width="100%" mt={4}>
                  <Flex justify="space-between" align="center" mb={4}>
                    <Heading size="md">Verses</Heading>
                    <Button size="sm" colorScheme="blue" onClick={handleAddVerse}>
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
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={(e) => handleDrop(e, index)}
                        cursor={editingVerseIndex === index ? 'default' : 'grab'}
                        transition="all 0.2s"
                        _hover={{ bg: 'gray.50' }}
                        style={getVerseStyle(index)}
                      >
                        <Flex justify="space-between" align="center">
                          <Flex align="center" flex={1}>
                            <Box mr={3} cursor={editingVerseIndex === index ? 'default' : 'grab'}>
                              <DragHandleIcon />
                            </Box>
                            {editingVerseIndex === index ? (
                              <Flex flex={1} align="center">
                                <Textarea
                                  value={editingVerseText}
                                  onChange={(e) => setEditingVerseText(e.target.value)}
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
                                <Text flex={1} whiteSpace="pre-wrap" wordBreak="break-word">
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
                                    onClick={(e) => handleRemoveVerse(e, index)}
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
              Are you sure you want to delete this manuscript? This action cannot be undone.
            </Text>
            <Text mt={2} fontWeight="bold">
              Manuscript: {manuscript?.filename.replace('.docx', '')}
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
