/**
 * Route transition. Re-mounts on every navigation, so the veil replays and the
 * incoming page reads as a fresh sheet arriving on the desk.
 *
 * Deliberately opacity-only: a transform here would create a containing block
 * and break the sticky header for the duration of the animation. The wrapper
 * carries the column layout that used to sit directly on <body>, so the sticky
 * footer still stretches correctly.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-enter flex min-h-full flex-1 flex-col">{children}</div>
  );
}
