"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, Loader2, X } from "lucide-react";
import { toast } from "sonner";

export function ImageUploader({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 503) {
          const compressedImage = await compressImage(file);
          onChange(compressedImage);
          toast.success("Imagem preparada. Clique em Salvar configurações.");
          return;
        }
        toast.error(data.error || "Erro ao enviar imagem.");
        return;
      }
      onChange(data.url);
    } catch {
      toast.error("Erro ao enviar imagem.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {value ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-xl border-2 border-ink/10">
          <Image src={value} alt="Preview" fill className="object-cover" sizes="400px" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-ink/70 text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink/20 text-ash hover:border-flame/50 hover:text-flame transition-colors"
        >
          {isUploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
          <span className="text-xs font-semibold">
            {isUploading ? "Enviando..." : "Clique para enviar uma imagem"}
          </span>
        </button>
      )}
      <p className="text-xs text-ash-light mt-1">
        Ou cole a URL de uma imagem:
      </p>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://..."
        className="mt-1 w-full rounded-lg border-2 border-ink/10 px-3 py-1.5 text-xs"
      />
    </div>
  );
}

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      const maxSize = 512;
      const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Não foi possível processar a imagem."));
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL("image/webp", 0.82));
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Imagem inválida."));
    };
    image.src = objectUrl;
  });
}
