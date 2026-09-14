import {cartoonCollection} from '@/lib/cartoon-collection';
import PresentationStudio from './PresentationStudio';
import './presentation.css';
export const metadata={title:'Presentation for Rick',description:'Explore The Swinging Door cartoons, local edition generation, slides and precise print formats.'};
export default function PresentationPage(){return <PresentationStudio cartoons={cartoonCollection}/>;}
