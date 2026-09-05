"use client";

import * as React from "react";
import { CheckCircle2, MessageSquare, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { addReviewComment, setReviewCommentStatus } from "@/lib/actions/editing";
import type { ContentReviewComment } from "@/types/domain";
import { formatDateTimeBR } from "@/lib/dates";

function formatCommentTime(iso: string): string {
  return formatDateTimeBR(iso);
}

interface ReviewCommentsProps {
  contentItemId: string;
  initialComments: ContentReviewComment[];
}

/**
 * Comentários/revisões da página Edição: cada um tem status
 * aberto/resolvido (pode ser reaberto) — não é um histórico imutável como
 * as versões de roteiro. Abertos aparecem primeiro.
 */
export function ReviewComments({ contentItemId, initialComments }: ReviewCommentsProps) {
  const [comments, setComments] = React.useState(initialComments);
  const [body, setBody] = React.useState("");
  const [authorName, setAuthorName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [sending, setSending] = React.useState(false);

  const sorted = [...comments].sort((a, b) => {
    if (a.status !== b.status) return a.status === "open" ? -1 : 1;
    return a.created_at.localeCompare(b.created_at);
  });
  const openCount = comments.filter((comment) => comment.status === "open").length;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSending(true);
    const result = await addReviewComment(contentItemId, { body, authorName });
    setSending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setComments((current) => [...current, result.comment]);
    setBody("");
  }

  async function toggleStatus(comment: ContentReviewComment) {
    const nextStatus = comment.status === "open" ? "resolved" : "open";
    const result = await setReviewCommentStatus(contentItemId, comment.id, nextStatus);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setComments((current) => current.map((entry) => (entry.id === comment.id ? result.comment : entry)));
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground">
        {openCount > 0 ? `${openCount} comentário${openCount === 1 ? "" : "s"} em aberto` : "Nenhum comentário em aberto"}
      </p>
      <ul className="flex flex-col gap-2.5">
        {sorted.length === 0 ? (
          <li className="text-sm text-muted-foreground">Nenhum comentário ainda.</li>
        ) : (
          sorted.map((comment) => (
            <li key={comment.id} className={`flex flex-col gap-1.5 rounded-md border p-3 ${comment.status === "resolved" ? "border-border/60 bg-muted/30" : "border-border"}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                  {comment.author_name || "Sem nome"} · {formatCommentTime(comment.created_at)}
                </span>
                <Button type="button" variant="ghost" size="sm" className="h-7 gap-1.5 px-2 text-xs" onClick={() => toggleStatus(comment)}>
                  {comment.status === "open" ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Marcar resolvido
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Reabrir
                    </>
                  )}
                </Button>
              </div>
              <p className={`text-sm ${comment.status === "resolved" ? "text-muted-foreground line-through decoration-muted-foreground/40" : "text-foreground"}`}>
                {comment.body}
              </p>
            </li>
          ))
        )}
      </ul>
      <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
        <Input value={authorName} onChange={(event) => setAuthorName(event.target.value)} placeholder="Seu nome (opcional)" aria-label="Seu nome" />
        <Textarea value={body} onChange={(event) => setBody(event.target.value)} rows={2} placeholder="Escreva um comentário de revisão..." aria-label="Novo comentário" />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" size="sm" className="self-start" disabled={sending || !body.trim()}>
          {sending ? "Enviando..." : "Comentar"}
        </Button>
      </form>
    </div>
  );
}
