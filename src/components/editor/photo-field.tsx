"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { PHOTO_MAX_PX, PHOTO_QUALITY, PHOTO_MAX_CHARS } from "@/lib/photo";

/**
 * Optional profile photo.
 *
 * The picture is cropped to a square and downscaled **in the browser** before it
 * is stored, because it travels inside the CV's `data` JSON: an untouched 4 MB
 * phone photo would otherwise be re-uploaded on every autosave.
 */
export function PhotoField({
  value,
  onChange,
}: {
  value?: string;
  onChange: (next: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(file: File | undefined) {
    if (!file) return;
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("File itu bukan gambar.");
      return;
    }

    setBusy(true);
    const objectUrl = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("Gambar tidak bisa dibaca."));
        el.src = objectUrl;
      });

      // Centre-crop to a square, then cap the long edge.
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      const out = Math.max(1, Math.min(PHOTO_MAX_PX, side));
      const canvas = document.createElement("canvas");
      canvas.width = out;
      canvas.height = out;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas tidak tersedia di browser ini.");
      ctx.drawImage(
        img,
        (img.naturalWidth - side) / 2,
        (img.naturalHeight - side) / 2,
        side,
        side,
        0,
        0,
        out,
        out,
      );

      const dataUrl = canvas.toDataURL("image/jpeg", PHOTO_QUALITY);
      if (dataUrl.length > PHOTO_MAX_CHARS) {
        setError("Fotonya masih terlalu besar setelah dikompres. Coba gambar lain.");
        return;
      }
      onChange(dataUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memproses gambar.");
    } finally {
      URL.revokeObjectURL(objectUrl);
      setBusy(false);
      // Allow re-picking the same file after a removal.
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="relative">
      {/* Clicking the heading now opens the picker too, because the label finally
          points at the file input instead of at nothing. `relative` holds the
          sr-only input inside this box rather than letting it escape to the page. */}
      <Label htmlFor="cv-photo-input">Foto profil (opsional)</Label>
      <div className="flex items-center gap-3">
        <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-print border border-rule-strong bg-sheet">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element -- a data URL preview
            <img src={value} alt="Pratinjau foto profil" className="h-full w-full object-cover" />
          ) : (
            <span className="micro text-[9px] text-ink-3">Kosong</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              {busy ? "Memproses…" : value ? "Ganti foto" : "Pilih foto"}
            </Button>
            {value && (
              <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
                Hapus
              </Button>
            )}
          </div>
          <p className="max-w-[22rem] text-[11px] leading-relaxed text-ink-3">
            Dipotong jadi persegi &amp; diperkecil otomatis. Tidak wajib — banyak
            lamaran (terutama di luar Indonesia) justru lebih aman tanpa foto.
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        id="cv-photo-input"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={(e) => onPick(e.target.files?.[0])}
      />

      {error && (
        <p role="alert" className="mt-2 text-[12px] text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
