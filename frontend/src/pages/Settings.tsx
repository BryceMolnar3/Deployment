import React from 'react';
import {
  Box,
  Heading,
  VStack,
  Switch,
  Select,
  Button,
  FormControl,
  FormLabel,
  useToast,
  HStack,
  Icon,
  Flex,
} from '@chakra-ui/react';
import { ViewIcon, RepeatIcon } from '@chakra-ui/icons';
import NavigationBar from '../components/NavigationBar.tsx';
import { useDisplaySettings } from '../contexts/DisplaySettingsContext.tsx';

function Settings() {
  const { settings, updateSettings } = useDisplaySettings();
  const toast = useToast();

  const handleChange = (field: string, value: string | boolean) => {
    updateSettings({ [field]: value });
  };

  const handleSave = async () => {
    // Save settings to localStorage for persistence
    localStorage.setItem('displaySettings', JSON.stringify(settings));
    
    toast({
      title: 'Settings saved successfully',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
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

                <FormControl display="flex" alignItems="center" justifyContent="space-between">
                  <FormLabel mb={0}>Show Line Numbers</FormLabel>
                  <Switch
                    isChecked={settings.showLineNumbers}
                    onChange={(e) => handleChange('showLineNumbers', e.target.checked)}
                  />
                </FormControl>

                <FormControl display="flex" alignItems="center" justifyContent="space-between">
                  <FormLabel mb={0}>Highlight Differences</FormLabel>
                  <Switch
                    isChecked={settings.highlightDifferences}
                    onChange={(e) => handleChange('highlightDifferences', e.target.checked)}
                  />
                </FormControl>
              </VStack>
            </Box>
          </VStack>
        </Box>
      </Box>
    </Box>
  );
}

export default Settings; 