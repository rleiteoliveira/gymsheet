import { createFileRoute } from "@tanstack/react-router";
import { GymApp } from "@/components/app/gym-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <GymApp />;
}
