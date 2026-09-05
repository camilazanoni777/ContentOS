"use client";

import * as React from "react";
import { useForm, type UseFormRegister } from "react-hook-form";
import { Trash2 } from "lucide-react";

import { FormDrawer } from "@/components/layout/form-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { removeProfileSnapshot, saveProfileSnapshot } from "@/lib/actions/perfil";
import {
  emptyProfileSnapshotFormValues,
  profileSnapshotToFormValues,
  type ProfileSnapshotFormValues,
} from "./profile-snapshot-form-types";
import type { InstagramAccount, ProfileSnapshot } from "@/types/domain";

interface FieldSpec {
  name: keyof ProfileSnapshotFormValues;
  label: string;
  step?: string;
}

const CRESCIMENTO: FieldSpec[] = [
  { name: "followers", label: "Seguidores atuais" },
  { name: "following", label: "Seguindo" },
];

const ALCANCE: FieldSpec[] = [
  { name: "views", label: "Views" },
  { name: "reach", label: "Alcance" },
  { name: "impressions", label: "Impressões" },
  { name: "accountsEngaged", label: "Contas engajadas" },
  { name: "interactions", label: "Interações" },
];

const PERFIL_E_CONVERSAO: FieldSpec[] = [
  { name: "profileVisits", label: "Visitas ao perfil" },
  { name: "websiteClicks", label: "Cliques" },
  { name: "messages", label: "Mensagens" },
];

const NEGOCIO: FieldSpec[] = [
  { name: "leads", label: "Leads" },
  { name: "sales", label: "Vendas" },
  { name: "revenue", label: "Receita (R$)", step: "0.01" },
];

const PRODUCAO: FieldSpec[] = [
  { name: "postsCount", label: "Conteúdos publicados" },
  { name: "storiesCount", label: "Stories publicados" },
  { name: "hoursInvested", label: "Horas investidas", step: "0.25" },
];

function NumberField({ field, register }: { field: FieldSpec; register: UseFormRegister<ProfileSnapshotFormValues> }) {
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={`perfil-${field.name}`} className="text-xs">
        {field.label}
      </Label>
      <Input
        id={`perfil-${field.name}`}
        type="number"
        min="0"
        step={field.step ?? "1"}
        inputMode="decimal"
        placeholder="—"
        {...register(field.name)}
      />
    </div>
  );
}

function Fieldset({ legend, fields, register }: { legend: string; fields: FieldSpec[]; register: UseFormRegister<ProfileSnapshotFormValues> }) {
  return (
    <fieldset className="flex flex-col gap-3 rounded-lg border border-border p-3">
      <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{legend}</legend>
      <div className="grid grid-cols-2 gap-3">
        {fields.map((field) => (
          <NumberField key={field.name} field={field} register={register} />
        ))}
      </div>
    </fieldset>
  );
}

/**
 * Formulário isolado, montado só enquanto o drawer está aberto (mesmo
 * cuidado de MetricCaptureFormInner) — nasce sempre com valores/erro
 * limpos, sem efeito de reset. Remontado (via `key`) quando o registro
 * sendo editado muda (ver ProfileSnapshotDrawer).
 */
