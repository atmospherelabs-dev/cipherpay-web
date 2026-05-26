export function AgentTerminalVisual({ className = 'use-case-card-terminal' }: { className?: string }) {
  return (
    <div className={className}>
      <div className="use-case-agent-line">
        <span className="use-case-agent-prompt">$</span>
        <span>curl api.example.com/premium/data</span>
      </div>
      <div className="use-case-agent-line use-case-agent-line--402">
        <span>HTTP/1.1 402 Payment Required</span>
      </div>
      <div className="use-case-agent-line use-case-agent-line--dim">
        <span>{'{'}"amount": 0.001, "currency": "ZEC"{'}'}</span>
      </div>
      <div className="use-case-agent-line">
        <span className="use-case-agent-prompt">$</span>
        <span>zipher-cli pay ...</span>
      </div>
      <div className="use-case-agent-line use-case-agent-line--ok">
        <span>HTTP/1.1 200 OK</span>
      </div>
    </div>
  );
}
