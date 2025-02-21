import React from 'react';
import { Flex, Text, Image, IconButton } from '@chakra-ui/react';
import { SettingsIcon } from '@chakra-ui/icons';

function NavigationBar() {
  return (
    <Flex 
      bg="beige" 
      p={4} 
      justifyContent="space-between" 
      alignItems="center"
    >
      <Flex flex={1} gap={4} alignItems="center">
        <Image 
          src="/images/Hamilton_Logo.png"
          alt="Hamilton College Logo"
          height="80px"
          marginRight={4}
        />
        <Flex flex={1} justifyContent="center">
          <Text textAlign="center" color="gray.600" fontSize={20} fontWeight={200}>Search <br />database</Text>
          <Text color="gray.600" mx={8} my={2} fontSize={25} fontWeight={100}>|</Text>
          <Text textAlign="center" color="gray.600" fontSize={20} fontWeight={200}>New <br />data entry</Text>
          <Text color="gray.600" mx={8} my={2} fontSize={25} fontWeight={100}>|</Text>
          <Text textAlign="center" color="gray.600" fontSize={20} fontWeight={200}>Manual<br />differentiation</Text>
          <Text color="gray.600" mx={8} my={2} fontSize={25} fontWeight={100}>|</Text>
          <Text textAlign="center" color="gray.600" fontSize={20} fontWeight={200}>Phylogenetic<br />analysis</Text>
        </Flex>
      </Flex>
      <IconButton
        aria-label="Settings"
        as={SettingsIcon}
        variant="ghost"
      />
    </Flex>
  );
}

export default NavigationBar; 