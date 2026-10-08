import Link from 'next/link';
import { ActionForm } from '@/components/action-form';
import { verifyEmailAction } from '../actions';
export const metadata={title:'Verify your email'};
export default async function Verify({searchParams}:{searchParams:Promise<{token?:string}>}){const {token}=await searchParams;return <main id="main" className="container"><div className="form-wrap"><div className="form-header"><span className="eyebrow">ONE LITTLE STEP</span><h1>Back what you<br/><em>believe in.</em></h1><p>Confirm your email to support projects in the Weekly Drop. Links expire after 24 hours.</p></div><ActionForm action={verifyEmailAction} button="Verify my email"><input type="hidden" name="token" value={token||''}/></ActionForm><Link href="/me" className="text-link" style={{marginTop:24}}>Return to your workshop →</Link></div></main>}
