import { useState, useRef, useEffect, useCallback } from "react";
import { X, TagIcon, Plus } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { MossInput } from "@/components/ui/moss-input";
import { Badge } from "@/components/ui/badge";
import { Tag } from "@/types";
import { storageService } from "@/core/storage/StorageService";

interface TagInputProps {
  value: string; // Comma-separated tag slugs
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * Tag input component with autocomplete and inline tag creation.
 * Displays selected tags as badges and allows creating new tags.
 */
const TagInput: React.FC<TagInputProps> = ({
  value,
  onChange,
  placeholder = "Add tags...",
}) => {
  const [inputValue, setInputValue] = useState("");
  const [open, setOpen] = useState(false);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse current tags from comma-separated string
  const selectedSlugs = value ? value.split(",").filter(Boolean) : [];

  // Load all tags on mount
  useEffect(() => {
    const loadTags = async () => {
      setIsLoading(true);
      try {
        const tags = await storageService.getTags();
        setAllTags(tags);
      } catch (error) {
        console.error("Error loading tags:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTags();
  }, []);

  // Filter suggestions based on input
  const suggestions = allTags.filter(
    (tag) =>
      !selectedSlugs.includes(tag.slug) &&
      (tag.displayName.toLowerCase().includes(inputValue.toLowerCase()) ||
        tag.slug.toLowerCase().includes(inputValue.toLowerCase()))
  );

  // Check if input matches an existing tag exactly
  const exactMatch = allTags.find(
    (tag) =>
      tag.slug.toLowerCase() === inputValue.toLowerCase() ||
      tag.displayName.toLowerCase() === inputValue.toLowerCase()
  );

  // Generate slug from display name
  const generateSlug = (displayName: string): string => {
    return displayName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  // Add a tag to the selection
  const addTag = useCallback(
    (slug: string) => {
      if (!selectedSlugs.includes(slug)) {
        const newValue = [...selectedSlugs, slug].join(",");
        onChange(newValue);
      }
      setInputValue("");
      setOpen(false);
    },
    [selectedSlugs, onChange]
  );

  // Remove a tag from the selection
  const removeTag = useCallback(
    (slugToRemove: string) => {
      const newValue = selectedSlugs
        .filter((s) => s !== slugToRemove)
        .join(",");
      onChange(newValue);
    },
    [selectedSlugs, onChange]
  );

  // Create a new tag and add it
  const createAndAddTag = useCallback(
    async (displayName: string) => {
      const trimmedName = displayName.trim();
      if (!trimmedName) return;

      const slug = generateSlug(trimmedName);

      // Check if tag already exists
      const existing = allTags.find((t) => t.slug === slug);
      if (existing) {
        addTag(existing.slug);
        return;
      }

      // Create new tag
      const newTag = await storageService.addTag(slug, trimmedName);
      if (newTag) {
        setAllTags((prev) => [...prev, newTag]);
        addTag(newTag.slug);
      }
    },
    [allTags, addTag]
  );

  // Handle key down events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      if (exactMatch) {
        addTag(exactMatch.slug);
      } else {
        createAndAddTag(inputValue);
      }
    } else if (
      e.key === "Backspace" &&
      !inputValue &&
      selectedSlugs.length > 0
    ) {
      // Remove last tag when backspace on empty input
      removeTag(selectedSlugs[selectedSlugs.length - 1]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  // Get display name for a slug
  const getDisplayName = (slug: string): string => {
    const tag = allTags.find((t) => t.slug === slug);
    if (tag?.displayName) return tag.displayName;
    // Prettify slug as fallback: "seoul-2026" -> "Seoul 2026"
    return slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const showDropdown =
    open && (suggestions.length > 0 || (inputValue.trim() && !exactMatch));

  return (
    <div className="space-y-2">
      {/* Selected tags display */}
      {selectedSlugs.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedSlugs.map((slug) => (
            <Badge
              key={slug}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              <TagIcon className="h-3 w-3" />
              <span>{getDisplayName(slug)}</span>
              <button
                type="button"
                onClick={() => removeTag(slug)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Input with autocomplete */}
      <div className="relative" ref={containerRef}>
        <MossInput
          ref={inputRef}
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (e.target.value.length >= 1) {
              setOpen(true);
            } else {
              setOpen(false);
            }
          }}
          onFocus={() => {
            if (inputValue.length >= 1 || suggestions.length > 0) {
              setOpen(true);
            }
          }}
          onBlur={() => {
            // Delay closing to allow click on suggestion
            setTimeout(() => setOpen(false), 150);
          }}
          onKeyDown={handleKeyDown}
        />

        {showDropdown && (
          <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
            <Command>
              <CommandList>
                {suggestions.length === 0 && !inputValue.trim() && (
                  <CommandEmpty>No tags found</CommandEmpty>
                )}

                {/* Create new tag option */}
                {inputValue.trim() && !exactMatch && (
                  <CommandGroup heading="Create New Tag">
                    <CommandItem
                      onSelect={() => createAndAddTag(inputValue)}
                      className="cursor-pointer"
                    >
                      <Plus className="mr-2 h-4 w-4 flex-shrink-0 text-green-500" />
                      <span>Create &quot;{inputValue.trim()}&quot;</span>
                    </CommandItem>
                  </CommandGroup>
                )}

                {/* Existing tag suggestions */}
                {suggestions.length > 0 && (
                  <CommandGroup heading="Existing Tags">
                    {suggestions.slice(0, 8).map((tag) => (
                      <CommandItem
                        key={tag.id}
                        onSelect={() => addTag(tag.slug)}
                        className="cursor-pointer"
                      >
                        <TagIcon className="mr-2 h-4 w-4 flex-shrink-0 opacity-70" />
                        <span>{tag.displayName}</span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {tag.slug}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </div>
        )}
      </div>
    </div>
  );
};

export default TagInput;
