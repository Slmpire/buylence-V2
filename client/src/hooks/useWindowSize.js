import { useState, useEffect } from 'react'

export function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  })

  useEffect(() => {
    function handleResize() {
      setSize({ width: window.innerWidth, height: window.innerHeight })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return size
}

export function useIsMobile() {
  const { width } = useWindowSize()
  return width < 768
}

export function useIsTablet() {
  const { width } = useWindowSize()
  return width >= 768 && width < 1024
}