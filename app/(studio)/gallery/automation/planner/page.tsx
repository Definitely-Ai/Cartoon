import {cookies} from 'next/headers';
import {BACKROOM_COOKIE,isDoorOpen} from '@/lib/backroom-auth';
import {bestOfCartoons} from '@/lib/best-of-cartoons';
import AutomationStudio from '../AutomationStudio';
import '../automation.css';
export const dynamic='force-dynamic';
export const metadata={title:'Advanced plans and schedules'};
export default async function PlannerPage(){
  const canManage=await isDoorOpen((await cookies()).get(BACKROOM_COOKIE)?.value);
  const examples=['professional-opposition','rare-opportunity-street','divide-the-credit'].map(id=>bestOfCartoons.find(c=>c.id===id)!);
  return <AutomationStudio canManage={canManage} initialNow={new Date().toISOString()} examples={examples}/>;
}
