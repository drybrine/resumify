export default function Loading() {
  return (
    <main className="enter flex flex-1 items-center justify-center px-4 py-24">
      <div className="w-full max-w-xs">
        <p className="micro">Memuat</p>
        <span
          aria-hidden
          className="mt-3 block h-px w-full overflow-hidden bg-rule"
        >
          <span className="sweep block h-px w-1/3 bg-accent" />
        </span>
      </div>
    </main>
  );
}
