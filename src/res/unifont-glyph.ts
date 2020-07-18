import { BDF } from '../third-parties/bdf';
import unifont from 'raw-loader!./unifont-13.0.03.bdf';

export const bmFont = new BDF();
bmFont.load(unifont);