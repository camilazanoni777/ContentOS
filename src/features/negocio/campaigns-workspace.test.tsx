import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Campaign } from "@/types/domain";

const saved: Campaign = { id:"c1",user_id:"u1",name:"Campanha Aurora",description:null,brand_name:"Marca teste",contact_name:null,contact_email:null,contact_phone:null,contact_notes:null,first_contact_date:null,campaign_type:"paid_post",account_id:null,delivery_due_date:null,published_at:null,contracted_fee:1500,currency:"BRL",negotiation_status:"approved",contract_status:"signed",delivery_status:"in_production",payment_status:"awaiting_payment",expected_payment_date:null,briefing_url:null,contract_url:null,folder_url:null,publication_url:null,responsible_name:null,notes:null,starts_at:null,ends_at:null,created_at:"2026-09-04T00:00:00Z",updated_at:"2026-09-04T00:00:00Z",archived_at:null };
const saveCampaign=vi.fn();
vi.mock("@/lib/actions/negocio",()=>({saveCampaign:(...args:unknown[])=>saveCampaign(...args),archiveCampaignAction:vi.fn()}));
import { CampaignsWorkspace } from "./campaigns-workspace";

describe("CampaignsWorkspace",()=>{
 it("executa o fluxo principal de criar e listar uma campanha",async()=>{saveCampaign.mockResolvedValue({success:true,value:saved});const user=userEvent.setup();render(<CampaignsWorkspace initialCampaigns={[]} payments={[]} accounts={[]}/>);expect(screen.getByText("Nenhuma campanha encontrada")).toBeInTheDocument();await user.click(screen.getByRole("button",{name:"Nova campanha"}));await user.type(screen.getByLabelText("Nome da campanha"),"Campanha Aurora");await user.type(screen.getByLabelText("Marca"),"Marca teste");await user.click(screen.getByRole("button",{name:"Salvar campanha"}));expect(await screen.findByRole("link",{name:"Campanha Aurora"})).toHaveAttribute("href","/negocio/campanhas/c1");expect(saveCampaign).toHaveBeenCalledTimes(1)});
});
