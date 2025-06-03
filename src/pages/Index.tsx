
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="text-center max-w-md">
        <div className="inline-block p-4 bg-wispa-100 rounded-full mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#FF5722" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z"></path>
            <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"></path>
          </svg>
        </div>
        
        <h1 className="text-4xl font-bold mb-4 text-gray-900">Welcome to WispaChat</h1>
        <p className="text-xl text-gray-600 mb-8">
          A modern messaging platform that keeps you connected with friends and family.
        </p>
        
        <div className="flex flex-col space-y-3">
          <Link to="/auth">
            <Button className="w-full bg-wispa-500 hover:bg-wispa-600 text-white">
              Get Started
            </Button>
          </Link>
        </div>
        
        <p className="mt-6 text-sm text-gray-500">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default Index;
