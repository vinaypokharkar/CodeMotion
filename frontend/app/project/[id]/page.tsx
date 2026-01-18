"use client";

import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles,
  Send,
  Play,
  SkipBack,
  SkipForward,
  Pause,
} from "lucide-react";

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.id;

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
      {/* Header */}
      <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-6 lg:h-[60px]">
        <div className="flex items-center gap-2 font-semibold">
          <Sparkles className="h-5 w-5 text-primary" />
          <span>Project {projectId}</span>
        </div>
      </header>

      {/* Main Content Area - Static Split Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Chat Interface */}
        <div className="flex w-[400px] flex-col border-r bg-background/50 backdrop-blur-sm">
          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Dummy Messages */}
            <div className="flex flex-col gap-2 items-start">
              <div className="bg-muted px-4 py-2 rounded-lg rounded-tl-none max-w-[80%] text-sm">
                Hi! I'm Animind. Describe the mathematical animation you'd like
                to create.
              </div>
            </div>

            <div className="flex flex-col gap-2 items-end">
              <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg rounded-tr-none max-w-[80%] text-sm">
                Show me a 3D visualization of a sine wave rotating on the
                Z-axis.
              </div>
            </div>

            <div className="flex flex-col gap-2 items-start">
              <div className="bg-muted px-4 py-2 rounded-lg rounded-tl-none max-w-[80%] text-sm">
                Generating code for a 3D sine wave...
              </div>
            </div>
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t bg-background">
            <div className="relative">
              <Textarea
                placeholder="Type your message..."
                className="min-h-[80px] w-full resize-none pr-12 shadow-sm"
              />
              <Button
                size="icon"
                className="absolute bottom-2 right-2 h-8 w-8 rounded-full"
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Send</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Right Panel: Video / Workspace */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex h-full flex-col p-4 w-full">
            <div className="flex-1 flex items-center justify-center rounded-xl border border-dashed bg-muted/20">
              <div className="flex flex-col items-center gap-4 text-muted-foreground">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <Play className="h-8 w-8 ml-1" />
                </div>
                <p>Video Generation Preview</p>
              </div>
            </div>

            {/* Dummy Timeline / Controls (Visual only) */}
            <div className="mt-4 flex items-center justify-between rounded-lg border bg-card p-2 px-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Play className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-xs text-muted-foreground font-mono">
                00:00 / 00:05
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
