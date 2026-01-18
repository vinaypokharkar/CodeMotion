"use client";

import { useParams } from "next/navigation";

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.id;

  return (
    <div className="flex h-screen w-full flex-col">
      <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-6 lg:h-[60px]">
        <h1 className="text-lg font-semibold">Project {projectId}</h1>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
          <div className="flex flex-col items-center gap-1 text-center">
            <h3 className="text-2xl font-bold tracking-tight">
              Chat & Generation Interface
            </h3>
            <p className="text-sm text-muted-foreground">
              This is where the magic happens. Layout coming soon.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
