"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Image, { StaticImageData } from "next/image";
import { useRef } from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";

interface ParallaxImageProps {
  src: StaticImageData;
  alt: string;
  className?: string;
  priority?: boolean;
}

export function ParallaxImage({
  src,
  alt,
  className,
  priority = false,
}: ParallaxImageProps) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1.05, 1]);
  const opacity = useTransform(
    scrollYProgress,
    [0, 0.2, 0.8, 1],
    [0.8, 1, 1, 0.8],
  );

  return (
    <Dialog>
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden w-full h-full cursor-zoom-in",
          className,
        )}
      >
        <DialogTrigger asChild>
          <motion.div style={{ y, scale, opacity }} className="w-full h-full">
            <Image
              src={src}
              alt={alt}
              className="object-contain w-full h-full transition-opacity hover:opacity-90"
              priority={priority}
              placeholder="blur"
            />
          </motion.div>
        </DialogTrigger>
      </div>
      <DialogContent
        overlayClassName="bg-black/90 backdrop-blur-sm"
        className="max-w-[95vw] md:max-w-6xl w-full p-0 bg-transparent border-none shadow-none ring-0 outline-none overflow-hidden"
      >
        <div className="relative w-full h-[80vh] md:h-[90vh] flex items-center justify-center p-2">
          <Image
            src={src}
            alt={alt}
            className="w-full h-full object-contain drop-shadow-2xl rounded-sm"
            placeholder="blur"
          />
        </div>
        <DialogTitle className="sr-only">{alt}</DialogTitle>
      </DialogContent>
    </Dialog>
  );
}
