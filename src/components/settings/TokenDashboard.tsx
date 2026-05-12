import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { ChartBar, Coins } from '@phosphor-icons/react';

interface TokenSavings {
  id: string;
  command: string;
  tokens_saved: number;
  executions: number;
  created_at: string;
}

export const TokenDashboard: React.FC = () => {
  const [savings, setSavings] = useState<TokenSavings[]>([]);
  const [totalSavings, setTotalSavings] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [savingsData, total] = await Promise.all([
        invoke<TokenSavings[]>('get_token_savings'),
        invoke<number>('get_total_token_savings'),
      ]);
      setSavings(savingsData);
      setTotalSavings(total);
    } catch (error) {
      console.error('Failed to load token savings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  if (loading) {
    return <div className="text-[var(--text-muted)] text-sm">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text)]">Token Optimization</h3>
      </div>

      <div className="p-4 bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <Coins size={24} weight="duotone" className="text-green-400" />
          </div>
          <div>
            <div className="text-xs text-[var(--text-muted)]">Total Tokens Saved</div>
            <div className="text-2xl font-bold text-[var(--text)]">
              {formatNumber(totalSavings)}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-2">
          <ChartBar size={14} />
          <span>Command Breakdown</span>
        </div>
        {savings.length > 0 ? (
          savings.map((item) => (
            <div
              key={item.id}
              className="p-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <code className="text-xs font-mono text-[var(--text)]">{item.command}</code>
                <span className="text-xs font-semibold text-green-400">
                  {formatNumber(item.tokens_saved)} tokens
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                <span>{item.executions} executions</span>
                <span>
                  ~{Math.round(item.tokens_saved / item.executions)} tokens/exec
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-[var(--text-muted)] text-sm">
            No optimization data yet
          </div>
        )}
      </div>

      <div className="p-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-muted)]">
        <p className="mb-2 font-semibold text-[var(--text)]">How it works:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Caches repetitive command outputs (git status, ls)</li>
          <li>Summarizes long outputs (find, npm list)</li>
          <li>Reduces token usage in agent context</li>
        </ul>
      </div>
    </div>
  );
};
