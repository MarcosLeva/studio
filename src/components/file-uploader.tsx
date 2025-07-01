"use client";

import { UploadCloud, File as FileIcon, X } from "lucide-react";
import * as React from "react";
import { useDropzone, type DropzoneOptions } from "react-dropzone";
import { twMerge } from "tailwind-merge";

const variants = {
  base: "relative rounded-md flex justify-center items-center flex-col cursor-pointer min-h-36 min-w-48 border-2 border-dashed border-muted-foreground/50 transition-colors duration-200 ease-in-out",
  image:
    "border-0 p-0 min-h-0 min-w-0 relative shadow-md bg-slate-200 rounded-md",
  active: "border-primary",
  disabled: "bg-muted cursor-default pointer-events-none bg-opacity-30",
  accept: "border-green-500 bg-green-500 bg-opacity-10",
  reject: "border-red-500 bg-red-500 bg-opacity-10",
};

type InputProps = {
  width?: number;
  height?: number;
  className?: string;
  value?: File | string;
  onChange?: (file?: File) => void | Promise<void>;
  disabled?: boolean;
  dropzoneOptions?: Omit<DropzoneOptions, "disabled">;
};

const FileUploader = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      dropzoneOptions,
      width,
      height,
      value,
      className,
      disabled,
      onChange,
    },
    ref
  ) => {
    const [file, setFile] = React.useState(value as File | undefined);

    const onDrop = React.useCallback(
      (acceptedFiles: File[], rejectedFiles: any) => {
        if (!acceptedFiles || acceptedFiles.length === 0) {
          return;
        }
        const newFile = acceptedFiles[0];
        setFile(newFile);
        onChange?.(newFile);
      },
      [onChange]
    );

    const {
      getRootProps,
      getInputProps,
      isDragActive,
      isDragAccept,
      isDragReject,
    } = useDropzone({
      onDrop,
      disabled,
      ...dropzoneOptions,
    });

    const dropZoneClassName = React.useMemo(
      () =>
        twMerge(
          variants.base,
          isDragActive && variants.active,
          (isDragReject || (file && !isDragAccept)) && variants.reject,
          isDragAccept && variants.accept,
          disabled && variants.disabled,
          className
        ).trim(),
      [
        isDragActive,
        isDragReject,
        file,
        isDragAccept,
        disabled,
        className,
      ]
    );

    const removeFile = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      e.stopPropagation();
      setFile(undefined);
      onChange?.(undefined);
    };

    return (
      <div
        {...getRootProps({
          className: dropZoneClassName,
          style: {
            width,
            height,
          },
        })}
      >
        <input ref={ref} {...getInputProps()} />

        {file ? (
          <div className="flex flex-col items-center justify-center text-center p-4">
            <FileIcon className="h-12 w-12 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium text-foreground">{file.name}</p>
            <p className="text-xs text-muted-foreground">{Math.round(file.size / 1024)} KB</p>
            <button
                type="button"
                onClick={removeFile}
                className="mt-2 inline-flex items-center justify-center rounded-full bg-destructive p-1.5 text-destructive-foreground transition-colors hover:bg-destructive/80"
            >
                <X className="h-4 w-4"/>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-4">
            <UploadCloud className="h-12 w-12 text-muted-foreground" />
            <p className="mt-2 text-sm text-foreground">
              <span className="font-semibold">Arrastra y suelta</span> un archivo aquí o
              haz clic para seleccionar un archivo
            </p>
            <p className="text-xs text-muted-foreground">
              Soporta TXT, PDF e imágenes.
            </p>
          </div>
        )}
      </div>
    );
  }
);

FileUploader.displayName = "FileUploader";

export { FileUploader };
