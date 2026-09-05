/**
 * Porta de serviço para um futuro upload direto de arquivos (vídeo bruto,
 * vídeo editado, capa) via Supabase Storage.
 *
 * Nenhuma tela chama isto ainda: Storage não está configurado neste
 * projeto ainda (nenhum bucket criado), então a página Edição trabalha só
 * com links (raw_file_url/edited_file_url como texto) — ver Prompt da Fase
 * 5 ("Se Supabase Storage já estiver configurado e for seguro, permita
 * upload. Caso contrário, trabalhe com links..."). Este arquivo existe só
 * para o workspace já ter um contrato estável para integrar quando Storage
 * for configurado (ver "Upload e organização de arquivos" em TODO.md →
 * Pós-MVP), sem precisar redesenhar a UI depois.
 */

export type FileUploadKind = "raw" | "edited" | "cover";

export interface FileUploadRequest {
  contentItemId: string;
  kind: FileUploadKind;
  file: File;
}

export interface FileUploadResult {
  url: string;
}

export interface FileUploadService {
  upload(request: FileUploadRequest): Promise<FileUploadResult>;
}

/**
 * Implementação padrão (única existente por enquanto): lança erro de
 * propósito. Substitua por uma implementação real (bucket do Supabase
 * Storage com RLS por usuária) quando essa fase for priorizada.
 */
export const notImplementedFileUploadService: FileUploadService = {
  async upload() {
    throw new Error("Upload de arquivos via Supabase Storage ainda não foi implementado.");
  },
};
