/** Demonstrates FileUpload with uploads tracked by the consumer. */
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileUpload, FileUploadDropZone, FileUploadItem, FileUploadList } from "beez-ui";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const COMPLETE_PROGRESS = 100;

/** Tracked upload of one picked file. */
type UploadedFile = { id: string; name: string; size: number; progress: number; failed: boolean };

const INITIAL_FILES: UploadedFile[] = [
  { id: "demo-1", name: "recibo-mayo.pdf", size: 240_000, progress: 60, failed: false },
  { id: "demo-2", name: "factura.png", size: 1_200_000, progress: 20, failed: true },
];

/** Adds picked files as finished uploads, like a consumer once its request succeeds. */
function FileUploadExample() {
  const [files, setFiles] = useState(INITIAL_FILES);

  return (
    <FileUpload className="max-w-md">
      <FileUploadDropZone
        accept="image/*,.pdf"
        maxSize={MAX_SIZE_BYTES}
        hint="PDF o imagen, hasta 5 MB"
        onDropFiles={(droppedFiles) =>
          setFiles([
            ...droppedFiles.map((file) => ({ id: `${file.name}-${file.lastModified}`, name: file.name, size: file.size, progress: COMPLETE_PROGRESS, failed: false })),
            ...files,
          ])
        }
      />
      <FileUploadList>
        {files.map((file) => (
          <FileUploadItem
            key={file.id}
            name={file.name}
            size={file.size}
            progress={file.progress}
            failed={file.failed}
            onDelete={() => setFiles(files.filter((currentFile) => currentFile.id !== file.id))}
            onRetry={() =>
              setFiles(files.map((currentFile) => (currentFile.id === file.id ? { ...currentFile, failed: false, progress: COMPLETE_PROGRESS } : currentFile)))
            }
          />
        ))}
      </FileUploadList>
    </FileUpload>
  );
}

const meta = {
  title: "Components/FileUpload",
  render: () => <FileUploadExample />,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
