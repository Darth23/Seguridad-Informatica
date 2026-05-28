'use client';

import { useEffect, useRef } from 'react';
import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';

const TOUR_STEPS = [
  {
    id: 'welcome',
    title: 'Bienvenido a CyberEdu',
    text: 'Plataforma educativa de ciberseguridad 100% client-side. Todo corre en tu navegador.',
    attachTo: { element: 'body', on: 'center' },
    buttons: [
      { text: 'Saltar', action: Shepherd.close },
      { text: 'Siguiente', action: Shepherd.next, classes: 'shepherd-button-primary' },
    ],
    classes: 'shepherd-theme-arrows',
  },
  {
    id: 'sidebar',
    title: 'Panel de Navegación',
    text: 'Aquí encontrarás el roadmap de lecciones, tu progreso y las lecciones disponibles.',
    attachTo: { element: '[data-tour="sidebar"]', on: 'right' },
    buttons: [
      { text: 'Anterior', action: Shepherd.back },
      { text: 'Siguiente', action: Shepherd.next, classes: 'shepherd-button-primary' },
    ],
    classes: 'shepherd-theme-arrows',
  },
  {
    id: 'content',
    title: 'Contenido Educativo',
    text: 'Lee las lecciones, resuelve challenges y completa CTF flags para ganar puntos.',
    attachTo: { element: '[data-tour="content"]', on: 'bottom' },
    buttons: [
      { text: 'Anterior', action: Shepherd.back },
      { text: 'Siguiente', action: Shepherd.next, classes: 'shepherd-button-primary' },
    ],
    classes: 'shepherd-theme-arrows',
  },
  {
    id: 'terminal',
    title: 'Terminal Interactiva',
    text: 'Practica comandos Linux, escanea redes y descifra flags en una terminal segura.',
    attachTo: { element: '[data-tour="terminal"]', on: 'top' },
    buttons: [
      { text: 'Anterior', action: Shepherd.back },
      { text: 'Siguiente', action: Shepherd.next, classes: 'shepherd-button-primary' },
    ],
    classes: 'shepherd-theme-arrows',
  },
  {
    id: 'shortcuts',
    title: 'Atajos de Teclado',
    text: 'Ctrl+K: Paleta de comandos | Ctrl+1/2: Cambiar panel | Ctrl+Shift+H: Alto contraste | Ctrl+L: Limpiar terminal',
    attachTo: { element: 'body', on: 'center' },
    buttons: [
      { text: 'Anterior', action: Shepherd.back },
      { text: '¡Empezar!', action: Shepherd.complete, classes: 'shepherd-button-primary' },
    ],
    classes: 'shepherd-theme-arrows',
  },
];

export function OnboardingTour() {
  const tourRef = useRef<Shepherd.Tour | null>(null);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('cyberedu-onboarding-complete');
    if (hasSeenTour) return;

    const tour = new Shepherd.Tour({
      defaultStepOptions: {
        cancelIcon: { enabled: true },
        scrollTo: { behavior: 'smooth', block: 'center' },
      },
      useModalOverlay: true,
    });

    TOUR_STEPS.forEach((step) => {
      tour.addStep(step);
    });

    tour.on('complete', () => {
      localStorage.setItem('cyberedu-onboarding-complete', 'true');
    });

    tour.on('cancel', () => {
      localStorage.setItem('cyberedu-onboarding-complete', 'true');
    });

    tourRef.current = tour;

    const timer = setTimeout(() => {
      tour.start();
    }, 1000);

    return () => {
      clearTimeout(timer);
      tour.complete();
    };
  }, []);

  return null;
}

export default OnboardingTour;
