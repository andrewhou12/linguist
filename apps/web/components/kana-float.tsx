'use client'

import { useEffect, useState } from 'react'
import styles from './landing.module.css'

const KANA = ['語','学','知','思','脳','識','記','憶','言','日','本','心','理','解','流']

interface KanaItem {
  char: string
  dur: string
  delay: string
  rot: string
  peakOpacity: string
  left: string
  top: string
}

export default function KanaFloat() {
  const [items, setItems] = useState<KanaItem[]>([])

  useEffect(() => {
    setItems(
      KANA.map((char) => ({
        char,
        dur: `${8 + Math.random() * 10}s`,
        delay: `${Math.random() * 12}s`,
        rot: `${-15 + Math.random() * 30}deg`,
        peakOpacity: `${0.06 + Math.random() * 0.1}`,
        left: `${5 + Math.random() * 90}%`,
        top: `${10 + Math.random() * 80}%`,
      })),
    )
  }, [])

  return (
    <>
      {items.map((item, i) => (
        <div
          key={i}
          className={styles.kanaItem}
          style={
            {
              left: item.left,
              top: item.top,
              '--dur': item.dur,
              '--delay': item.delay,
              '--rot': item.rot,
              '--peak-opacity': item.peakOpacity,
            } as React.CSSProperties
          }
        >
          {item.char}
        </div>
      ))}
    </>
  )
}
