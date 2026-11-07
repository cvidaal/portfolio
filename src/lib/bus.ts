// Bus de eventos entre islas: CustomEvents en window, tipados por nombre.
export type PoseName = 'neutral' | 'smile' | 'grin' | 'smirkL' | 'smirkR' | 'surprised' | 'think' | 'winkL' | 'winkR';
export type Theme = 'rojo' | 'azul' | 'verde';
export interface Cosmetics { shades: boolean; chain: boolean; theme: Theme }

export interface BusEvents {
  'avatar:pose': { name: PoseName; ms: number };
  'avatar:wink': undefined;
  'avatar:cosmetics': Cosmetics;
  /** Se abre el tablero: el avatar pausa sus gestos sueltos y reacciona al juego. */
  'game:open': undefined;
  /** Se cierra el tablero. */
  'game:close': undefined;
}
export type BusType = keyof BusEvents;
type Args<K extends BusType> = BusEvents[K] extends undefined ? [] : [detail: BusEvents[K]];

export function emit<K extends BusType>(type: K, ...args: Args<K>): void {
  window.dispatchEvent(new CustomEvent(type, { detail: args[0] }));
}

export function on<K extends BusType>(type: K, handler: (detail: BusEvents[K]) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<BusEvents[K]>).detail);
  window.addEventListener(type, listener);
  return () => window.removeEventListener(type, listener);
}
