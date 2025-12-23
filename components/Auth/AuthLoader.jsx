'use client';

import { useEffect } from 'react';

export default function AuthLoader() {
  useEffect(() => {
    // Simple check for token
    const token = localStorage.getItem('token');
    if (token) {
      console.log('User has token');
    }
  }, []);

  return null; 
}