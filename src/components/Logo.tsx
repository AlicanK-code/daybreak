/** Up to this size the simplified icon is used: the full logo's detail is lost when small. */
const SMALL_MAX = 40

/**
 * The Daybreak logo: a katana pointing down with a spiral of fire round its blade. Both versions are
 * static SVGs in public/: logo.svg (full detail) and favicon.svg (chunkier, for small sizes and the
 * browser tab). Decorative, since "Daybreak" is always written next to it.
 */
export function Logo({ size = 32 }: { size?: number }) {
  return <img src={size <= SMALL_MAX ? '/favicon.svg' : '/logo.svg'} width={size} height={size} alt="" aria-hidden="true" draggable={false} />
}
