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
} from '@chakra-ui/react';
import { ViewIcon, RepeatIcon, EditIcon, AddIcon } from '@chakra-ui/icons';
import NavigationBar from '../components/NavigationBar.tsx';
import { useDisplaySettings } from '../contexts/DisplaySettingsContext.tsx';

// Default variation types
const defaultVariationTypes = [
  "Different Spelling",
  "Abbreviation",
  "Word Choice",
  "Word Order",
  "Addition",
  "Omission"
];

function Settings() {
  const { settings, updateSettings } = useDisplaySettings();
  const toast = useToast();
  const [variationTypes, setVariationTypes] = useState<string[]>([]);
  const [newType, setNewType] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    // Load variation types from localStorage or use defaults
    const savedTypes = localStorage.getItem('variationTypes');
    if (savedTypes) {
      try {
        setVariationTypes(JSON.parse(savedTypes));
      } catch (error) {
        console.error('Error loading variation types:', error);
        setVariationTypes(defaultVariationTypes);
      }
    } else {
      setVariationTypes(defaultVariationTypes);
    }
  }, []);

  const handleChange = (field: string, value: string | boolean) => {
    updateSettings({ [field]: value });
  };

  const handleSave = async () => {
    // Save all settings to localStorage
    localStorage.setItem('displaySettings', JSON.stringify(settings));
    localStorage.setItem('variationTypes', JSON.stringify(variationTypes));
    
    toast({
      title: 'Settings saved successfully',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleAddType = () => {
    if (newType.trim() && !variationTypes.includes(newType.trim())) {
      setVariationTypes([...variationTypes, newType.trim()]);
      setNewType('');
    }
  };

  const handleEditType = (index: number) => {
    setEditingIndex(index);
    setEditValue(variationTypes[index]);
  };

  const handleSaveEdit = (index: number) => {
    if (editValue.trim() && !variationTypes.includes(editValue.trim())) {
      const newTypes = [...variationTypes];
      newTypes[index] = editValue.trim();
      setVariationTypes(newTypes);
    }
    setEditingIndex(null);
    setEditValue('');
  };

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
            >
              Save Changes
            </Button>
          </Flex>
        </Box>

        <Box p={8} maxW="1200px" mx="auto">
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
                    onChange={(e) => handleChange('theme', e.target.value)}
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
                    onChange={(e) => handleChange('fontSize', e.target.value)}
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
              </HStack>
              <VStack spacing={4} align="stretch" pl={8}>
                {variationTypes.map((type, index) => (
                  <Flex key={index} align="center" justify="space-between">
                    {editingIndex === index ? (
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleSaveEdit(index)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveEdit(index);
                          }
                        }}
                        width="300px"
                      />
                    ) : (
                      <Text>{type}</Text>
                    )}
                    <IconButton
                      aria-label="Edit variation type"
                      icon={<EditIcon />}
                      size="sm"
                      onClick={() => handleEditType(index)}
                    />
                  </Flex>
                ))}
                <Flex mt={4} gap={4}>
                  <Input
                    placeholder="Add new variation type"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddType();
                      }
                    }}
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
              </VStack>
            </Box>
          </VStack>
        </Box>
      </Box>
    </Box>
  );
}

export default Settings; 