export default function EditorLoading() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-paper">
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-rule bg-sheet px-4">
        <div className="enter h-4 w-56 bg-rule" />
        <span
          aria-hidden
          className="block h-px w-40 overflow-hidden bg-rule"
        >
          <span className="sweep block h-px w-1/3 bg-accent" />
        </span>
        <div className="flex gap-2">
          <div
            className="enter h-8 w-24 bg-rule"
            style={{ "--d": "70ms" } as React.CSSProperties}
          />
          <div
            className="enter h-8 w-28 bg-rule"
            style={{ "--d": "120ms" } as React.CSSProperties}
          />
        </div>
      </header>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[196px_430px_1fr]">
        <div className="hidden border-r border-rule px-3 py-4 lg:block">
          <div className="enter h-3 w-14 bg-rule" />
          <div className="mt-4 space-y-2">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div
                key={i}
                className="enter h-7 w-full bg-rule/60"
                style={{ "--d": `${80 + i * 45}ms` } as React.CSSProperties}
              />
            ))}
          </div>
        </div>

        <div className="enter border-r border-rule px-5 py-5">
          <div className="h-5 w-28 bg-rule" />
          <div className="mt-4 h-3 w-52 bg-rule/70" />
          <div className="mt-6 grid grid-cols-2 gap-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="enter h-10 bg-rule/60"
                style={{ "--d": `${140 + i * 45}ms` } as React.CSSProperties}
              />
            ))}
          </div>
        </div>

        <div className="enter flex flex-col items-center justify-center gap-3 bg-desk">
          <p className="micro">Menyiapkan ruang editor…</p>
          <span
            aria-hidden
            className="block h-px w-40 overflow-hidden bg-rule-strong"
          >
            <span className="sweep block h-px w-1/3 bg-accent" />
          </span>
        </div>
      </div>
    </div>
  );
}
