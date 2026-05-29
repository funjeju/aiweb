import type { SiteBlock, SiteSchema } from "@/lib/types/site";

export interface BlockProps {
  block: SiteBlock;
  site: SiteSchema;
  isEditing?: boolean;
  onEdit?: (blockId: string, data: Record<string, unknown>) => void;
}
