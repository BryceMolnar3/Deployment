import React, { useState, useRef } from 'react';
import { 
  Box, 
  Flex, 
  Heading, 
  Text, 
  Input, 
  Textarea, 
  Button,
  VStack,
  HStack,
  Image
} from '@chakra-ui/react';
import NavigationBar from '../components/NavigationBar.tsx';

function NewDataEntry() {
  const [formData, setFormData] = useState({
    ms_id: '',
    sigla: '',
    date: '',
    other_names: '',
    place_of_origin: '',
    total_folia: '',
    dimensions: '',
    materials: '',
    laod_folia: '',
    format_description: '',
    transcription: ''
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFormData(function(prev) {
      return {
        ...prev,
        [name]: value
      };
    });
  }

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

  function handleClear() {
    setFormData({
      ms_id: '',
      sigla: '',
      date: '',
      other_names: '',
      place_of_origin: '',
      total_folia: '',
      dimensions: '',
      materials: '',
      laod_folia: '',
      format_description: '',
      transcription: ''
    });
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function handleSaveAsDraft() {
    // TODO: Implement save as draft functionality
    console.log('Saving as draft:', formData);
  }

  function handleComplete() {
    // TODO: Implement complete submission functionality
    console.log('Completing submission:', formData);
  }

  return (
    <Box>
      <NavigationBar />
      <Box>
        <Box bg="#08004F" py={8} px={6} position="relative">
          <Heading fontWeight="normal" ml={8} color="lightgray" size="lg">New Data Entry</Heading>
          <Flex position="absolute" right={6} top="50%" transform="translateY(-50%)" gap={4}>
            <Button 
              bg="#CB0606"
              color="white"
              _hover={{ bg: "#A80505" }}
              onClick={handleClear}
              borderRadius="full"
              size="md"
              px={8}
            >
              Clear
            </Button>
            <Button 
              bg="#B8860B"
              color="white"
              _hover={{ bg: "#9A7B0A" }}
              onClick={handleSaveAsDraft}
              borderRadius="full"
              size="md"
              px={8}
            >
              Save as draft
            </Button>
            <Button 
              colorScheme="green" 
              onClick={handleComplete}
              borderRadius="full"
              size="md"
              px={8}
            >
              Complete
            </Button>
          </Flex>
        </Box>

        <Box ml={8} p={6}>
          <Flex gap={12}>
            <Box flex={2} maxW="65%">
              <Flex mb={6} gap={6}>
                <Box flex={2}>
                  <Text fontSize="lg" mb={2}>MS ID</Text>
                  <Input 
                    name="ms_id"
                    value={formData.ms_id}
                    onChange={handleChange}
                    size="lg"
                    borderColor="gray.400"
                  />
                </Box>
                <Box flex={1}>
                  <Text fontSize="lg" mb={2}>Sigla</Text>
                  <Input 
                    name="sigla"
                    value={formData.sigla}
                    onChange={handleChange}
                    size="lg"
                    borderColor="gray.400"
                  />
                </Box>
                <Box flex={1}>
                  <Text fontSize="lg" mb={2}>Date</Text>
                  <Input 
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    size="lg"
                    borderColor="gray.400"
                  />
                </Box>
              </Flex>

              <Flex mb={6} gap={6}>
                <Box flex={1}>
                  <Text fontSize="lg" mb={2}>Other Names</Text>
                  <Input 
                    name="other_names"
                    value={formData.other_names}
                    onChange={handleChange}
                    size="lg"
                    borderColor="gray.400"
                  />
                </Box>
                <Box flex={1}>
                  <Text fontSize="lg" mb={2}>Place of Origin</Text>
                  <Input 
                    name="place_of_origin"
                    value={formData.place_of_origin}
                    onChange={handleChange}
                    size="lg"
                    borderColor="gray.400"
                  />
                </Box>
              </Flex>

              <Flex mb={6} gap={6}>
                <Box flex={1}>
                  <Text fontSize="lg" mb={2}>Total Folia</Text>
                  <Input 
                    name="total_folia"
                    value={formData.total_folia}
                    onChange={handleChange}
                    size="lg"
                    borderColor="gray.400"
                  />
                </Box>
                <Box flex={1}>
                  <Text fontSize="lg" mb={2}>Dimensions</Text>
                  <Input 
                    name="dimensions"
                    value={formData.dimensions}
                    onChange={handleChange}
                    size="lg"
                    borderColor="gray.400"
                  />
                </Box>
                <Box flex={1}>
                  <Text fontSize="lg" mb={2}>Materials</Text>
                  <Input 
                    name="materials"
                    value={formData.materials}
                    onChange={handleChange}
                    size="lg"
                    borderColor="gray.400"
                  />
                </Box>
                <Box flex={1}>
                  <Text fontSize="lg" mb={2}>Laod. Folia</Text>
                  <Input 
                    name="laod_folia"
                    value={formData.laod_folia}
                    onChange={handleChange}
                    size="lg"
                    borderColor="gray.400"
                  />
                </Box>
              </Flex>

              <Box mb={6}>
                <Text fontSize="lg" mb={2}>Format Description</Text>
                <Input 
                  name="format_description"
                  value={formData.format_description}
                  onChange={handleChange}
                  size="lg"
                  borderColor="gray.400"
                />
              </Box>

              <Box>
                <Text fontSize="lg" mb={2}>Transcription</Text>
                <Textarea
                  name="transcription"
                  value={formData.transcription}
                  onChange={handleChange}
                  placeholder="Text goes here...."
                  size="lg"
                  height="500px"
                  resize="vertical"
                  borderColor="gray.400"
                />
              </Box>
            </Box>

            <Box flex={1}>
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
            </Box>
          </Flex>
        </Box>
      </Box>
    </Box>
  );
}

export default NewDataEntry; 