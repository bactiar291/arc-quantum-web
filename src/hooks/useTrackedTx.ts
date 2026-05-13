import type { Hex } from 'viem'

import { createTx, useAppStore, type TxKind } from '../store/useAppStore'

export function useTrackedTx() {
  const addTx = useAppStore((state) => state.addTx)
  const updateTx = useAppStore((state) => state.updateTx)
  const setPendingTx = useAppStore((state) => state.setPendingTx)

  return async function track<T>(
    kind: TxKind,
    summary: string,
    action: () => Promise<{ hash?: Hex; value?: T }>
  ) {
    const tx = createTx(kind, summary)
    addTx(tx)
    try {
      const result = await action()
      if (result.hash) setPendingTx(result.hash)
      updateTx(tx.id, {
        hash: result.hash,
        status: 'success'
      })
      setPendingTx(null)
      return result
    } catch (error) {
      updateTx(tx.id, {
        status: 'error',
        error: error instanceof Error ? error.message : String(error)
      })
      setPendingTx(null)
      throw error
    }
  }
}
