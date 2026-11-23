import { ImageResponse } from "next/og";
import fs from "fs";
import path from "path";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  const filePath = path.join(process.cwd(), "public", "favicon-32x32.png");
  let dataUrl = "";
  try {
    const buffer = fs.readFileSync(filePath);
    dataUrl = `data:image/png;base64,${buffer.toString("base64")}`;
  } catch (e) {
    console.error("Error loading favicon-32x32.png:", e);
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
        }}
      >
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dataUrl} width="32" height="32" alt="Olitec Logo" style={{ width: "32px", height: "32px", objectFit: "contain" }} />
        ) : null}
      </div>
    ),
    {
      ...size,
    }
  );
}
