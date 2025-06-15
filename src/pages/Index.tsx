
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const onboardingSlides = [
  {
    image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?q=80&w=2070&auto=format&fit=crop",
    title: "Connect Instantly",
    description: "Message friends, family, and colleagues with WispaChat in real-time, wherever you are.",
  },
  {
    image: "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?q=80&w=2070&auto=format&fit=crop",
    title: "Share Effortlessly",
    description: "Send photos, videos, voice notes, docs, and more in just one tap.",
  },
  {
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2071&auto=format&fit=crop",
    title: "High-Quality Calls",
    description: "Enjoy crystal-clear voice and video calls, day or night.",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-tr from-orange-50 to-yellow-50">
      <div className="flex-1 flex items-center justify-center p-4 md:p-6">
        <Carousel className="w-full max-w-xs mx-auto rounded-xl shadow-lg overflow-hidden" opts={{ loop: true }}>
          <CarouselContent>
            {onboardingSlides.map((slide, index) => (
              <CarouselItem key={index}>
                <div className="text-center flex flex-col justify-between">
                  <div className="aspect-square w-full overflow-hidden rounded-xl mb-6 shadow-md border-2 border-primary">
                    <img 
                      src={slide.image} 
                      alt={slide.title} 
                      className="w-full h-full object-cover scale-110"
                    />
                  </div>
                  <h2 className="text-2xl font-extrabold text-primary mb-2">{slide.title}</h2>
                  <p className="text-muted-foreground mb-6 px-2">{slide.description}</p>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-0 bg-primary/80 text-white" />
          <CarouselNext className="right-0 bg-primary/80 text-white" />
        </Carousel>
      </div>
      <div className="p-6 border-t border-border bg-white/80 sticky bottom-0 z-10 shadow-t-lg">
        <Link to="/auth">
          <Button className="w-full bg-gradient-to-r from-orange-500 to-yellow-400 text-white font-bold py-3 text-base h-12 rounded-lg">
            Get Started
          </Button>
        </Link>
        <p className="mt-4 text-xs text-muted-foreground text-center">
          By continuing, you agree to our Terms of Service.
        </p>
        <div className="text-xs text-center text-muted-foreground mt-2 font-bold tracking-wider">WispaChat</div>
      </div>
    </div>
  );
};

export default Index;
