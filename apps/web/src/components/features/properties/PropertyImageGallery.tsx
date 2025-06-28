'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';

interface PropertyImageGalleryProps {
  images: string[];
  title: string;
  className?: string;
}

export function PropertyImageGallery({ images, title, className = '' }: PropertyImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isModalOpen) return;

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          event.preventDefault();
          goToNext();
          break;
        case 'Escape':
          event.preventDefault();
          setIsModalOpen(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, goToNext, goToPrevious]);

  const handleImageError = (index: number) => {
    setImageErrors((prev) => new Set(prev).add(index));
  };

  const getImageSrc = (image: string, index: number) => {
    if (imageErrors.has(index)) {
      return '/placeholder.svg?height=400&width=600';
    }
    return image;
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  if (!images || images.length === 0) {
    return (
      <div
        className={`relative h-[400px] bg-muted rounded-lg flex items-center justify-center ${className}`}
      >
        <p className="text-muted-foreground">No images available</p>
      </div>
    );
  }

  return (
    <>
      {/* Main Gallery */}
      <div className={`relative ${className}`}>
        {/* Main Image */}
        <div className="relative h-[400px] lg:h-[500px] rounded-lg overflow-hidden group cursor-pointer">
          <Image
            src={getImageSrc(images[currentIndex], currentIndex) || '/placeholder.svg'}
            alt={`${title} - Image ${currentIndex + 1}`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            priority={currentIndex === 0}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 60vw"
            onError={() => handleImageError(currentIndex)}
            onClick={openModal}
          />

          {/* Overlay Controls */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300">
            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPrevious();
                  }}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNext();
                  }}
                  aria-label="Next image"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}

            {/* Zoom Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 bg-white/80 hover:bg-white text-black opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              onClick={(e) => {
                e.stopPropagation();
                openModal();
              }}
              aria-label="View full screen"
            >
              <ZoomIn className="h-5 w-5" />
            </Button>
          </div>

          {/* Image Counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </div>

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {images.map((image, index) => {
              // Create a unique key using image URL hash or fallback to index
              const imageKey = `thumbnail-${image.replace(/[^a-zA-Z0-9]/g, '')}-${index}`;

              return (
                <button
                  key={imageKey}
                  type="button"
                  className={`relative flex-shrink-0 w-20 h-16 rounded-md overflow-hidden border-2 transition-all duration-200 ${
                    index === currentIndex
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-transparent hover:border-muted-foreground/30'
                  }`}
                  onClick={() => setCurrentIndex(index)}
                  aria-label={`View image ${index + 1}`}
                >
                  <Image
                    src={getImageSrc(image, index) || '/placeholder.svg'}
                    alt={`${title} thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                    onError={() => handleImageError(index)}
                  />
                  {index === currentIndex && <div className="absolute inset-0 bg-primary/20" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Full Screen Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black border-0">
          {/* Hidden dialog title for accessibility */}
          <DialogTitle className="sr-only">
            {title} - Image {currentIndex + 1} of {images.length}
          </DialogTitle>

          <div className="relative w-full h-[90vh]">
            <Image
              src={getImageSrc(images[currentIndex], currentIndex) || '/placeholder.svg'}
              alt={`${title} - Full size image ${currentIndex + 1}`}
              fill
              className="object-contain"
              sizes="95vw"
              priority
              onError={() => handleImageError(currentIndex)}
            />

            {/* Modal Controls */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white"
              onClick={() => setIsModalOpen(false)}
              aria-label="Close full screen view"
            >
              <X className="h-6 w-6" />
            </Button>

            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                  onClick={goToPrevious}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                  onClick={goToNext}
                  aria-label="Next image"
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>

                {/* Modal Image Counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full">
                  {currentIndex + 1} / {images.length}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
