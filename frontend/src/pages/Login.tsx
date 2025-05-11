import React, { useState } from 'react';
import { Box, Button, FormControl, FormLabel, Input, VStack, Heading, Text, useToast } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { collationService } from '../services/collationService';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const toast = useToast();
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await collationService.login(username, password);
      toast({
        title: 'Login successful',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/search-database'); // Redirect to home page after login
    } catch (error) {
      toast({
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleLogout = async () => {
    await collationService.logout();
    toast({
      title: 'Logged out',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
    navigate('/login'); // Redirect to login page after logout
  };

  return (
    <Box p={4}>
      <VStack spacing={4} align="stretch">
        <Heading>Login</Heading>
        <FormControl>
          <FormLabel>Username</FormLabel>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} />
        </FormControl>
        <FormControl>
          <FormLabel>Password</FormLabel>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </FormControl>
        <Button colorScheme="blue" onClick={handleLogin}>Login</Button>
        <Button colorScheme="red" onClick={handleLogout}>Logout</Button>
      </VStack>
    </Box>
  );
};

export default Login; 