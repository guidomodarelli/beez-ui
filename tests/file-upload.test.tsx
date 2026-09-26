/** Verifies file picking, dropping, validation feedback and the upload list through real events. */
import { describe, expect, it, vi } from "vitest";
import { createEvent, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FileUpload, FileUploadDropZone, FileUploadItem, FileUploadList } from "beez-ui";

const MAX_SIZE_BYTES = 1_000;

/**
 * Creates a file with the given size.
 * @param name - File name.
 * @param type - MIME type, possibly empty.
 * @param size - Size in bytes.
 * @returns The file.
 */
function createFile(name: string, type: string, size = 10): File {
  return new File(["x".repeat(size)], name, { type });
}

describe("FileUploadDropZone", () => {
  it("reports accepted files picked through the input", async () => {
    const onDropFiles = vi.fn();
    const user = userEvent.setup();
    render(<FileUploadDropZone accept="image/*,.pdf" hint="PDF o imagen" onDropFiles={onDropFiles} />);
    const receipt = createFile("recibo.pdf", "application/pdf");

    await user.upload(screen.getByLabelText("Subir archivos"), receipt);

    expect(onDropFiles).toHaveBeenCalledWith([receipt]);
    expect(screen.getByText("PDF o imagen")).not.toHaveClass("text-destructive");
  });

  it("marks the hint as invalid and reports rejected and oversized files separately", () => {
    const onDropFiles = vi.fn();
    const onDropUnacceptedFiles = vi.fn();
    const onSizeLimitExceed = vi.fn();
    render(
      <FileUploadDropZone
        accept="image/*,.pdf"
        maxSize={MAX_SIZE_BYTES}
        hint="PDF o imagen, hasta 1 KB"
        onDropFiles={onDropFiles}
        onDropUnacceptedFiles={onDropUnacceptedFiles}
        onSizeLimitExceed={onSizeLimitExceed}
      />,
    );
    const photoWithoutMimeType = createFile("foto.heic", "");
    const notes = createFile("notas.txt", "text/plain");
    const bigImage = createFile("grande.png", "image/png", MAX_SIZE_BYTES + 1);

    fireEvent.drop(screen.getByText("PDF o imagen, hasta 1 KB").closest("[data-slot=file-upload-drop-zone]")!, {
      dataTransfer: { files: [photoWithoutMimeType, notes, bigImage] },
    });

    expect(onDropFiles).toHaveBeenCalledWith([photoWithoutMimeType]);
    expect(onDropUnacceptedFiles).toHaveBeenCalledWith([notes]);
    expect(onSizeLimitExceed).toHaveBeenCalledWith([bigImage]);
    expect(screen.getByText("PDF o imagen, hasta 1 KB")).toHaveClass("text-destructive");
  });

  it("keeps only the first file when multiple files are not allowed", async () => {
    const onDropFiles = vi.fn();
    const user = userEvent.setup();
    render(<FileUploadDropZone allowsMultiple={false} onDropFiles={onDropFiles} />);
    const firstFile = createFile("a.pdf", "application/pdf");

    await user.upload(screen.getByLabelText("Subir archivos"), [firstFile, createFile("b.pdf", "application/pdf")]);

    expect(onDropFiles).toHaveBeenCalledWith([firstFile]);
  });

  it("prevents the native drop and ignores files while disabled", () => {
    const onDropFiles = vi.fn();
    render(<FileUploadDropZone isDisabled onDropFiles={onDropFiles} labels={{ uploadAction: "Adjuntar" }} />);
    const dropZone = screen.getByRole("button", { name: "Adjuntar" }).closest("[data-slot=file-upload-drop-zone]")!;
    const dropEvent = createEvent.drop(dropZone, { dataTransfer: { files: [createFile("a.pdf", "application/pdf")] } });

    fireEvent(dropZone, dropEvent);

    expect(dropEvent.defaultPrevented).toBe(true);
    expect(onDropFiles).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Adjuntar" })).toBeDisabled();
  });
});

describe("FileUploadItem", () => {
  it("shows size, progress and completion", () => {
    const { rerender } = render(
      <FileUploadList>
        <FileUploadItem name="recibo.pdf" size={1536} progress={40} />
      </FileUploadList>,
    );

    expect(screen.getByRole("listitem")).toHaveTextContent("recibo.pdf");
    expect(screen.getByText("1,5 KB")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Progreso de subida" })).toHaveAttribute("aria-valuenow", "40");
    expect(screen.getByRole("status")).toHaveTextContent("Subiendo...");

    rerender(
      <FileUploadList>
        <FileUploadItem name="recibo.pdf" size={1536} progress={100} />
      </FileUploadList>,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Completado");
  });

  it("offers retry after a failure and deletes the file", async () => {
    const onRetry = vi.fn();
    const onDelete = vi.fn();
    const user = userEvent.setup();
    render(
      <FileUpload>
        <FileUploadList>
          <FileUploadItem name="recibo.pdf" size={10} progress={30} failed onRetry={onRetry} onDelete={onDelete} />
        </FileUploadList>
      </FileUpload>,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Falló");
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    await user.click(screen.getByRole("button", { name: "Eliminar recibo.pdf" }));

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
