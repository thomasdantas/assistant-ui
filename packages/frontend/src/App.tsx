import { useState } from "react";
import { Button } from "@/components/ui/button";
import QuestionModal from "@/components/QuestionModal";

export default function App() {
    const [chatOpen, setChatOpen] = useState(false);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4">
            <div className="max-w-md text-center space-y-2">
                <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
                    Assistente
                </h1>
                <p className="text-sm text-muted-foreground">
                    Abra o chat para enviar uma pergunta. A resposta é gerada em tempo real.
                </p>
            </div>
            <Button size="lg" onClick={() => setChatOpen(true)}>
                Abrir chat
            </Button>
            <QuestionModal open={chatOpen} onOpenChange={setChatOpen} />
        </div>
    );
}
