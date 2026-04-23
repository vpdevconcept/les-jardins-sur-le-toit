import { useState, useCallback, useEffect, ReactNode } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, ZoomIn, X, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface CarouselPage {
  src: string;
  alt: string;
}

interface ImageCarouselProps {
  pages: CarouselPage[];
  downloadUrl?: string;
  downloadLabel?: string;
  loop?: boolean;
  /** Render overlay content (e.g. hotspots) for a given page index */
  renderOverlay?: (index: number) => ReactNode;
}

export const ImageCarousel = ({
  pages,
  downloadUrl,
  downloadLabel = 'Télécharger (PDF)',
  loop = true,
  renderOverlay,
}: ImageCarouselProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop, align: 'center' });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  // Keyboard nav for fullscreen
  useEffect(() => {
    if (fullscreenIndex === null) return;
    const total = pages.length;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreenIndex(null);
      if (e.key === 'ArrowRight') setFullscreenIndex(i => i !== null ? (i + 1) % total : null);
      if (e.key === 'ArrowLeft') setFullscreenIndex(i => i !== null ? (i - 1 + total) % total : null);
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', handler); document.body.style.overflow = ''; };
  }, [fullscreenIndex, pages.length]);

  const total = pages.length;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Carousel */}
      <div className="relative group">
        <div className="overflow-hidden rounded-3xl shadow-2xl" ref={emblaRef}>
          <div className="flex">
            {pages.map((page, index) => (
              <div key={index} className="flex-[0_0_100%] min-w-0 relative">
                <div className="relative">
                  <img
                    src={page.src}
                    alt={page.alt}
                    className="w-full h-auto select-none"
                    draggable={false}
                  />
                  {/* Paper grain overlay */}
                  <div className="absolute inset-0 pointer-events-none paper-grain opacity-20" />
                  {/* Hotspot overlay */}
                  {renderOverlay && renderOverlay(index)}
                  {/* Zoom button */}
                  <button
                    onClick={() => setFullscreenIndex(index)}
                    className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors"
                    aria-label="Zoom"
                  >
                    <ZoomIn size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Nav arrows */}
        <button
          onClick={scrollPrev}
          className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm items-center justify-center text-white hover:bg-black/50 transition-all opacity-0 group-hover:opacity-100"
          aria-label="Précédent"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={scrollNext}
          className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm items-center justify-center text-white hover:bg-black/50 transition-all opacity-0 group-hover:opacity-100"
          aria-label="Suivant"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Dots */}
      <div className="flex justify-center items-center gap-2 mt-4">
        {pages.map((_, index) => (
          <button
            key={index}
            onClick={() => emblaApi?.scrollTo(index)}
            className={cn(
              "min-w-[10px] h-2.5 rounded-full transition-all duration-300",
              selectedIndex === index
                ? "bg-primary w-7"
                : "bg-muted-foreground/30 hover:bg-muted-foreground/50 w-2.5"
            )}
            aria-label={`Page ${index + 1}`}
          />
        ))}
      </div>

      {/* Download button */}
      {downloadUrl && (
        <div className="flex justify-center mt-4">
          <Button variant="outline" size="sm" asChild className="rounded-full">
            <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
              <Download size={16} />
              {downloadLabel}
            </a>
          </Button>
        </div>
      )}

      {/* Page counter */}
      <p className="text-center text-muted-foreground text-xs mt-2">
        Page {selectedIndex + 1} / {total}
      </p>

      {/* Fullscreen overlay */}
      <AnimatePresence>
        {fullscreenIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
            onClick={() => setFullscreenIndex(null)}
          >
            <button
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              onClick={() => setFullscreenIndex(null)}
              aria-label="Fermer"
            >
              <X size={20} />
            </button>

            <button
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              onClick={(e) => { e.stopPropagation(); setFullscreenIndex((fullscreenIndex - 1 + total) % total); }}
            >
              <ChevronLeft size={20} />
            </button>

            <motion.img
              key={fullscreenIndex}
              src={pages[fullscreenIndex].src}
              alt={pages[fullscreenIndex].alt}
              className="max-h-[90vh] max-w-[95vw] object-contain rounded-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.15}
              onDragEnd={(_, info) => {
                if (Math.abs(info.offset.x) > 30 || Math.abs(info.velocity.x) > 300) {
                  if (info.offset.x < 0) setFullscreenIndex((fullscreenIndex + 1) % total);
                  else setFullscreenIndex((fullscreenIndex - 1 + total) % total);
                }
              }}
            />

            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              onClick={(e) => { e.stopPropagation(); setFullscreenIndex((fullscreenIndex + 1) % total); }}
            >
              <ChevronRight size={20} />
            </button>

            <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 text-sm">
              Page {fullscreenIndex + 1} / {total}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
