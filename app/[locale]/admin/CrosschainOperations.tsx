'use client';
import { useCallback, useEffect, useState } from 'react';
import { API_URL } from '@/lib/config';

type Issue = { invoice_id: string; reference: string; state: string; reason: string; verification_failures: number };
const reasons: Record<string,string> = {
  setup_review: 'Payment setup needs review', fee_verification: 'Fee receipt not verified',
  payment_review: 'Deposit or refund needs review', settlement_delayed: 'ZEC delivery delayed',
};
export function CrosschainOperations({ adminKey }: { adminKey: string }) {
  const [issues,setIssues] = useState<Issue[]>([]);
  const [loaded,setLoaded] = useState(false);
  const [error,setError] = useState('');
  const [busy,setBusy] = useState<string | null>(null);
  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const r=await fetch(`${API_URL}/api/admin/crosschain`,{headers:{'X-Admin-Key':adminKey},cache:'no-store',signal});
      if (!r.ok) throw new Error('Payment monitoring unavailable');
      const data=await r.json();
      if (!signal?.aborted) {setIssues(data.issues);setLoaded(true);setError('');}
    } catch {if (!signal?.aborted) setError('Payment monitoring unavailable. Retry shortly.');}
  },[adminKey]);
  useEffect(()=>{const controller=new AbortController();void load(controller.signal);const timer=setInterval(()=>void load(controller.signal),30000);return ()=>{controller.abort();clearInterval(timer);};},[load]);
  const retry=async(id:string)=>{
    setBusy(id);setError('');
    try {
      const r=await fetch(`${API_URL}/api/admin/crosschain/${encodeURIComponent(id)}/retry`,{method:'POST',headers:{'X-Admin-Key':adminKey}});
      if(!r.ok) throw new Error('Could not schedule verification');
      await load();
    } catch {setError('Could not schedule verification. No new payment was created.');}
    finally {setBusy(null);}
  };
  return <section className="panel" style={{marginBottom:20}}>
    <div className="panel-header">Cross-chain payment monitoring</div>
    <div className="panel-body" style={{padding:20}}>
      {error && <p role="alert">{error}</p>}
      {!loaded && !error && <p role="status">Loading payment checks…</p>}
      {loaded && issues.length===0 && <p>No payments currently need review.</p>}
      {issues.map(i=><div key={i.invoice_id} style={{padding:'12px 0',borderBottom:'1px solid var(--cp-border)',overflowWrap:'anywhere'}}>
        <strong>{i.reference}</strong> · {reasons[i.reason] || 'Review required'}
        <p style={{fontSize:12,color:'var(--cp-text-muted)'}}>{i.state} · {i.invoice_id}</p>
        {i.reason==='setup_review' ? <p style={{fontSize:12}}>Keep this payment locked. Check provider records before asking the buyer to start another payment.</p>
          : <button className="btn btn-small" disabled={busy!==null} onClick={()=>void retry(i.invoice_id)}>{busy===i.invoice_id?'Scheduling…':'Retry verification'}</button>}
      </div>)}
      {issues.length>0 && <p style={{fontSize:12,color:'var(--cp-text-muted)',marginTop:12}}>Verification checks the existing payment. It never creates a new quote or sends funds.</p>}
    </div>
  </section>;
}
