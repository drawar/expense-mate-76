import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  cardCatalogService,
  CardCatalogEntry,
  CardCatalogFilter,
} from "@/core/catalog";

/**
 * Custom hook to fetch card catalog entries using React Query
 */
export function useCardCatalogQuery(filter?: CardCatalogFilter) {
  return useQuery({
    queryKey: ["cardCatalog", filter],
    queryFn: async () => {
      try {
        return await cardCatalogService.getCards(filter);
      } catch (error) {
        console.error("Error fetching card catalog:", error);
        toast.error("Failed to load card catalog");
        return [] as CardCatalogEntry[];
      }
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - catalog data doesn't change often
  });
}

/**
 * Custom hook to fetch a single card by ID
 */
export function useCardCatalogEntryQuery(id: string | undefined) {
  return useQuery({
    queryKey: ["cardCatalog", "entry", id],
    queryFn: async () => {
      if (!id) return null;
      try {
        return await cardCatalogService.getCardById(id);
      } catch (error) {
        console.error("Error fetching card catalog entry:", error);
        return null;
      }
    },
    enabled: !!id,
    staleTime: 30 * 60 * 1000,
  });
}

/**
 * Custom hook to fetch unique issuers from the catalog
 */
export function useCardCatalogIssuersQuery(region?: string) {
  return useQuery({
    queryKey: ["cardCatalog", "issuers", region],
    queryFn: async () => {
      try {
        return await cardCatalogService.getIssuers(region);
      } catch (error) {
        console.error("Error fetching card catalog issuers:", error);
        return [] as string[];
      }
    },
    staleTime: 30 * 60 * 1000,
  });
}

/**
 * Custom hook to fetch unique regions from the catalog
 */
export function useCardCatalogRegionsQuery() {
  return useQuery({
    queryKey: ["cardCatalog", "regions"],
    queryFn: async () => {
      try {
        return await cardCatalogService.getRegions();
      } catch (error) {
        console.error("Error fetching card catalog regions:", error);
        return [] as string[];
      }
    },
    staleTime: 30 * 60 * 1000,
  });
}
