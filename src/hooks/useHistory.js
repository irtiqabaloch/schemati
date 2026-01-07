import { useState, useCallback, useRef, useEffect } from 'react'

const MAX_HISTORY_SIZE = 50

export function useHistory(onStateChange) {
  const [history, setHistory] = useState([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const isUndoRedoRef = useRef(false)
  const initializedRef = useRef(false)

  const pushState = useCallback((newState) => {
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false
      return
    }

    setHistory(prevHistory => {
      const newHistory = prevHistory.slice(0, currentIndex + 1)
      newHistory.push(newState)

      if (newHistory.length > MAX_HISTORY_SIZE) {
        newHistory.shift()
        setCurrentIndex(newHistory.length - 1)
        return newHistory
      }

      setCurrentIndex(newHistory.length - 1)
      return newHistory
    })
  }, [currentIndex])

  const initialize = useCallback((initialState) => {
    if (!initializedRef.current) {
      setHistory([initialState])
      setCurrentIndex(0)
      initializedRef.current = true
    }
  }, [])

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1
      setCurrentIndex(newIndex)
      isUndoRedoRef.current = true
      onStateChange(history[newIndex])
    }
  }, [currentIndex, history, onStateChange])

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      const newIndex = currentIndex + 1
      setCurrentIndex(newIndex)
      isUndoRedoRef.current = true
      onStateChange(history[newIndex])
    }
  }, [currentIndex, history, onStateChange])

  const canUndo = currentIndex > 0
  const canRedo = currentIndex < history.length - 1

  const reset = useCallback((newState) => {
    setHistory([newState])
    setCurrentIndex(0)
    initializedRef.current = true
  }, [])

  return {
    undo,
    redo,
    canUndo,
    canRedo,
    reset,
    pushState,
    initialize
  }
}
