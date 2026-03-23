
import { Persona } from '../personas';

export function getLinkWithPersona(path: string, activePersona: Persona | null) {
  if (!activePersona) return path;
  return `${path}?as=${activePersona.id}`;
}
