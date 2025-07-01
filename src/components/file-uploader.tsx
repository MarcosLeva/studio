"use client";

import { UploadCloud, File as FileIcon, X } from "lucide-react";
import * as React from "react";
import { useDropzone, type DropzoneOptions, type FileRejection } from "react-dropzone";
import { twMerge } from "tailwind-merge";
import Image from "next/image";

const variants = {
  base: "relative rounded-md flex justify-center items-center flex-col cursor-pointer min-h-36 w-full border-2 border-dashed border-muted-foreground/50 transition-colors duration-200 ease-in-out",
  image: "border-0 p-0 relative shadow-md bg-transparent",
  active: "border-primary",
  disabled: "bg-muted cursor-default pointer-events-none bg-opacity-30",
  accept: "border-green-500 bg-green-500 bg-opacity-10",
  reject: "border-red-500 bg-red-500 bg-opacity-10",
};

type InputProps = {
  className?: string;
  value?: File;
  onChange?: (file?: File) => void | Promise<void>;
  disabled?: boolean;
  dropzoneOptions?: Omit<DropzoneOptions, "disabled">;
};

const FileUploader = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      dropzoneOptions,
      value: file,
      className,
      disabled,
      onChange,
    },
    ref
  ) => {
    const [preview, setPreview] = React.useState<string | null>(null);
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

    const onDrop = React.useCallback(
      (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
        setErrorMessage(null);

        if (rejectedFiles && rejectedFiles.length > 0) {
            const firstError = rejectedFiles[0].errors[0];
            let message = firstError.message;
            if (firstError.code === 'file-too-large' && dropzoneOptions?.maxSize) {
                message = `El archivo es demasiado grande. El tamaño máximo es ${Math.round(dropzoneOptions.maxSize / 1024 / 1024)}MB.`;
            } else if (firstError.code === 'file-invalid-type') {
                message = "Tipo de archivo no válido.";
            } else if (firstError.code === 'file-too-small' && dropzoneOptions?.minSize) {
                message = `El archivo es demasiado pequeño. El tamaño mínimo es ${Math.round(dropzoneOptions.minSize / 1024)}KB.`;
            }
            setErrorMessage(message);
            onChange?.(undefined);
            return;
        }
        
        if (acceptedFiles && acceptedFiles.length > 0) {
          onChange?.(acceptedFiles[0]);
        }
      },
      [onChange, dropzoneOptions]
    );

    React.useEffect(() => {
        if (file && file.type.startsWith("image/")) {
            const objectUrl = URL.createObjectURL(file);
            setPreview(objectUrl);
            
            return () => {
                URL.revokeObjectURL(objectUrl);
            };
        } else {
            setPreview(null);
        }
    }, [file]);
    
    React.useEffect(() => {
      if(!file) {
        setErrorMessage(null);
      }
    }, [file]);

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
          (isDragReject || errorMessage) && variants.reject,
          isDragAccept && variants.accept,
          disabled && variants.disabled,
          file && !errorMessage ? variants.image : "",
          className
        ).trim(),
      [
        isDragActive,
        isDragReject,
        file,
        isDragAccept,
        disabled,
        className,
        errorMessage,
      ]
    );

    const removeFile = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      e.stopPropagation();
      onChange?.(undefined);
    };

    return (
      <div
        {...getRootProps({
          className: dropZoneClassName,
        })}
      >
        <input ref={ref} {...getInputProps()} />

        {file && !errorMessage ? (
          preview ? (
            <Image
                src={preview}
                alt={file.name || "Vista previa"}
                fill
                className="rounded-md object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center text-center p-4 bg-background rounded-md">
              <FileIcon className="h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium text-foreground">{file.name}</p>
              <p className="text-xs text-muted-foreground">{Math.round(file.size / 1024)} KB</p>
            </div>
          )
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
            {errorMessage && (
                <p className="mt-2 text-xs text-destructive">{errorMessage}</p>
            )}
          </div>
        )}
        
        {file && !disabled && (
            <button
              type="button"
              onClick={removeFile}
              className="absolute -right-2 -top-2 inline-flex items-center justify-center rounded-full bg-destructive p-1.5 text-destructive-foreground transition-colors hover:bg-destructive/80 z-10"
            >
              <X className="h-4 w-4"/>
            </button>
        )}
      </div>
    );
  }
);

FileUploader.displayName = "FileUploader";

export { FileUploader };