import React, { useState, useMemo } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { breedsBySpecies } from '@/data/breeds';

interface BreedSelectorProps {
  species: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const BreedSelector: React.FC<BreedSelectorProps> = ({
  species,
  value,
  onChange,
  disabled = false
}) => {
  const [open, setOpen] = useState(false);

  const breeds = useMemo(() => {
    if (!species || !breedsBySpecies[species as keyof typeof breedsBySpecies]) {
      return [];
    }
    return breedsBySpecies[species as keyof typeof breedsBySpecies];
  }, [species]);

  const selectedBreed = breeds.find((breed) => breed === value);

  if (!species || breeds.length === 0) {
    return (
      <Button
        variant="outline"
        role="combobox"
        disabled={true}
        className="w-full justify-between text-muted-foreground"
      >
        First select a species
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between"
        >
          {selectedBreed || "Select a breed..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Search breed..." 
            className="h-9" 
          />
          <CommandList>
            <CommandEmpty>No breed found.</CommandEmpty>
            <CommandGroup>
              {breeds.map((breed) => (
                <CommandItem
                  key={breed}
                  value={breed}
                  onSelect={(currentValue) => {
                    const selectedBreed = breeds.find(
                      (breed) => breed.toLowerCase() === currentValue.toLowerCase()
                    );
                    onChange(selectedBreed === value ? "" : selectedBreed || "");
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === breed ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {breed}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default BreedSelector;