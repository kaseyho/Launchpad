'use client';

import { useEffect } from 'react';

export function WorkspaceArtifactDrawer({
  open,
  onClose,
  title,
  meta,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  meta: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="artifact-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <section className="artifact-drawer" role="dialog" aria-modal="true" aria-labelledby="artifact-title">
        <header className="artifact-header">
          <div><span>Workspace artifact</span><h2 id="artifact-title">{title}</h2><p>{meta}</p></div>
          <button type="button" onClick={onClose} aria-label="Close workspace artifact">Close</button>
        </header>
        <div className="launch-workbench">{children}</div>
      </section>
    </div>
  );
}
