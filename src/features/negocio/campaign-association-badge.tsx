import Link from "next/link";
import { Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/** Sinal visual reutilizável nos módulos editoriais; não duplica dados do conteúdo. */
export function CampaignAssociationBadge({ campaignId }: { campaignId: string | null }) {
  if (!campaignId) return null;
  return <Badge variant="accent" className="w-fit"><Megaphone className="h-3 w-3" aria-hidden="true" /><Link href={`/negocio/campanhas/${campaignId}`}>Campanha vinculada</Link></Badge>;
}
