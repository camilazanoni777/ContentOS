"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { testConnection, type DiagnosticResult } from "@/lib/connection-diagnostic";

/**
 * Página estática de fallback offline do Cami Content OS.
 *
 * Concebida para funcionar em qualquer cenário:
 *  1. Com Tailwind e JS carregados normalmente.
 *  2. Servida em cache pelo Service Worker enquanto o dispositivo está
 *     completamente desconectado da internet (sem acesso aos chunks CSS do Next.js).
 *     Para esse caso, inclui estilos críticos autocontidos (inline CSS) garantindo
 *     a tipografia sans-serif, fundo linho e identidade do produto, sem jamais
 *     recorrer à fonte Times New Roman ou links sem formatação do navegador.
 */

export default function OfflinePage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = React.useState(false);
  const [diagnostic, setDiagnostic] = React.useState<DiagnosticResult | null>(null);
  const [reconnected, setReconnected] = React.useState(false);

  const handleRetry = React.useCallback(async () => {
    setIsChecking(true);
    setDiagnostic(null);

    try {
      const result = await testConnection();
      if (result.state === "online") {
        setReconnected(true);
        // Aguarda 800ms para feedback visual antes de redirecionar
        setTimeout(() => {
          router.push("/hoje");
        }, 800);
      } else {
        setDiagnostic(result);
      }
    } catch {
      setDiagnostic({
        state: "offline_device",
        title: "Você continua offline",
        message: "Não foi possível restabelecer contato com o servidor. Verifique sua conexão.",
        actionText: "Tentar novamente",
        canRetry: true,
      });
    } finally {
      setIsChecking(false);
    }
  }, [router]);

  // Ao detectar o evento online do navegador, inicia automaticamente a verificação
  React.useEffect(() => {
    const onOnline = () => {
      handleRetry();
    };

    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("online", onOnline);
    };
  }, [handleRetry]);

  return (
    <>
      {/* Estilos críticos autocontidos: garantem renderização fiel mesmo sem chunks externos */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            :root {
              --offline-bg: #faf8f5;
              --offline-surface: #ffffff;
              --offline-border: #e7e5e4;
              --offline-primary: #ff2e88;
              --offline-primary-hover: #e01a70;
              --offline-text: #1c1917;
              --offline-muted: #78716c;
              --offline-amber-bg: #fffbeb;
              --offline-amber-border: #fde68a;
              --offline-amber-text: #92400e;
              --offline-green-bg: #f0fdf4;
              --offline-green-border: #bbf7d0;
              --offline-green-text: #166534;
            }
            body {
              margin: 0;
              padding: 0;
              background-color: var(--offline-bg) !important;
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Plus Jakarta Sans", sans-serif !important;
              color: var(--offline-text) !important;
              -webkit-font-smoothing: antialiased;
            }
            .offline-container {
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 1.5rem;
              box-sizing: border-box;
            }
            .offline-card {
              width: 100%;
              max-width: 440px;
              background-color: var(--offline-surface);
              border: 1px solid var(--offline-border);
              border-radius: 1.25rem;
              padding: 2.25rem 2rem;
              box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
              text-align: center;
              box-sizing: border-box;
            }
            .offline-brand {
              display: inline-flex;
              align-items: center;
              gap: 0.625rem;
              margin-bottom: 1.5rem;
            }
            .offline-logo {
              width: 2.25rem;
              height: 2.25rem;
              border-radius: 9999px;
              background: linear-gradient(135deg, #ff2e88 0%, #e01a70 100%);
              color: #ffffff;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 700;
              font-size: 1.125rem;
              box-shadow: 0 2px 6px rgba(255, 46, 136, 0.3);
            }
            .offline-brand-text {
              text-align: left;
            }
            .offline-brand-title {
              font-weight: 700;
              font-size: 0.9375rem;
              line-height: 1.1;
              color: var(--offline-text);
            }
            .offline-brand-sub {
              font-size: 0.625rem;
              letter-spacing: 0.08em;
              font-weight: 600;
              color: var(--offline-primary);
              text-transform: uppercase;
            }
            .offline-icon-circle {
              width: 3.5rem;
              height: 3.5rem;
              border-radius: 9999px;
              background-color: #fef2f2;
              border: 1px solid #fee2e2;
              color: #ef4444;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              margin-bottom: 1.25rem;
            }
            .offline-title {
              font-size: 1.5rem;
              font-weight: 800;
              letter-spacing: -0.025em;
              color: var(--offline-text);
              margin: 0 0 0.5rem 0;
            }
            .offline-description {
              font-size: 0.875rem;
              line-height: 1.5;
              color: var(--offline-muted);
              margin: 0 0 1.25rem 0;
            }
            .offline-warning-box {
              background-color: var(--offline-amber-bg);
              border: 1px solid var(--offline-amber-border);
              border-radius: 0.75rem;
              padding: 0.75rem 1rem;
              margin-bottom: 1.5rem;
              font-size: 0.8125rem;
              color: var(--offline-amber-text);
              text-align: left;
              line-height: 1.4;
            }
            .offline-feedback-box {
              border-radius: 0.75rem;
              padding: 0.75rem 1rem;
              margin-bottom: 1.25rem;
              font-size: 0.8125rem;
              text-align: left;
              line-height: 1.4;
            }
            .offline-feedback-error {
              background-color: #fef2f2;
              border: 1px solid #fee2e2;
              color: #991b1b;
            }
            .offline-feedback-success {
              background-color: var(--offline-green-bg);
              border: 1px solid var(--offline-green-border);
              color: var(--offline-green-text);
            }
            .offline-actions {
              display: flex;
              flex-direction: column;
              gap: 0.75rem;
            }
            .offline-btn-primary {
              width: 100%;
              min-height: 2.75rem;
              padding: 0.625rem 1.25rem;
              background-color: var(--offline-primary);
              color: #ffffff;
              border: none;
              border-radius: 0.625rem;
              font-weight: 600;
              font-size: 0.875rem;
              cursor: pointer;
              transition: background-color 0.15s ease, opacity 0.15s ease;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              gap: 0.5rem;
              box-shadow: 0 2px 4px rgba(255, 46, 136, 0.2);
            }
            .offline-btn-primary:hover:not(:disabled) {
              background-color: var(--offline-primary-hover);
            }
            .offline-btn-primary:disabled {
              opacity: 0.65;
              cursor: not-allowed;
            }
            .offline-btn-secondary {
              width: 100%;
              min-height: 2.5rem;
              padding: 0.5rem 1rem;
              background-color: transparent;
              color: var(--offline-muted);
              border: 1px solid var(--offline-border);
              border-radius: 0.625rem;
              font-weight: 500;
              font-size: 0.8125rem;
              cursor: pointer;
              text-decoration: none;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              transition: color 0.15s ease, border-color 0.15s ease;
            }
            .offline-btn-secondary:hover {
              color: var(--offline-text);
              border-color: #d6d3d1;
              background-color: rgba(0, 0, 0, 0.02);
            }
            .offline-spinner {
              width: 1rem;
              height: 1rem;
              border: 2px solid rgba(255, 255, 255, 0.3);
              border-top-color: #ffffff;
              border-radius: 9999px;
              animation: offline-spin 0.8s linear infinite;
            }
            @keyframes offline-spin {
              to { transform: rotate(360deg); }
            }
          `,
        }}
      />

      <main className="offline-container bg-background">
        <div className="offline-card bg-card border-border">
          {/* Logo / Monograma */}
          <div className="offline-brand">
            <div className="offline-logo">C</div>
            <div className="offline-brand-text">
              <div className="offline-brand-title">Cami Content OS</div>
              <div className="offline-brand-sub">Sistema Operacional Criativo</div>
            </div>
          </div>

          {/* Ícone de Conexão Indisponível */}
          <div className="offline-icon-circle" aria-hidden="true">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
              <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
              <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
              <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
              <line x1="12" y1="20" x2="12.01" y2="20" />
            </svg>
          </div>

          {/* Título e Explicação */}
          <h1 className="offline-title">Você está offline</h1>
          <p className="offline-description">
            Não foi possível carregar a página porque o dispositivo está sem acesso à internet ou o servidor está temporariamente inacessível.
          </p>

          {/* Aviso claro sobre persistência offline */}
          <div className="offline-warning-box">
            <strong>Importante:</strong> nenhuma alteração é salva offline — o Cami Content OS não armazena rascunhos locais para sincronização posterior.
          </div>

          {/* Feedback de verificação */}
          {reconnected ? (
            <div className="offline-feedback-box offline-feedback-success" role="status">
              <strong>Conexão restabelecida!</strong> Redirecionando para o aplicativo...
            </div>
          ) : null}

          {diagnostic ? (
            <div className="offline-feedback-box offline-feedback-error" role="alert">
              <strong>{diagnostic.title}:</strong> {diagnostic.message}
            </div>
          ) : null}

          {/* Ações */}
          <div className="offline-actions">
            <button
              type="button"
              onClick={handleRetry}
              disabled={isChecking || reconnected}
              className="offline-btn-primary"
            >
              {isChecking ? (
                <>
                  <span className="offline-spinner" aria-hidden="true" />
                  <span>Verificando conexão...</span>
                </>
              ) : (
                <span>Tentar novamente</span>
              )}
            </button>

            <a href="/login" className="offline-btn-secondary">
              Acessar tela de login
            </a>
          </div>
        </div>
      </main>
    </>
  );
}
