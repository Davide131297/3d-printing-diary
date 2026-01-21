"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FILAMENT_MANUFACTURERS } from "@/lib/constants";

export function ManufacturerCombobox() {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");
  // We need to track the input search value to allow custom entries
  // However, cmdk hides the direct input value access usually,
  // but we can assume if 'value' is set, that's what we want.
  // For custom values, we might need a slightly different approach or a "Create 'X'" option.
  // Standard Shadcn "Combobox" is for selection.
  // Let's implement a "Creatable" variant by using specific logic in CommandEmpty.

  // Ref to search input to grab value for custom entry
  const [searchValue, setSearchValue] = React.useState("");

  return (
    <>
      <input type="hidden" name="manufacturer" value={value} required />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            {value ? (
              <span className="truncate">{value}</span>
            ) : (
              <span className="text-muted-foreground truncate">
                Hersteller wählen...
              </span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          align="start"
        >
          <Command>
            <CommandInput
              placeholder="Hersteller suchen..."
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>
                <div className="p-2 text-sm text-muted-foreground">
                  Kein bekannter Hersteller.
                </div>
                <div className="p-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      setValue(searchValue);
                      setOpen(false);
                    }}
                  >
                    &quot;{searchValue}&quot; verwenden
                  </Button>
                </div>
              </CommandEmpty>
              <CommandGroup>
                {FILAMENT_MANUFACTURERS.map((manufacturer) => (
                  <CommandItem
                    key={manufacturer}
                    value={manufacturer}
                    onSelect={(currentValue) => {
                      // currentValue from cmdk is lowercased.
                      // We want the original casing from our list if possible.
                      // We find the original from our list that matches.
                      const original = FILAMENT_MANUFACTURERS.find(
                        (m) => m.toLowerCase() === currentValue.toLowerCase(),
                      );
                      setValue(original || currentValue);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === manufacturer ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {manufacturer}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  );
}
