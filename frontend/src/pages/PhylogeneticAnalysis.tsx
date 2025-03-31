import React, { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  FormControl,
  FormLabel,
  Select,
  VStack,
} from '@chakra-ui/react';
import NavigationBar from '../components/NavigationBar.tsx';
import PhylogeneticTree, { TreeNode } from '../components/PhylogeneticTree.tsx';
import { useDisplaySettings } from '../contexts/DisplaySettingsContext.tsx';

// Sample data - replace with actual data from your backend
const sampleTreeData: TreeNode = {
  name: "Root Manuscript",
  attributes: {
    date: "1400 CE",
    location: "Rome"
  },
  children: [
    {
      name: "Manuscript A",
      attributes: {
        date: "1450 CE",
        location: "Paris"
      },
      children: [
        {
          name: "Manuscript A.1",
          attributes: {
            date: "1500 CE",
            location: "Lyon"
          }
        },
        {
          name: "Manuscript A.2",
          attributes: {
            date: "1520 CE",
            location: "Avignon"
          }
        }
      ]
    },
    {
      name: "Manuscript B",
      attributes: {
        date: "1460 CE",
        location: "Florence"
      },
      children: [
        {
          name: "Manuscript B.1",
          attributes: {
            date: "1490 CE",
            location: "Venice"
          }
        }
      ]
    }
  ]
};

function PhylogeneticAnalysis() {
  const [selectedView, setSelectedView] = useState<'tree' | 'list'>('tree');
  const { settings } = useDisplaySettings();

  // Theme-based colors
  const boxBg = settings.theme === 'dark' ? 'gray.800' : 'white';
  const textColor = settings.theme === 'dark' ? 'gray.100' : 'gray.900';

  function handleViewChange(event: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedView(event.target.value as 'tree' | 'list');
  }

  return (
    <Box>
      <NavigationBar />
      <Box>
        <Box bg="#08004F" py={8} px={6}>
          <Heading fontWeight="normal" ml={8} color="lightgray" size="lg">
            Phylogenetic Analysis
          </Heading>
        </Box>

        <Box p={8} maxW="1200px" mx="auto">
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>View Type</FormLabel>
              <Select
                value={selectedView}
                onChange={handleViewChange}
                width="200px"
              >
                <option value="tree">Tree View</option>
                <option value="list">List View</option>
              </Select>
            </FormControl>

            <Box
              bg={boxBg}
              height="70vh"
              borderRadius="md"
              overflow="hidden"
              borderWidth="1px"
              p={4}
            >
              {selectedView === 'tree' ? (
                <PhylogeneticTree 
                  data={sampleTreeData} 
                  height="100%"
                />
              ) : (
                <Box p={2}>
                  <Text fontSize="xl" color={textColor}>
                    List view coming soon...
                  </Text>
                </Box>
              )}
            </Box>
          </VStack>
        </Box>
      </Box>
    </Box>
  );
}

export default PhylogeneticAnalysis; 