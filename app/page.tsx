import { redirect } from "next/navigation";

// The product has exactly two screens; this just opens the right one.
export default function Home() {
  redirect("/restaurant/1");
}
