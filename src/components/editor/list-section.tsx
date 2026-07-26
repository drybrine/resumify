"use client";

import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Plus, ArrowUp, ArrowDown, Trash2, GripVertical } from "lucide-react";

type FieldDef = {
  key: string;
  label: string;
  full?: boolean;
  textarea?: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ListSection<T extends Record<string, any>>({
  title,
  items,
  fields,
  hasBullets,
  emptyItem,
  onChange,
}: {
  title: string;
  items: T[];
  fields: FieldDef[];
  hasBullets?: boolean;
  emptyItem: () => T;
  onChange: (items: T[]) => void;
}) {
  function update(i: number, key: string, value: unknown) {
    const next = items.map((item, idx) =>
      idx === i ? { ...item, [key]: value } : item
    );
    onChange(next);
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
    const bullets = [...(items[i].bullets || []), ""];
    update(i, "bullets", bullets);
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-white tracking-wide">{title}</h2>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => onChange([...items, emptyItem()])}
          className="text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Entry</span>
        </Button>
      </div>

      {items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/30 p-6 text-center text-xs text-slate-400">
          No entries yet. Click <strong className="text-indigo-400">+ Add Entry</strong> to create one.
        </div>
      )}

      {items.map((item, i) => (
        <div
          key={i}
          className="glass-card rounded-2xl p-4 space-y-3 relative group border border-white/10"
        >
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-slate-500" />
              <span className="text-xs font-bold text-indigo-300">
                Item #{i + 1}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={i === 0}
                onClick={() => move(i, -1)}
                className="h-7 w-7 p-0"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={i === items.length - 1}
                onClick={() => move(i, 1)}
                className="h-7 w-7 p-0"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="danger"
                onClick={() => remove(i)}
                className="h-7 px-2"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
            <div className="space-y-2 pt-1">
              <Label>Bullet Points & Achievements</Label>
              {(item.bullets || [""]).map((b: string, bi: number) => (
                <div key={bi} className="flex gap-2 items-center">
                  <Textarea
                    rows={2}
                    className="min-h-[48px] text-xs"
                    value={b}
                    onChange={(e) => setBullet(i, bi, e.target.value)}
                    placeholder="Key responsibility or achievement…"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => delBullet(i, bi)}
                    className="h-8 w-8 p-0 shrink-0 text-slate-500 hover:text-red-400"
                  >
                    ×
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => addBullet(i)}
                className="text-xs text-indigo-400 hover:text-indigo-300 p-0 h-auto"
              >
                + Add Bullet
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
