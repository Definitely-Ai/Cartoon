import {cartoonCollection} from '@/lib/cartoon-collection';
import PresentationStudio from './PresentationStudio';
import {cookies} from 'next/headers';
import {BACKROOM_COOKIE,isDoorOpen} from '@/lib/backroom-auth';
import './presentation.css';
import './presentation-show.css';
import '../automation/generate.css';
export const metadata={title:'Presentation for Rick',description:'Explore The Swinging Door cartoons, local edition generation, slides and precise print formats.'};
export const dynamic='force-dynamic';
export default async function PresentationPage(){const canManage=await isDoorOpen((await cookies()).get(BACKROOM_COOKIE)?.value);return <PresentationStudio cartoons={cartoonCollection} canManage={canManage}/>;}
