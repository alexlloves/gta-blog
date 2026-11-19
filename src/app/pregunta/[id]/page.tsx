import { Suspense } from "react";
import { PostView, PostViewFallback } from "@/components/PostView";

/** Ruta histórica de las preguntas: se mantiene para no romper enlaces antiguos. */
export default function QuestionPage() {
  return (
    <Suspense fallback={<PostViewFallback />}>
      <PostView />
    </Suspense>
  );
}