function ProfileSnapshotFormInner({
  existing,
  defaultAccountId,
  defaultDate,
  onOpenChange,
  onSaved,
  onDeleted,
}: {
  existing: ProfileSnapshot | null;
  defaultAccountId: string;
  defaultDate: string;
  onOpenChange: (open: boolean) => void;
  onSaved: (snapshot: ProfileSnapshot) => void;
  onDeleted: (id: string) => void;
}) {
  const [error, setError] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const defaultValues = React.useMemo<ProfileSnapshotFormValues>(() => {
    if (existing) return profileSnapshotToFormValues(existing);
    return emptyProfileSnapshotFormValues(defaultAccountId, defaultDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ProfileSnapshotFormValues>({ defaultValues });

  // Validação no servidor (profileSnapshotSchema, via saveProfileSnapshot) —
  // mesmo padrão de MetricCaptureFormInner: um erro só, não por campo.
  async function onSubmit(values: ProfileSnapshotFormValues) {
    setError(null);
    const result = await saveProfileSnapshot(values);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    onSaved(result.snapshot);
    onOpenChange(false);
  }

  async function handleDelete() {
    if (!existing) return;
    setDeleting(true);
    setError(null);
    const result = await removeProfileSnapshot(existing.id);
    setDeleting(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    onDeleted(existing.id);
    onOpenChange(false);
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <p className="text-xs text-muted-foreground">
        Campo em branco fica sem valor — nunca vira zero. Um registro por conta por dia: salvar de novo na mesma data edita o que já existe.
      </p>

      <div className="flex flex-col gap-1">
        <Label htmlFor="perfil-snapshotDate" className="text-xs">
          Data
        </Label>
        <Input id="perfil-snapshotDate" type="date" disabled={Boolean(existing)} {...register("snapshotDate")} />
      </div>

      <Fieldset legend="Seguidores" fields={CRESCIMENTO} register={register} />
      <Fieldset legend="Alcance e visualizações" fields={ALCANCE} register={register} />
      <Fieldset legend="Perfil e conversão" fields={PERFIL_E_CONVERSAO} register={register} />
      <Fieldset legend="Negócio" fields={NEGOCIO} register={register} />
      <Fieldset legend="Produção" fields={PRODUCAO} register={register} />

      <div className="flex flex-col gap-1">
        <Label htmlFor="perfil-notes" className="text-xs">
          Observações
        </Label>
        <Textarea id="perfil-notes" rows={3} placeholder="Contexto do dia — campanha rodando, evento, etc." {...register("notes")} />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="mt-auto flex items-center justify-between gap-2">
        {existing ? (
          <Button type="button" variant="ghost" className="gap-1.5 text-destructive hover:text-destructive" disabled={deleting} onClick={handleDelete}>
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            {deleting ? "Excluindo..." : "Excluir registro"}
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : "Salvar registro"}
          </Button>
        </div>
      </div>
    </form>
  );
}

interface ProfileSnapshotDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: InstagramAccount[];
  defaultAccountId: string;
  defaultDate: string;
  editSnapshot?: ProfileSnapshot | null;
  onSaved: (snapshot: ProfileSnapshot) => void;
  onDeleted: (id: string) => void;
}

/** Drawer de registro diário de Métricas do Perfil — uma conta, uma data, todos os campos opcionais. */
export function ProfileSnapshotDrawer({
  open,
  onOpenChange,
  accounts,
  defaultAccountId,
  defaultDate,
  editSnapshot,
  onSaved,
  onDeleted,
}: ProfileSnapshotDrawerProps) {
  const [accountId, setAccountId] = React.useState(editSnapshot?.account_id ?? defaultAccountId);
  const canChangeAccount = !editSnapshot;

  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={editSnapshot ? "Editar registro de perfil" : "Registrar perfil do dia"}
      description="Seguidores, alcance, conversão e negócio — um registro por conta por dia. Preencha só o que você já tem agora."
    >
      {open ? (
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor="perfil-account" className="text-xs">
              Conta
            </Label>
            <Select
              id="perfil-account"
              value={accountId}
              disabled={!canChangeAccount || accounts.length === 0}
              onChange={(event) => setAccountId(event.target.value)}
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  @{account.handle}
                </option>
              ))}
            </Select>
          </div>
          <ProfileSnapshotFormInner
            key={editSnapshot?.id ?? `new-${accountId}`}
            existing={editSnapshot ?? null}
            defaultAccountId={accountId}
            defaultDate={editSnapshot?.snapshot_date ?? defaultDate}
            onOpenChange={onOpenChange}
            onSaved={onSaved}
            onDeleted={onDeleted}
          />
        </div>
      ) : null}
    </FormDrawer>
  );
}
