export default function EditorLoading() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-paper">
      <header className="flex h-14 shrink-0 animate-pulse items-center justify-between border-b border-rule bg-sheet px-4">
        <div className="h-4 w-56 bg-rule" />
        <div className="flex gap-2">
          <div className="h-8 w-24 bg-rule" />
          <div className="h-8 w-28 bg-rule" />
        </div>
      </header>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[196px_430px_1fr]">
        <div className="hidden border-r border-rule px-3 py-4 lg:block">
          <div className="h-3 w-14 bg-rule" />
          <div className="mt-4 space-y-2">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="h-7 w-full bg-rule/60" />
            ))}
          </div>
        </div>

        <div className="animate-pulse border-r border-rule px-5 py-5">
          <div className="h-5 w-28 bg-rule" />
          <div className="mt-4 h-3 w-52 bg-rule/70" />
          <div className="mt-6 grid grid-cols-2 gap-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-rule/60" />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center bg-desk">
          <p className="micro">Menyiapkan ruang editor…</p>
        </div>
      </div>
    </div>
  );
}
