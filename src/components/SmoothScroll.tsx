'use client';

import React, { useEffect } from 'react';

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let lenisInstance: any = null;
    let tickerFn: any = null;

    // Dynamically import Lenis and GSAP only on the client side
    Promise.all([
      import('lenis'),
      import('gsap'),
    ]).then(([{ default: Lenis }, { default: gsap }]) => {
      lenisInstance = new Lenis({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 2,
      });

      tickerFn = (time: number) => {
        if (lenisInstance) {
          lenisInstance.raf(time * 1000);
        }
      };

      gsap.ticker.add(tickerFn);
    }).catch((err) => {
      console.warn('Lenis/GSAP dynamic load warning:', err);
    });

    return () => {
      if (lenisInstance) {
        lenisInstance.destroy();
      }
    };
  }, []);

  return <>{children}</>;
}
