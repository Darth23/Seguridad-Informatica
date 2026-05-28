'use client';

import { useEffect, useRef, useState } from 'react';

export function OnboardingTour() {
  const tourRef = useRef<unknown>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (started) return;
    const hasSeenTour = localStorage.getItem('cyberedu-onboarding-complete');
    if (hasSeenTour) return;

    let cancelled = false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    import('shepherd.js').then((mod: any) => {
      if (cancelled) return;
      const ShepherdClass = mod.default || mod;
      if (typeof ShepherdClass !== 'function') return;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const tour = new ShepherdClass.Tour({
        defaultStepOptions: {
          cancelIcon: { enabled: true },
          scrollTo: { behavior: 'smooth', block: 'center' },
        },
        useModalOverlay: true,
      });

      const steps = [
        {
          id: 'welcome',
          title: 'Bienvenido a CyberEdu',
          text: 'Plataforma educativa de ciberseguridad 100% client-side. Todo corre en tu navegador.',
          attachTo: { element: 'body', on: 'center' },
          buttons: [
            { text: 'Saltar', action: tour.complete.bind(tour) },
            { text: 'Siguiente', action: tour.next.bind(tour) },
          ],
          classes: 'shepherd-theme-arrows',
        },
        {
          id: 'sidebar',
          title: 'Panel de Navegación',
          text: 'Aquí encontrarás el roadmap de lecciones, tu progreso y las lecciones disponibles.',
          attachTo: { element: '[data-tour="sidebar"]', on: 'right' },
          buttons: [
            { text: 'Anterior', action: tour.back.bind(tour) },
            { text: 'Siguiente', action: tour.next.bind(tour) },
          ],
          classes: 'shepherd-theme-arrows',
        },
        {
          id: 'content',
          title: 'Contenido Educativo',
          text: 'Lee las lecciones, resuelve challenges y completa CTF flags para ganar puntos.',
          attachTo: { element: '[data-tour="content"]', on: 'bottom' },
          buttons: [
            { text: 'Anterior', action: tour.back.bind(tour) },
            { text: 'Siguiente', action: tour.next.bind(tour) },
          ],
          classes: 'shepherd-theme-arrows',
        },
        {
          id: 'terminal',
          title: 'Terminal Interactiva',
          text: 'Practica comandos Linux, escanea redes y descifra flags en una terminal segura.',
          attachTo: { element: '[data-tour="terminal"]', on: 'top' },
          buttons: [
            { text: 'Anterior', action: tour.back.bind(tour) },
            { text: 'Siguiente', action: tour.next.bind(tour) },
          ],
          classes: 'shepherd-theme-arrows',
        },
        {
          id: 'shortcuts',
          title: 'Atajos de Teclado',
          text: 'Ctrl+K: Paleta | Ctrl+1/2: Paneles | Ctrl+Shift+H: Alto contraste | Ctrl+L: Limpiar terminal',
          attachTo: { element: 'body', on: 'center' },
          buttons: [
            { text: 'Anterior', action: tour.back.bind(tour) },
            { text: '¡Empezar!', action: tour.complete.bind(tour) },
          ],
          classes: 'shepherd-theme-arrows',
        },
      ];

      steps.forEach((step) => tour.addStep(step));

      tour.on('complete', () => {
        localStorage.setItem('cyberedu-onboarding-complete', 'true');
      });

      tour.on('cancel', () => {
        localStorage.setItem('cyberedu-onboarding-complete', 'true');
      });

      tourRef.current = tour;

      setTimeout(() => {
        try { tour.start(); } catch { /* ignore */ }
      }, 1000);

      setStarted(true);
    }).catch(() => { /* ignore import errors */ });

    return () => {
      cancelled = true;
      try { (tourRef.current as { complete?: () => void })?.complete?.(); } catch { /* ignore */ }
    };
  }, [started]);

  return null;
}

export default OnboardingTour;
