"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/landing/Navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Plus, MessageSquare, Calendar } from "lucide-react";

interface ChatProject {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<ChatProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_SERVER_URL}/api/chats`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!res.ok) {
          const errorText = await res.text();
          console.error("Fetch projects failed:", res.status, errorText);
          throw new Error(
            `Failed to fetch projects: ${res.status} ${errorText}`,
          );
        }

        const data = await res.json();
        setProjects(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [user, authLoading, router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Projects</h1>
            <p className="text-muted-foreground mt-1">
              Manage your animation generation history.
            </p>
          </div>
          <Button onClick={() => router.push("/")}>
            <Plus className="mr-2 h-4 w-4" /> New Project
          </Button>
        </div>

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center border border-dashed rounded-lg p-12 bg-muted/20">
            <MessageSquare className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No projects yet</h3>
            <p className="text-muted-foreground mb-4 text-center max-w-sm">
              Start by creating your first mathematical animation prompt.
            </p>
            <Button onClick={() => router.push("/")}>Create Project</Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="group hover:shadow-md transition-all border-muted"
              >
                <CardHeader>
                  <CardTitle className="truncate leading-tight">
                    {project.title === "New Chat"
                      ? "Untitled Animation"
                      : project.title}
                  </CardTitle>
                  <CardDescription className="flex items-center text-xs mt-1">
                    <Calendar className="mr-1 h-3 w-3" />
                    {formatDate(project.updated_at || project.created_at)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-24 bg-muted/30 rounded-md flex items-center justify-center border border-dashed border-muted-foreground/20">
                    {/* Placeholder for optional thumbnail later */}
                    <span className="text-xs text-muted-foreground font-medium">
                      Project Workspace
                    </span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="secondary"
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    asChild
                  >
                    <Link href={`/project/${project.id}`}>Open Project</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
