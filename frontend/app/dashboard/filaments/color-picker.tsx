"use client";

import * as React from "react";
import { SketchPicker, ColorResult } from "react-color";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  name?: string;
  defaultValue?: string;
  className?: string;
}

export function ColorPicker({
  name = "color",
  defaultValue = "#000000",
  className,
}: ColorPickerProps) {
  const [color, setColor] = React.useState(defaultValue);
  const [isOpen, setIsOpen] = React.useState(false);

  const handleChange = (newColor: ColorResult) => {
    setColor(newColor.hex);
  };

  return (
    <div className={cn("relative", className)}>
      <input type="hidden" name={name} value={color} />
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal px-3"
          >
            <div
              className="w-4 h-4 rounded-full border mr-2 shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="truncate flex-1">{color}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border-none" align="start">
          <div className="bg-white p-2 rounded-md shadow-md">
            <SketchPicker
              color={color}
              onChange={handleChange}
              disableAlpha={true}
              presetColors={[
                "#000000", // Black
                "#FFFFFF", // White
                "#C0C0C0", // Silver
                "#808080", // Gray
                "#FF0000", // Red
                "#800000", // Maroon
                "#FFFF00", // Yellow
                "#808000", // Olive
                "#00FF00", // Lime
                "#008000", // Green
                "#00FFFF", // Aqua
                "#008080", // Teal
                "#0000FF", // Blue
                "#000080", // Navy
                "#FF00FF", // Fuchsia
                "#800080", // Purple
                "#fd7e14", // Orange (Bambu Lab roughly)
              ]}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
