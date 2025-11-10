import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageGalleryProps {
  images: Array<{ url: string; name: string }>;
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageGallery({ images, initialIndex, isOpen, onClose }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, [initialIndex, isOpen]);

  const goToNext = useCallback(() => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [currentIndex, images.length]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [currentIndex]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setZoom((prev) => {
      const newZoom = Math.max(prev - 0.5, 1);
      if (newZoom === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newZoom;
    });
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case "ArrowLeft":
          goToPrevious();
          break;
        case "ArrowRight":
          goToNext();
          break;
        case "Escape":
          onClose();
          break;
        case "+":
        case "=":
          handleZoomIn();
          break;
        case "-":
          handleZoomOut();
          break;
        case "0":
          handleResetZoom();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, goToNext, goToPrevious, onClose]);

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-black/95">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-2 text-white">
            <span className="text-sm font-medium">{currentImage.name}</span>
            <span className="text-xs text-muted-foreground">
              {currentIndex + 1} / {images.length}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Image Container */}
        <div
          className="relative w-full h-full flex items-center justify-center overflow-hidden"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          style={{ cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default" }}
        >
          <img
            src={currentImage.url}
            alt={currentImage.name}
            className={cn(
              "max-w-full max-h-full object-contain transition-transform duration-200 select-none",
              zoom > 1 && "cursor-grab active:cursor-grabbing"
            )}
            style={{
              transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
            }}
            draggable={false}
          />
        </div>

        {/* Navigation Controls */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNext}
              disabled={currentIndex === images.length - 1}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          </>
        )}

        {/* Zoom Controls */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full p-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            disabled={zoom <= 1}
            className="text-white hover:bg-white/20 disabled:opacity-30 rounded-full"
          >
            <ZoomOut className="h-5 w-5" />
          </Button>
          <span className="text-white text-sm font-medium min-w-[3rem] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            disabled={zoom >= 4}
            className="text-white hover:bg-white/20 disabled:opacity-30 rounded-full"
          >
            <ZoomIn className="h-5 w-5" />
          </Button>
          {zoom > 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleResetZoom}
              className="text-white hover:bg-white/20 rounded-full ml-2"
            >
              <Maximize2 className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="absolute bottom-20 left-0 right-0 z-50 flex justify-center gap-2 px-4 overflow-x-auto">
            <div className="flex gap-2 bg-black/60 backdrop-blur-sm rounded-lg p-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setZoom(1);
                    setPosition({ x: 0, y: 0 });
                  }}
                  className={cn(
                    "relative w-16 h-16 rounded overflow-hidden transition-all border-2",
                    idx === currentIndex
                      ? "border-primary scale-110"
                      : "border-transparent opacity-60 hover:opacity-100"
                  )}
                >
                  <img
                    src={img.url}
                    alt={img.name}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
