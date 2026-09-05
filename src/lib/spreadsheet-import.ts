import type { Workbook } from "exceljs";
import { createHash } from "node:crypto";

export const IMPORT_SCHEMA_VERSION = "1.0";
export const MAX_IMPORT_BYTES = Number(process.env.IMPORT_MAX_BYTES ?? 10 * 1024 * 1024);
export const ACCEPTED_IMPORT_TYPES = ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];

export type ImportError = { sheet: string; row: number; field: string; value: unknown; reason: string };
export type ImportContent = Record<string, string | null> & { legacy_id: string; title: string; status: string; resolution: "skip" | "update" | "create" };
export type ImportPreview = {
  schema_version: string;
  sheets: string[];
  ignored_sheets: string[];
  mappings: Record<string, string[]>;
  payload: { content_items: ImportContent[]; modules: Record<string, Record<string, unknown>[]>; errors: ImportError[]; taxonomy_suggestions: Record<string, string[]> };
  summary: { read: number; valid: number; rejected: number; duplicates: number };
};

const aliases: Record<string, string> = {
  id: "legacy_id", titulo: "title", "data da ideia": "idea_date", gancho: "hook", resumo: "summary",
  pilar: "pillar", formato: "format", objetivo: "objective", cta: "cta", prioridade: "priority",
  status: "status", referencia: "reference_text", "referência": "reference_text", link: "reference_url",
  potencial: "potential", facilidade: "production_ease", observacoes: "notes", "observações": "notes",
  "data planejada": "planned_at", "data publicada": "published_at", url: "published_url", prazo: "production_due_at",
};
const statusMap: Record<string, string> = { ideia:"idea", pesquisa:"researching", roteiro:"scripting", "pronto para gravar":"ready_to_record", gravado:"recorded", edicao:"editing", "edição":"editing", aprovacao:"awaiting_approval", "aprovação":"awaiting_approval", agendado:"scheduled", publicado:"published", reaproveitar:"repurpose", arquivado:"archived", cancelado:"canceled" };

function key(value: unknown): string { return String(value ?? "").trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }
function plain(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "object" && value && "result" in value) return plain((value as { result?: unknown }).result);
  if (typeof value === "object") return null; // hyperlinks/rich text/formulas sem resultado não viram código/dado.
  return String(value).trim() || null;
}
export function parseSpreadsheetDate(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
  if (typeof value === "number" && value > 0) return new Date(Date.UTC(1899, 11, 30) + value * 86400000).toISOString();
  const text = String(value).trim(); const br = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/.exec(text);
  if (br) { const d = new Date(Date.UTC(+br[3], +br[2]-1, +br[1], +(br[4]??0), +(br[5]??0))); return d.getUTCFullYear()===+br[3]&&d.getUTCMonth()===+br[2]-1&&d.getUTCDate()===+br[1]?d.toISOString():null; }
  return null;
}
export function parseCheckbox(value: unknown): boolean | null { const v=String(value??"").trim(); return v==="☑"?true:v==="☐"?false:v===""?null:null; }
export function fileHash(buffer: Buffer): string { return createHash("sha256").update(buffer).digest("hex"); }

