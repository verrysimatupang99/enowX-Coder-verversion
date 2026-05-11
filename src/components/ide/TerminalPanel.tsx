import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import '@xterm/xterm/css/xterm.css';

interface TerminalPanelProps {
  sessionId: string;
  workingDir?: string;
}

export function TerminalPanel({ sessionId, workingDir }: TerminalPanelProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Spawn PTY
    invoke('spawn_terminal', { sessionId, workingDir })
      .then(() => setReady(true))
      .catch((err) => {
        term.writeln(`\x1b[31mFailed to spawn terminal: ${err}\x1b[0m`);
      });

    // Listen for output
    const unlisten = listen<string>(`terminal-output:${sessionId}`, (event) => {
      term.write(event.payload);
    });

    // Listen for exit
    const unlistenExit = listen(`terminal-exit:${sessionId}`, () => {
      term.writeln('\r\n\x1b[33mProcess exited\x1b[0m');
    });

    // Handle input
    const disposable = term.onData((data) => {
      if (ready) {
        invoke('write_terminal', { sessionId, data }).catch((err) => {
          console.error('Failed to write to terminal:', err);
        });
      }
    });

    // Resize handler
    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
      invoke('resize_terminal', {
        sessionId,
        rows: term.rows,
        cols: term.cols,
      }).catch((err) => console.error('Resize failed:', err));
    });
    resizeObserver.observe(terminalRef.current);

    return () => {
      disposable.dispose();
      resizeObserver.disconnect();
      unlisten.then((fn) => fn());
      unlistenExit.then((fn) => fn());
      invoke('close_terminal', { sessionId }).catch(() => {});
      term.dispose();
    };
  }, [sessionId, workingDir]);

  return (
    <div className="h-full w-full bg-[#1e1e1e]">
      <div ref={terminalRef} className="h-full w-full" />
    </div>
  );
}
