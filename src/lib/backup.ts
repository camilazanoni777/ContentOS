export const BACKUP_SCHEMA_VERSION = "1.0";
export type BackupEnvelope={schema_version:string;generated_at:string;owner:{user_id:string;account_id:string|null};entities:Record<string,unknown[]>};
export function createBackup(userId:string,accountId:string|null,entities:Record<string,unknown[]>,now=new Date()):BackupEnvelope{return{schema_version:BACKUP_SCHEMA_VERSION,generated_at:now.toISOString(),owner:{user_id:userId,account_id:accountId},entities}}
export function validateBackup(value:unknown):value is BackupEnvelope{if(!value||typeof value!=="object")return false;const v=value as Partial<BackupEnvelope>;return v.schema_version===BACKUP_SCHEMA_VERSION&&typeof v.generated_at==="string"&&!!v.owner&&typeof v.owner.user_id==="string"&&!!v.entities&&typeof v.entities==="object"}
/** Neutraliza gatilhos de fórmula (=, +, -, @) reconhecidos por Excel/Sheets ao abrir o CSV, prefixando com um apóstrofo — mitigação padrão de CSV injection. */
function escapeCsvFormula(value: string): string {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}
export function toCsv(rows:Record<string,unknown>[]):string{if(!rows.length)return "";const headers=[...new Set(rows.flatMap(Object.keys))];const cell=(v:unknown)=>{const s=v===null||v===undefined?"":typeof v==="object"?JSON.stringify(v):String(v);return `"${escapeCsvFormula(s).replaceAll('"','""')}"`};return `\uFEFF${headers.map(cell).join(",")}\r\n${rows.map(r=>headers.map(h=>cell(r[h])).join(",")).join("\r\n")}`}
