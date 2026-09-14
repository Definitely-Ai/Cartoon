import { bestOfCartoons, type BestOfCartoon } from "./best-of-cartoons";
import cities from "./city-editions.json";
export const cartoonCollection: BestOfCartoon[] = [...cities as BestOfCartoon[], ...bestOfCartoons];
