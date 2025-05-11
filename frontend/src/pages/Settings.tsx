import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  VStack,
  Select,
  Button,
  FormControl,
  FormLabel,
  useToast,
  HStack,
  Icon,
  Flex,
  Text,
  Input,
  IconButton,
  Alert,
  AlertIcon,
  Spinner,
  useColorModeValue,
} from '@chakra-ui/react';
import { ViewIcon, RepeatIcon, EditIcon, AddIcon, DeleteIcon } from '@chakra-ui/icons';
import NavigationBar from '../components/NavigationBar.tsx';
import { useDisplaySettings } from '../contexts/DisplaySettingsContext.tsx';

// If your server is at localhost:8000 by default:
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

// Default variation types if the backend is empty or fails
const defaultVariationTypes = [
  "Different Spelling",
  "Abbreviation",
  "Word Choice",
  "Word Order",
  "Addition",
  "Omission"
];

// VariationTypesService that calls real API endpoints
const variationTypesService = {
  // GET all
  async fetchTypes(): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/api/variations`);
    if (!response.ok) {
      throw new Error('Failed to fetch variation types');
    }
    const data = await response.json();
    // Expecting an array of strings
    return data;
  },

  // POST new type
  async addType(type: string): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/api/variations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to add type');
    }
    return response.json(); // returns updated array
  },

  // PUT update by index
  async updateType(index: number, newValue: string): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/api/variations/${index}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newValue }),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to update type');
    }
    return response.json();
  },

  // DELETE by index
  async deleteType(index: number): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/api/variations/${index}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to delete type');
    }
    return response.json();
  },

  // A "saveTypes" endpoint does not exist in our mock, but your code calls it in handleSave.
  // You could implement an "overwrite" approach if you want:
  async saveTypes(types: string[]): Promise<string[]> {
    // For demonstration, let's do a naive approach: 
    //  1) Clear existing types by deleting them all 
    //  2) Re-add each new type 
    // This is not super efficient but shows the idea.
    // Alternatively, you'd have a dedicated "bulk update" route on the backend. 
    const fetched = await this.fetchTypes();
    // Delete them in reverse so indexes don't shift
    for (let i = fetched.length - 1; i >= 0; i--) {
      await this.deleteType(i);
    }
    for (let t of types) {
      await this.addType(t);
    }
    return types;
  }
};

function Settings() {
  const { settings, updateSettings } = useDisplaySettings();
  const toast = useToast();
  const [variationTypes, setVariationTypes] = useState<string[]>([]);
  const [newType, setNewType] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // For Chakra UI color modes
  const alertBg = useColorModeValue('blue.50', 'rgba(37, 47, 110, 0.3)');
  const alertBorder = useColorModeValue('blue.100', 'rgba(44, 82, 130, 0.5)');

  // On mount, load variation types from the API
  useEffect(() => {
    async function loadTypes() {
      try {
        setIsLoading(true);
        setError(null);
        const types = await variationTypesService.fetchTypes();
        setVariationTypes(types);
      } catch (err: any) {
        console.error('Error loading variation types:', err);
        setError(err.message || 'Failed to load variation types');
        // fallback if needed:
        setVariationTypes(defaultVariationTypes);
      } finally {
        setIsLoading(false);
      }
    }
    loadTypes();
  }, []);

  // For local display settings (theme, font size, etc.)
  function handleChange(field: string, value: string | boolean) {
    updateSettings({ [field]: value });
  }

  async function handleSave() {
    try {
      setIsSaving(true);
      setError(null);

      // Save display settings (theme, font size) locally
      localStorage.setItem('displaySettings', JSON.stringify(settings));

      // Save variation types to the server (bulk update approach)
      await variationTypesService.saveTypes(variationTypes);

      toast({
        title: 'Settings saved successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err: any) {
      console.error(err);
      setError('Failed to save settings');
      toast({
        title: 'Error saving settings',
        description: err.message || 'Please try again',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAddType() {
    const trimmed = newType.trim();
    if (!trimmed) return;
    // If the type already exists, do nothing
    if (variationTypes.includes(trimmed)) {
      toast({
        title: 'Type already exists',
        status: 'warning',
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    try {
      setError(null);
      const updated = await variationTypesService.addType(trimmed);
      setVariationTypes(updated);
      setNewType('');

      toast({
        title: 'Variation type added',
        description: 'Remember to save your changes',
        status: 'info',
        duration: 2000,
        isClosable: true,
      });
    } catch (err: any) {
      setError('Failed to add variation type');
      toast({
        title: 'Error adding variation type',
        description: err.message || 'Please try again',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }

  function handleEditType(index: number) {
    setEditingIndex(index);
    setEditValue(variationTypes[index]);
  }

  async function handleSaveEdit(index: number) {
    const trimmed = editValue.trim();
    if (!trimmed) return;

    if (variationTypes.includes(trimmed) && trimmed !== variationTypes[index]) {
      // The user typed a type that already exists in the array
      toast({
        title: 'Type already exists',
        status: 'warning',
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    try {
      setError(null);
      const updated = await variationTypesService.updateType(index, trimmed);
      setVariationTypes(updated);

      toast({
        title: 'Variation type updated',
        description: 'Remember to save your changes',
        status: 'info',
        duration: 2000,
        isClosable: true,
      });
    } catch (err: any) {
      setError('Failed to update variation type');
      toast({
        title: 'Error updating variation type',
        description: err.message || 'Please try again',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setEditingIndex(null);
      setEditValue('');
    }
  }

  async function handleDeleteType(index: number) {
    // prevent deleting the last type
    if (variationTypes.length <= 1) {
      toast({
        title: 'Cannot delete',
        description: 'At least one variation type must remain',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setError(null);
      const updated = await variationTypesService.deleteType(index);
      setVariationTypes(updated);

      toast({
        title: 'Variation type deleted',
        description: 'Remember to save your changes',
        status: 'info',
        duration: 2000,
        isClosable: true,
      });
    } catch (err: any) {
      setError('Failed to delete variation type');
      toast({
        title: 'Error deleting variation type',
        description: err.message || 'Please try again',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setNewType(e.target.value);
  }

  function handleEditInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEditValue(e.target.value);
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleAddType();
    }
  }

  function handleEditKeyPress(e: React.KeyboardEvent, index: number) {
    if (e.key === 'Enter') {
      handleSaveEdit(index);
    }
  }

  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>, field: string) {
    handleChange(field, e.target.value);
  }

  return (
    <Box>
      <NavigationBar />
      <Box>
        <Box bg="#08004F" py={8} px={6} position="relative">
          <Heading fontWeight="normal" ml={8} color="lightgray" size="lg">Settings</Heading>
          <Flex position="absolute" right={6} top="50%" transform="translateY(-50%)" gap={4}>
            <Button
              colorScheme="green"
              onClick={handleSave}
              borderRadius="full"
              size="md"
              px={8}
              leftIcon={<Icon as={RepeatIcon} />}
              isLoading={isSaving}
            >
              Save Changes
            </Button>
          </Flex>
        </Box>

        <Box p={8} maxW="1200px" mx="auto">
          <Alert
            status="info"
            mb={6}
            borderRadius="md"
            colorScheme="blue"
            variant="left-accent"
          >
            <AlertIcon />
            <Text>
              <strong>Important:</strong> Remember to click "Save Changes" before refreshing or navigating away. Unsaved changes will be lost.
            </Text>
          </Alert>

          {error && (
            <Alert status="error" mb={6} borderRadius="md">
              <AlertIcon />
              <Text>{error}</Text>
            </Alert>
          )}

          <VStack spacing={8} align="stretch">
            {/* Display Settings */}
            <Box>
              <HStack mb={4}>
                <Icon as={ViewIcon} fontSize="24px" color="gray.600" />
                <Heading size="md">Display Settings</Heading>
              </HStack>
              <VStack spacing={4} align="stretch" pl={8}>
                <FormControl display="flex" alignItems="center" justifyContent="space-between">
                  <FormLabel mb={0}>Theme</FormLabel>
                  <Select
                    value={settings.theme}
                    onChange={(e) => handleSelectChange(e, 'theme')}
                    width="200px"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </Select>
                </FormControl>

                <FormControl display="flex" alignItems="center" justifyContent="space-between">
                  <FormLabel mb={0}>Font Size</FormLabel>
                  <Select
                    value={settings.fontSize}
                    onChange={(e) => handleSelectChange(e, 'fontSize')}
                    width="200px"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </Select>
                </FormControl>
              </VStack>
            </Box>

            {/* Variation Types */}
            <Box>
              <HStack mb={4}>
                <Icon as={EditIcon} fontSize="24px" color="gray.600" />
                <Heading size="md">Variation Types</Heading>
                {isLoading && <Spinner size="sm" />}
              </HStack>

              <VStack spacing={4} align="stretch" pl={8}>
                {!isLoading && variationTypes.map((type, index) => (
                  <Flex key={index} align="center" justify="space-between">
                    {editingIndex === index ? (
                      <Input
                        value={editValue}
                        onChange={handleEditInputChange}
                        onBlur={() => handleSaveEdit(index)}
                        onKeyPress={(e) => handleEditKeyPress(e, index)}
                        width="300px"
                      />
                    ) : (
                      <Text>{type}</Text>
                    )}
                    <HStack spacing={2}>
                      <IconButton
                        aria-label="Edit variation type"
                        icon={<EditIcon />}
                        size="sm"
                        onClick={() => handleEditType(index)}
                      />
                      <IconButton
                        aria-label="Delete variation type"
                        icon={<DeleteIcon />}
                        size="sm"
                        colorScheme="red"
                        onClick={() => handleDeleteType(index)}
                      />
                    </HStack>
                  </Flex>
                ))}

                {!isLoading && (
                  <Flex mt={4} gap={4}>
                    <Input
                      placeholder="Add new variation type"
                      value={newType}
                      onChange={handleInputChange}
                      onKeyPress={handleKeyPress}
                    />
                    <Button
                      leftIcon={<AddIcon />}
                      onClick={handleAddType}
                      colorScheme="blue"
                      isDisabled={!newType.trim()}
                    >
                      Add Type
                    </Button>
                  </Flex>
                )}
              </VStack>
            </Box>
          </VStack>
        </Box>
      </Box>
    </Box>
  );
}

export default Settings;