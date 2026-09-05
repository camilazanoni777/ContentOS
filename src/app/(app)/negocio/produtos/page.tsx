import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ErrorState } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/page-header";
import { ProductsSalesWorkspace } from "@/features/negocio/products-sales-workspace";
import { listProducts } from "@/lib/data/products";
import { listSalesRecords } from "@/lib/data/sales-records";
import { listCampaigns } from "@/lib/data/campaigns";
import { listContentItems } from "@/lib/data/content-items";
import { listMetricSnapshotsForItems } from "@/lib/data/metric-snapshots";
import { createClient } from "@/lib/supabase/server";
export const metadata:Metadata={title:"Produtos e vendas — Cami Content OS"};
export default async function ProductsPage(){let db;try{db=await createClient()}catch{return <ErrorState title="Supabase não configurado"/>}const{data:{user}}=await db.auth.getUser();if(!user)redirect("/login?proximo=/negocio/produtos");let data:null|{products:Awaited<ReturnType<typeof listProducts>>;records:Awaited<ReturnType<typeof listSalesRecords>>;campaigns:Awaited<ReturnType<typeof listCampaigns>>;contents:Awaited<ReturnType<typeof listContentItems>>;snapshots:Awaited<ReturnType<typeof listMetricSnapshotsForItems>>}=null;try{const[products,records,campaigns,contents]=await Promise.all([listProducts(db,{includeInactive:true}),listSalesRecords(db),listCampaigns(db),listContentItems(db)]);const snapshots=await listMetricSnapshotsForItems(db,contents.map(c=>c.id));data={products,records,campaigns,contents,snapshots}}catch{/* estado de erro abaixo */}return <div className="flex flex-col gap-6"><PageHeader title="Produtos e vendas" description="Catálogo, atribuição de resultados e fonte de verdade para vendas." breadcrumbs={[{label:"Negócio"},{label:"Produtos e vendas"}]}/>{data?<ProductsSalesWorkspace initialProducts={data.products} initialRecords={data.records} campaigns={data.campaigns} contents={data.contents} metricSnapshots={data.snapshots}/>:<ErrorState title="Não foi possível carregar Produtos e vendas"/>}</div>}
