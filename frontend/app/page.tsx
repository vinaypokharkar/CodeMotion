"use client";

import Navbar from "@/components/landing/Navbar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

export default function Home() {
  const router = useRouter();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const projectId = uuidv4();
      router.push(`/project/${projectId}`);
    }
  };

  const handleSendClick = () => {
    const projectId = uuidv4();
    router.push(`/project/${projectId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4 pt-16">
        <div className="flex w-full max-w-3xl flex-col items-center gap-8">
          {/* Subtle branding */}
          <div className="flex items-center gap-2 text-3xl font-semibold tracking-tight text-foreground/80">
            <Sparkles className="h-8 w-8" />
            Animind
          </div>

          <div className="relative w-full">
            <div className="relative flex flex-col rounded-xl border border-border/50 bg-background shadow-xl ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              <Textarea
                placeholder="Describe the mathematical animation you want to create..."
                className="min-h-[50px] w-full resize-none border-none bg-transparent p-6 text-lg shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                onKeyDown={handleKeyDown}
              />
              <div className="flex items-center justify-between p-4">
                <div className="flex gap-2">
                  {/* Placeholder for future tools/attachments if needed */}
                </div>
                <Button
                  size="icon"
                  className="h-10 w-10 rounded-full transition-all hover:scale-105"
                  onClick={handleSendClick}
                >
                  <ArrowUp className="h-5 w-5" />
                  <span className="sr-only">Send</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
