
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const carouselItems = [
  {
    title: "Seamless Messaging",
    description: "Chat in real-time with friends and groups, with delivery and read receipts like WhatsApp.",
    image: "/placeholder.svg"
  },
  {
    title: "Express Yourself",
    description: "Share a status, photo, video, or a fun emoji — all in a modern, familiar interface.",
    image: "/placeholder.svg"
  },
  {
    title: "Voice & Video Calls",
    description: "Call your contacts securely from anywhere, instantly — like a real chat app.",
    image: "/placeholder.svg"
  }
];

const Index = () => {
  const [currentSlide, setCurrentSlide] = React.useState(0);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
    }, 3500);
    return () => clearTimeout(timeout);
  }, [currentSlide]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-wispa-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="flex flex-col items-center">
          {/* Carousel with fade-in/fade-out */}
          <div className="w-full relative mb-6" style={{ height: 220 }}>
            {carouselItems.map((item, idx) => (
              <div
                key={idx}
                className={`absolute inset-0 flex flex-col items-center justify-center p-4 rounded-2xl bg-white dark:bg-gray-950 shadow transition-all duration-300
                  ${currentSlide === idx ? 'opacity-100 z-10 animate-fade-in' : 'opacity-0 z-0'}
                `}
                style={{
                  pointerEvents: currentSlide === idx ? 'auto' : 'none'
                }}
              >
                <img src={item.image} className="h-20 mb-2" alt="" />
                <h2 className="text-2xl font-extrabold mb-2 text-wispa-700 tracking-tight">{item.title}</h2>
                <p className="text-base text-gray-600 dark:text-gray-300">{item.description}</p>
              </div>
            ))}
            {/* Carousel indicators */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
              {carouselItems.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`rounded-full h-2 w-5 mx-1 ${currentSlide === idx ? 'bg-wispa-500' : 'bg-gray-300'}`}
                  aria-label={`Go to slide ${idx + 1}`}
                  style={{ opacity: currentSlide === idx ? 1 : 0.6 }}
                />
              ))}
            </div>
          </div>
          <h1 className="text-4xl font-black mb-4 text-gray-900 dark:text-white tracking-tight text-center">
            Welcome to WispaChat
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-8 text-center">
            A modern, private messaging app for you & your circle — built for speed and fun.
          </p>
          <div className="w-full flex flex-col space-y-3">
            <Link to="/auth">
              <Button className="w-full bg-wispa-500 hover:bg-wispa-600 text-white">
                Get Started
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-xs text-gray-400 text-center">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
