import * as handlers from '$handlers/index';
import { factory } from '$utils/init';

export default factory.discord().loader(Object.values(handlers));
