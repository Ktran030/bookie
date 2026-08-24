import type { BookConnector } from '../../types/connector'
import { manualConnector } from './manualConnector'
import { paperConnector } from './paperConnector'

export const connectors: BookConnector[] = [manualConnector, paperConnector]

export function getConnector(id: string): BookConnector {
  const connector = connectors.find((c) => c.id === id)
  if (!connector) throw new Error(`Unknown connector: ${id}`)
  return connector
}

export { manualConnector, paperConnector }
