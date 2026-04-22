import { useEffect, useRef, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bot, User } from "lucide-react";

export type QuestionModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

type ChatMessage = {
    id: string;
    role: "user" | "assistant";
    content: string;
};

function newId() {
    return crypto.randomUUID();
}

export default function QuestionModal({ open, onOpenChange }: QuestionModalProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [prompt, setPrompt] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) {
            return;
        }
        setMessages([]);
        setPrompt("");
        setError(null);
        setIsSubmitting(false);
    }, [open]);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) {
            return;
        }
        el.scrollTop = el.scrollHeight;
    }, [messages]);

    const handleSubmit = async () => {
        const trimmed = prompt.trim();

        if (!trimmed) {
            setError("Digite uma mensagem.");
            return;
        }

        setError(null);
        setIsSubmitting(true);
        setPrompt("");

        const userMsg: ChatMessage = { id: newId(), role: "user", content: trimmed };
        const assistantId = newId();
        const assistantPlaceholder: ChatMessage = {
            id: assistantId,
            role: "assistant",
            content: "",
        };

        setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);

        const historyForApi = [...messages, userMsg].map(({ role, content }) => ({
            role,
            content,
        }));

        try {
            const response = await fetch("/question", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: historyForApi }),
            });

            if (!response.ok) {
                setMessages((prev) => prev.filter((m) => m.id !== assistantId));
                const data = (await response.json().catch(() => ({}))) as {
                    message?: string;
                    error?: string;
                };
                setError(data.message ?? data.error ?? "Não foi possível obter a resposta.");
                return;
            }

            const contentType = response.headers.get("Content-Type") ?? "";
            if (!contentType.includes("text/plain")) {
                setMessages((prev) => prev.filter((m) => m.id !== assistantId));
                setError("Resposta inesperada do servidor.");
                return;
            }

            const reader = response.body?.getReader();
            if (!reader) {
                setMessages((prev) => prev.filter((m) => m.id !== assistantId));
                setError("Não foi possível ler a resposta.");
                return;
            }

            const decoder = new TextDecoder();
            let accumulated = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    break;
                }
                accumulated += decoder.decode(value, { stream: true });
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === assistantId ? { ...m, content: accumulated } : m,
                    ),
                );
            }
            accumulated += decoder.decode();

            const finalText = accumulated.trim();
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === assistantId
                        ? { ...m, content: finalText || "Resposta vazia." }
                        : m,
                ),
            );
        } catch {
            setMessages((prev) => prev.filter((m) => m.id !== assistantId));
            setError("Erro de rede ou do servidor.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
                <div className="px-6 pt-6">
                    <DialogHeader>
                        <DialogTitle>Chat</DialogTitle>
                        <DialogDescription>
                            A conversa continua entre as mensagens; cada envio usa o histórico
                            completo.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div
                    ref={scrollRef}
                    className="flex min-h-[240px] max-h-[min(420px,45vh)] flex-col gap-4 overflow-y-auto px-6 py-4"
                >
                    {messages.length === 0 ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">
                            Escreva abaixo para começar.
                        </p>
                    ) : (
                        messages.map((m) => (
                            <div
                                key={m.id}
                                className={
                                    m.role === "user"
                                        ? "flex items-start justify-end gap-2"
                                        : "flex items-start justify-start gap-2"
                                }
                            >
                                {m.role === "assistant" ? (
                                    <div
                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
                                        aria-hidden
                                    >
                                        <Bot className="h-4 w-4" />
                                    </div>
                                ) : null}
                                <div
                                    className={
                                        m.role === "user"
                                            ? "max-w-[85%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
                                            : "max-w-[85%] rounded-lg bg-muted px-3 py-2 text-sm text-foreground"
                                    }
                                >
                                    <p className="whitespace-pre-wrap break-words">
                                        {m.content ||
                                            (m.role === "assistant" && isSubmitting ? "…" : "")}
                                    </p>
                                </div>
                                {m.role === "user" ? (
                                    <div
                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"
                                        aria-hidden
                                    >
                                        <User className="h-4 w-4" />
                                    </div>
                                ) : null}
                            </div>
                        ))
                    )}
                </div>

                {error ? (
                    <div className="px-6">
                        <div
                            className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive"
                            role="alert"
                        >
                            {error}
                        </div>
                    </div>
                ) : null}

                <div className="space-y-3 border-t border-border/60 bg-card/50 px-6 py-4">
                    <Textarea
                        id="chat-prompt"
                        name="chatPrompt"
                        placeholder="Escreva sua mensagem…"
                        value={prompt}
                        disabled={isSubmitting}
                        rows={3}
                        onChange={(event) => setPrompt(event.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                void handleSubmit();
                            }
                        }}
                    />
                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            disabled={isSubmitting}
                            onClick={() => onOpenChange(false)}
                        >
                            Fechar
                        </Button>
                        <Button type="button" disabled={isSubmitting} onClick={() => void handleSubmit()}>
                            {isSubmitting ? "Enviando…" : "Enviar"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
