import { bestOfCartoons, type BestOfCartoon } from "./best-of-cartoons";
import cities from "./city-editions.json";
import nationalEdition from './city-showcase-20260915.json';
export const cartoonCollection: BestOfCartoon[] = [...nationalEdition as BestOfCartoon[], ...cities as BestOfCartoon[], ...bestOfCartoons];
