import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gửi Bo — 4 năm bên nhau",
    short_name: "Gửi Bo",
    description: "Một bức thư tình kỷ niệm 4 năm bên nhau.",
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#09090b",
    orientation: "portrait",
    icons: [
      { src: "/icon.png", sizes: "64x64", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" }
    ],
    screenshots: [],
    categories: ["lifestyle", "entertainment"]
  };
}