"use client";

import { MapPin, Users, Search } from "lucide-react";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar1 } from "lucide-react";
import { Button } from "../ui/button";
import { useEffect, useState } from "react";
import { format } from "date-fns/format";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";

const searchSchema = z.object({
  location: z
    .string()
    .min(2, "Location must be at least 2 characters")
    .max(100, "Location is too long"),
  checkIn: z
    .string()
    .optional()
    .refine((date) => !date || new Date(date) >= new Date(), {
      message: "Check-in date must be today or later"
    }),
  checkOut: z
    .string()
    .optional()
    .refine((date) => !date || new Date(date) >= new Date(), {
      message: "Check-out date must be today or later"
    }),
  guests: z
    .number()
    .int()
    .min(1, "At least 1 guest required")
    .max(16, "Maximum 16 guests allowed")
    .optional()
});

type SearchFormData = z.infer<typeof searchSchema>;

// Mock locations for autocomplete
const LOCATIONS = [
  "Luján, Buenos Aires",
  "San Isidro, Buenos Aires",
  "Palermo, Buenos Aires",
  "Córdoba, Argentina",
  "Mendoza, Argentina",
  "Rosario, Santa Fe"
];

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [location, setLocation] = useState("");
  const [checkIn, setCheckIn] = useState<Date | undefined>(undefined);
  const [checkOut, setCheckOut] = useState<Date | undefined>(undefined);
  const [guests, setGuests] = useState(2);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const validateField = (
    field: keyof SearchFormData,
    value: string | number
  ): string | null => {
    try {
      const fieldSchema = z.object({ [field]: searchSchema.shape[field] });
      fieldSchema.parse({ [field]: value });
      return null;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.errors[0].message;
      }
      return "Invalid input";
    }
  };

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set(key, value);
    router.replace(`/search?${params.toString()}`);
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Only show validation error if user has typed something
    if (value) {
      const fieldError = validateField("location", value);
      setError(fieldError);
    } else {
      setError(null);
    }

    // Filter suggestions based on input
    if (value.length > 1) {
      const filtered = LOCATIONS.filter((loc) =>
        loc.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion: string) => {
    // setFormData({ ...formData, location: suggestion });
    setLocation(suggestion);
    setShowSuggestions(false);
    setError(null);
  };

  useEffect(() => {
    const paramsLocation = searchParams.get("location") || "";
    const paramsGuests = parseInt(searchParams.get("guests") || "1");
    const paramsCheckIn = searchParams.get("checkIn");
    const paramsCheckOut = searchParams.get("checkOut");

    setLocation(paramsLocation);
    setGuests(paramsGuests);

    if (paramsCheckIn) {
      const parsed = new Date(paramsCheckIn);
      if (!isNaN(parsed.getTime())) setCheckIn(parsed);
    }

    if (paramsCheckOut) {
      const parsed = new Date(paramsCheckOut);
      if (!isNaN(parsed.getTime())) setCheckOut(parsed);
    }
  }, [searchParams]);

  return (
    <form className="flex flex-wrap border items-center gap-4 p-3 rounded-2xl text-[#182A47] dark:text-[#C2F2FF]">
      <div className="flex items-center border gap-2 w-full bg-background dark:bg-input/30 rounded-2xl px-3 py-2 md:w-auto">
        <Search className="w-5 h-5 text-blue-600" />
        <input
          type="text"
          placeholder="Location"
          className="bg-transparent outline-none w-full md:w-40 placeholder:text-gray-500 dark:placeholder:text-gray-300"
          value={location}
          onChange={(e) => {
            setLocation(e.target.value);
            updateParams("location", e.target.value);
            handleLocationChange(e);
          }}
        />

        {showSuggestions && suggestions.length > 0 && (
          <select
            id="location-listbox"
            className="absolute max-w-[300px] mt-1 bg-background border rounded-md shadow-md z-20 max-h-48 overflow-y-auto"
            size={Math.min(suggestions.length, 5)}
            onChange={(e) => {
              selectSuggestion(e.target.value);
              updateParams("location", e.target.value);
            }}
            onBlur={() => setShowSuggestions(false)}
          >
            {suggestions.map((suggestion) => (
              <option
                key={suggestion}
                value={suggestion}
                className="p-2 hover:bg-muted cursor-pointer"
              >
                {suggestion}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Check-in */}
      <div className="flex items-center border gap-2 w-full md:w-auto bg-background dark:bg-input/30 px-3 py-2 rounded-2xl justify-start text-left font-normal">
        <Calendar1 className="w-5 h-5 text-blue-600" />
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="border-none dark:text-white">
              {checkIn ? format(checkIn, "PPP") : "Check in"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="min-w-[300px] p-0">
            <Calendar
              mode="single"
              className="w-full"
              selected={checkIn}
              onSelect={(selected) => {
                setCheckIn(selected);
                if (selected) updateParams("checkIn", selected.toISOString());
              }}
              disabled={(d) => d < new Date()}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Check-out */}
      <div className="flex items-center border gap-2 w-full md:w-auto bg-background dark:bg-input/30 px-3 py-2 rounded-2xl justify-start text-left font-normal">
        <Calendar1 className="w-5 h-5 text-blue-600" />
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="border-none dark:text-white">
              {checkOut ? format(checkOut, "PPP") : "Check out"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="min-w-[300px] p-0">
            <Calendar
              mode="single"
              className="w-full"
              selected={checkOut}
              onSelect={(selected) => {
                setCheckOut(selected);
                if (selected) updateParams("checkOut", selected.toISOString());
              }}
              disabled={(d) => d < new Date()}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Guests */}
      <div className="flex items-center gap-2 w-full md:w-auto bg-background border dark:bg-input/30 px-3 py-2 rounded-2xl">
        <Users className="w-5 h-5 text-blue-600" />
        <input
          type="number"
          placeholder="Guests"
          className="bg-transparent outline-none w-full md:w-20 placeholder:text-gray-500 dark:placeholder:text-gray-300"
          value={guests}
          onChange={(e) => {
            const val = Number(e.target.value);
            setGuests(val);
            updateParams("guests", val.toString());
          }}
          min={1}
        />
      </div>
    </form>
  );
}
