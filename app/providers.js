'use client';

import { Provider, useDispatch } from 'react-redux';
import { store } from '@/store/store';
import { useEffect } from 'react';
import { getCurrentUser, restoreAuthState } from '@/store/slices/authSlice';

function AuthLoader() {
  const dispatch = useDispatch();

  useEffect(() => {
    // This will only run on the client
    dispatch(restoreAuthState());
    
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(getCurrentUser());
    }
  }, [dispatch]);

  return null;
}

export default function Providers({ children }) {
  return (
    <Provider store={store}>
      <AuthLoader />
      {children}
    </Provider>
  );
}