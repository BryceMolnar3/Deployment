import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  FormControl,
  FormLabel,
  Select,
} from '@chakra-ui/react';
import NavigationBar from '../components/NavigationBar.tsx';
import PhylogeneticTree, { TreeNode } from '../components/PhylogeneticTree.tsx';
import { useDisplaySettings } from '../contexts/DisplaySettingsContext.tsx';

// API base URL
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

function PhylogeneticAnalysis() {
  const [selectedView, setSelectedView] = useState<'tree' | 'list'>('tree');
  const [treeData, setTreeData] = useState<TreeNode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { settings } = useDisplaySettings();

  // Theme-based
  const boxBg = settings.theme === 'dark' ? 'gray.800' : 'white';
  const textColor = settings.theme === 'dark' ? 'gray.100' : 'gray.900';

  useEffect(() => {
    async function fetchTree() {
      try {
        setError(null);
        const response = await fetch(`${API_BASE_URL}/api/phylo/tree`);
        if (!response.ok) {
          throw new Error('Failed to retrieve phylogenetic tree');
        }
        const data = await response.json();
        setTreeData(data);
      } catch (err: any) {
        setError(err.message || 'Unknown error fetching tree');
      }
    }

    fetchTree();
  }, []);

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
              {error && (
                <Text color="red.500" mb={4}>
                  {error}
                </Text>
              )}

              {!treeData ? (
                <Text color={textColor}>Loading tree data...</Text>
              ) : selectedView === 'tree' ? (
                <PhylogeneticTree data={treeData} height="100%" />
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
