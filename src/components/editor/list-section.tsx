"use client";

import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";

type FieldDef = {
  key: string;
  label: string;
  full?: boolean;
  textarea?: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ListSection<T extends Record<string, any>>({
  title,
  hint,
  items,
  fields,
  hasBullets,
  emptyItem,
  onChange,
}: {
  title: string;
  hint?: string;
  items: T[];
  fields: FieldDef[];
  hasBullets?: boolean;
  emptyItem: () => T;
  onChange: (items: T[]) => void;
}) {
  function update(i: number, key: string, value: unknown) {
    onChange(items.map((item, idx) => (idx === i ? { ...item, [key]: value } : item)));
  }

  function move(i: number, dir: number) {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  function remove(i: number) {
    onChange(items.filter((_, idx) => idx !== i));
  }

  function addBullet(i: number) {
    update(i, "bullets", [...(items[i].bullets || []), ""]);
  }

  function setBullet(i: number, bi: number, value: string) {
    const bullets = [...(items[i].bullets || [])];
    bullets[bi] = value;
    update(i, "bullets", bullets);
  }

  function delBullet(i: number, bi: number) {
    const bullets = (items[i].bullets || []).filter(
      (_: string, idx: number) => idx !== bi
    );
    update(i, "bullets", bullets.length ? bullets : [""]);
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-4 border-b border-rule-strong pb-2">
        <div>
          <h2 className="font-display text-[19px] leading-tight text-ink">{title}</h2>
          {hint && <p className="mt-1 text-[12px] text-ink-3">{hint}</p>}
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => onChange([...items, emptyItem()])}
          className="shrink-0"
        >
          + Tambah
        </Button>
      </div>

      {items.length === 0 && (
        <p className="mt-4 border border-dashed border-rule-strong px-4 py-5 text-[13px] leading-relaxed text-ink-3">
          Belum ada isian. Tambahkan satu, lalu isi dari yang paling atas ke
          bawah — urutannya sama dengan urutan di CV.
        </p>
      )}

      <ul className="mt-4 space-y-4">
        {items.map((item, i) => (
          <li
            key={i}
            className="enter rounded-print border border-rule bg-sheet p-4"
            style={{ "--rise": "8px" } as React.CSSProperties}
          >
            <div className="flex items-center justify-between gap-3 border-b border-rule pb-2.5">
              <span className="micro num">
                {title} {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                  className="h-7 px-2"
                  aria-label="Naikkan urutan"
                >
                  ↑
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={i === items.length - 1}
                  onClick={() => move(i, 1)}
                  className="h-7 px-2"
                  aria-label="Turunkan urutan"
                >
                  ↓
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  onClick={() => remove(i)}
                  className="h-7 px-2"
                >
                  Hapus
                </Button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              {fields.map((f) => (
                <div key={f.key} className={f.full ? "col-span-2" : ""}>
                  <Label>{f.label}</Label>
                  {f.textarea ? (
                    <Textarea
                      rows={3}
                      value={String(item[f.key] ?? "")}
                      onChange={(e) => update(i, f.key, e.target.value)}
                    />
                  ) : (
                    <Input
                      value={String(item[f.key] ?? "")}
                      onChange={(e) => update(i, f.key, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>

            {hasBullets && (
              <div className="mt-4 border-t border-rule pt-3">
                <Label>Poin pencapaian</Label>
                <div className="space-y-2">
                  {(item.bullets || [""]).map((b: string, bi: number) => (
                    <div key={bi} className="flex items-start gap-2">
                      <Textarea
                        rows={2}
                        className="min-h-[46px] text-[13px]"
                        value={b}
                        onChange={(e) => setBullet(i, bi, e.target.value)}
                        placeholder="Tulis hasil atau tanggung jawab, sebaiknya dengan angka…"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => delBullet(i, bi)}
                        className="h-8 px-2 shrink-0 text-ink-3 hover:text-danger"
                        aria-label="Hapus poin ini"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addBullet(i)}
                  className="link-rule mt-2 text-[13px] text-ink-2"
                >
                  + Tambah poin
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
