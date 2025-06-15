
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
    description: "Seamlessly chat with friends, family, and colleagues in real-time.",
  },
  {
    image: "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?q=80&w=2070&auto=format&fit=crop",
    title: "Share Your World",
    description: "Send photos, videos, documents, and voice messages with ease.",
  },
  {
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2071&auto=format&fit=crop",
    title: "Crystal-Clear Calls",
    description: "Make high-quality voice and video calls to anyone, anywhere.",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background p-0">
      <div className="flex-1 flex items-center justify-center p-4 md:p-6">
        <Carousel className="w-full max-w-sm" opts={{ loop: true }}>
          <CarouselContent>
            {onboardingSlides.map((slide, index) => (
              <CarouselItem key={index}>
                <div className="p-1 text-center">
                  <div className="aspect-square w-full overflow-hidden rounded-xl mb-8 shadow-lg">
                    <img 
                      src={slide.image} 
                      alt={slide.title} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <h2 className="text-3xl font-bold text-foreground">{slide.title}</h2>
                  <p className="text-muted-foreground mt-2 max-w-xs mx-auto">{slide.description}</p>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-0 bg-background/50 backdrop-blur-sm" />
          <CarouselNext className="right-0 bg-background/50 backdrop-blur-sm" />
        </Carousel>
      </div>

      <div className="p-6 border-t border-border bg-background/80 backdrop-blur-sm sticky bottom-0">
        <Link to="/auth">
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 text-lg h-12">
            Get Started
          </Button>
        </Link>
        <p className="mt-4 text-xs text-muted-foreground text-center">
          By continuing, you agree to our Terms of Service.
        </p>
      </div>
    </div>
  );
};

export default Index;
