"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Archive, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/feedback/states";
import { archiveCampaignAction } from "@/lib/actions/negocio";
import { campaignFinancials, formatCurrency, isDeliveryOverdue, NEGOTIATION_STATUSES, NEGOTIATION_STATUS_LABELS } from "@/lib/negocio";
import { todayISODate } from "@/lib/dates";
import type { Campaign, CampaignPayment, InstagramAccount } from "@/types/domain";
import { CampaignFormDialog } from "./campaign-form-dialog";

export function CampaignsWorkspace({initialCampaigns,payments,accounts}:{initialCampaigns:Campaign[];payments:CampaignPayment[];accounts:InstagramAccount[]}){
 const[campaigns,setCampaigns]=React.useState(initialCampaigns);const[search,setSearch]=React.useState("");const[status,setStatus]=React.useState("");const[open,setOpen]=React.useState(false);const[editing,setEditing]=React.useState<Campaign|null>(null);const[error,setError]=React.useState<string|null>(null);const today=todayISODate();
 const shown=campaigns.filter(c=>(!status||c.negotiation_status===status)&&(!search||`${c.name} ${c.brand_name??""}`.toLowerCase().includes(search.toLowerCase())));
 function saved(c:Campaign){setCampaigns(p=>[c,...p.filter(x=>x.id!==c.id)]);}async function archive(c:Campaign){if(!confirm(`Arquivar “${c.name}”?`))return;const r=await archiveCampaignAction(c.id);if("error"in r)setError(r.error);else setCampaigns(p=>p.filter(x=>x.id!==c.id));}
 return <div className="flex flex-col gap-5"><div className="flex flex-col gap-3 sm:flex-row"><Input aria-label="Buscar campanhas" placeholder="Buscar por campanha ou marca" value={search} onChange={e=>setSearch(e.target.value)}/><Select aria-label="Filtrar negociação" value={status} onChange={e=>setStatus(e.target.value)}><option value="">Todas as negociações</option>{NEGOTIATION_STATUSES.map(s=><option key={s} value={s}>{NEGOTIATION_STATUS_LABELS[s]}</option>)}</Select><Button className="shrink-0 gap-2" onClick={()=>{setEditing(null);setOpen(true)}}><Plus className="h-4 w-4"/>Nova campanha</Button></div>{error?<p className="text-sm text-destructive">{error}</p>:null}{shown.length===0?<EmptyState title="Nenhuma campanha encontrada" description="Cadastre a primeira parceria ou ajuste os filtros."/>:<div className="grid gap-4 lg:grid-cols-2">{shown.map(c=>{const f=campaignFinancials(c,payments,today);const overdue=isDeliveryOverdue(c,today);return <Card key={c.id}><CardContent className="flex flex-col gap-4 p-5"><div className="flex items-start justify-between gap-3"><div><Link href={`/negocio/campanhas/${c.id}`} className="font-serif text-xl font-semibold hover:text-primary">{c.name}</Link><p className="text-sm text-muted-foreground">{c.brand_name||"Marca não informada"} · {NEGOTIATION_STATUS_LABELS[c.negotiation_status]}</p></div>{overdue?<span className="flex items-center gap-1 text-xs font-medium text-destructive"><AlertTriangle className="h-3.5 w-3.5"/>Entrega vencida</span>:null}</div><div className="grid grid-cols-3 gap-2 text-sm"><Metric label="Contratado" value={formatCurrency(f.contracted,c.currency)}/><Metric label="Recebido" value={formatCurrency(f.received,c.currency)}/><Metric label="A receber" value={formatCurrency(f.balance,c.currency)}/></div><div className="flex flex-wrap justify-end gap-2"><Button variant="outline" size="sm" onClick={()=>{setEditing(c);setOpen(true)}}>Editar</Button><Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={()=>archive(c)}><Archive className="h-3.5 w-3.5"/>Arquivar</Button><Button asChild size="sm"><Link href={`/negocio/campanhas/${c.id}`}>Abrir</Link></Button></div></CardContent></Card>})}</div>}<CampaignFormDialog open={open} onOpenChange={setOpen} campaign={editing} accounts={accounts} onSaved={saved}/></div>;
}
function Metric({label,value}:{label:string;value:string}){return <div><p className="text-xs text-muted-foreground">{label}</p><p className="font-medium">{value}</p></div>}
