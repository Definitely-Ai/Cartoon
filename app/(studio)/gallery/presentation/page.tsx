import {visibleGallery} from '@/lib/gallery-visibility-server';
import PresentationStudio from './PresentationStudio';
import {cookies} from 'next/headers';
import {BACKROOM_COOKIE,isDoorOpen} from '@/lib/backroom-auth';
import './presentation.css';
import './presentation-show.css';
import '../automation/generate.css';
export const metadata={title:'Presentation for Rick',description:'Explore The Swinging Door cartoons, local edition generation, slides and precise print formats.'};
export const dynamic='force-dynamic';
export default async function PresentationPage(){const [canManage,cartoons]=await Promise.all([isDoorOpen((await cookies()).get(BACKROOM_COOKIE)?.value),visibleGallery()]);return cartoons.length?<PresentationStudio cartoons={cartoons} canManage={canManage}/>:<main id="content"><h1>The gallery is empty.</h1><p>Restore cartoons from the gallery to include them in the presentation.</p><a href="/gallery/best-of">Open the gallery</a></main>;}
