import { bestOfCartoons, type BestOfCartoon } from "./best-of-cartoons";
import cities from "./city-editions.json";
// September 15 city studies are retained on disk, but withdrawn from the
// published collection at the owner's request. Keep the original 38 plus Austin/LA.
export const cartoonCollection: BestOfCartoon[] = [...cities as BestOfCartoon[], ...bestOfCartoons];
