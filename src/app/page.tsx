import { getPhotos } from "@/utils/getPhotos";
import PhotographyClient from "./PhotographyClient";

export const metadata = {
  title: "Sahil Bhagat",
  description: "A collection of quiet moments, urban spaces, and geometry captured through my lens.",
};

export default async function PhotographyPage() {
  const photos = await getPhotos();

  return (
    <main
      className="min-h-screen overflow-x-clip selection:bg-black/10 selection:text-black"
      style={{ background: "#f5f3f0", color: "#0C0C0C" }}
    >
      <PhotographyClient photos={photos} />
    </main>
  );
}