function rows(sheet: { rowCount:number; getRow(n:number): { cellCount:number; getCell(n:number): { value: unknown } } }): Record<string, unknown>[] {
  if (!sheet.rowCount) return []; const header=sheet.getRow(1); const names=Array.from({length:header.cellCount},(_,i)=>key(header.getCell(i+1).value));
  const result: Record<string,unknown>[]=[];
  for(let n=2;n<=sheet.rowCount;n++){const row=sheet.getRow(n); const item:Record<string,unknown>={_row:n}; let any=false; names.forEach((name,i)=>{const val=row.getCell(i+1).value;if(val!==null&&val!==undefined&&val!=="")any=true;item[name]=val});if(any)result.push(item)} return result;
}
function mapContent(source: Record<string,unknown>, sheet:string, errors:ImportError[]): ImportContent | null {
  const out:Record<string,string|null>={}; for(const [header,value] of Object.entries(source)){const target=aliases[header];if(target)out[target]=plain(value)}
  const legacy=out.legacy_id; const title=out.title; if(!legacy){errors.push({sheet,row:Number(source._row),field:"ID",value:null,reason:"ID legado obrigatório"});return null} if(!title){errors.push({sheet,row:Number(source._row),field:"Título",value:null,reason:"Título obrigatório"});return null}
  for(const field of ["idea_date","planned_at","published_at","production_due_at"]){if(out[field]){const parsed=parseSpreadsheetDate(source[Object.keys(source).find(h=>aliases[h]===field)??""]);if(!parsed){errors.push({sheet,row:Number(source._row),field,value:out[field],reason:"Data inválida"});return null}out[field]=parsed}}
  const rawStatus=key(out.status); const status=rawStatus?statusMap[rawStatus]??(Object.values(statusMap).includes(rawStatus)?rawStatus:null):"idea";
  if(!status){errors.push({sheet,row:Number(source._row),field:"status",value:out.status,reason:"Status desconhecido"});return null}
  return {...out,legacy_id:legacy,title,status,resolution:"create"} as ImportContent;
}

export function previewWorkbook(workbook: Workbook): ImportPreview {
  const sheets=workbook.worksheets.map(s=>s.name); const ignored=sheets.filter(n=>["calculos","exemplos"].includes(key(n))||workbook.getWorksheet(n)?.state==="hidden");
  const find=(name:string)=>workbook.worksheets.find(s=>key(s.name)===key(name)&&!ignored.includes(s.name)); const ideas=find("Banco de Ideias"), contents=find("Conteúdos");
  const errors:ImportError[]=[]; if(!ideas)errors.push({sheet:"Banco de Ideias",row:0,field:"aba",value:null,reason:"Aba obrigatória ausente"}); if(!contents)errors.push({sheet:"Conteúdos",row:0,field:"aba",value:null,reason:"Aba obrigatória ausente"});
  const byLegacy=new Map<string,ImportContent>(); let read=0,duplicates=0;
  for(const sheet of [ideas,contents]) if(sheet) for(const source of rows(sheet)){read++;const mapped=mapContent(source,sheet.name,errors);if(!mapped)continue;const current=byLegacy.get(mapped.legacy_id);if(current){duplicates++;byLegacy.set(mapped.legacy_id,{...current,...Object.fromEntries(Object.entries(mapped).filter(([,v])=>v!==null&&v!==""))} as ImportContent)}else byLegacy.set(mapped.legacy_id,mapped)}
  const moduleNames=["Check-in Diário","Métricas dos Conteúdos","Métricas do Perfil","Metas","Resumo Semanal","Parcerias e Vendas","Configurações"];
  const sanitize=(row:Record<string,unknown>)=>Object.fromEntries(Object.entries(row).map(([name,value])=>[name,value instanceof Date?value.toISOString():typeof value==="number"||typeof value==="boolean"?value:plain(value)]));
  const modules:Record<string,Record<string,unknown>[]>=Object.fromEntries(moduleNames.map(n=>[n,find(n)?rows(find(n)!).map(sanitize):[]]));
  const suggestions:Record<string,string[]>={pillar:[],format:[],objective:[],cta:[],priority:[]}; for(const item of byLegacy.values())for(const k of Object.keys(suggestions))if(item[k]&&!suggestions[k].includes(item[k]!))suggestions[k].push(item[k]!);
  return {schema_version:IMPORT_SCHEMA_VERSION,sheets,ignored_sheets:ignored,mappings:Object.fromEntries(sheets.map(n=>[n,(find(n)?Object.keys(rows(find(n)!)[0]??{}):[]).filter(k=>k!=="_row")])),payload:{content_items:[...byLegacy.values()],modules,errors,taxonomy_suggestions:suggestions},summary:{read,valid:byLegacy.size,rejected:errors.filter(e=>e.row>0).length,duplicates}};
}

export async function parseXlsx(buffer: Buffer): Promise<ImportPreview> {
  const ExcelJS=await import("exceljs"); const workbook=new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer); return previewWorkbook(workbook);
}
