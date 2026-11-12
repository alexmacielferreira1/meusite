// @vitest-environment jsdom
import { StrictMode } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/artDocument", async (original) => {
  const real = await original<typeof import("../lib/artDocument")>();
  return { ...real, renderArt: vi.fn(async () => "data:image/png;base64,QUFB") };
});
import { LayerStudio } from "./LayerStudio";

afterEach(cleanup);

describe("QA 12/11: canvas no modo estrito do React", () => {
  it("Salvar e aplicar entrega a arte (antes ficava em 'Renderizando…' para sempre)", async () => {
    const onSave = vi.fn();
    render(<StrictMode><LayerStudio source="grad:260" accent="#7a2fb5" title="" onBack={vi.fn()} onClose={vi.fn()} onSave={onSave} /></StrictMode>);
    fireEvent.click(screen.getByText("Salvar e aplicar"));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ dataUrl: "data:image/png;base64,QUFB" }), true));
    expect(screen.queryByText("Renderizando…")).toBeNull();
  });
});
