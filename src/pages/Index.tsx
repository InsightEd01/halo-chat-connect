
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

import WispaChatLogo from '@/assets/wispachat logo.jpg';

const Index = () => {

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="flex flex-col items-center">
          {/* WispaChat Logo at the top */}
          <div className="mb-4">
            <img src={WispaChatLogo} alt="WispaChat Logo" className="h-20 w-20 rounded-3xl shadow-lg border-4 border-white dark:border-gray-900" />
          </div>

          <h1 className="text-4xl font-black mb-4 text-gray-900 dark:text-white tracking-tight text-center">
            Welcome to <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">WispaChat</span>
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-8 text-center font-medium">
            A modern, private messaging app for you & your circle — built for speed and fun.
          </p>
          <div className="w-full flex flex-col space-y-3">
            <Link to="/auth">
              <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold shadow-lg rounded-xl py-3 text-lg transition-all duration-200">
                Get Started
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-xs text-gray-400 text-center">
            By continuing, you agree to our <span className="underline">Terms of Service</span> and <span className="underline">Privacy Policy</span>.
          </p>
        </div>
      </div>
      <div className="absolute bottom-6 text-center w-full left-0">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
          From <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-100 dark:to-gray-300">One Intelligence LLC</span>
        </p>
      </div>
    </div>
  );
};

export default Index;
