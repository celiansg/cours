import type { LearningData } from '@/src/domain/learning';

export const demoLearningData: LearningData = {
  version: 1,
  subjects: [
    { id: 'industry', name: 'Industrie graphique', icon: 'layers', accent: '#7c5ce8', description: 'Supports, procédés et chaîne graphique', demo: true },
    { id: 'maths', name: 'Mathématiques', icon: 'calculator', accent: '#2da9e9', description: 'Calculs et outils scientifiques', demo: true },
    { id: 'physics', name: 'Physique-chimie', icon: 'flask', accent: '#f18a4b', description: 'Optique et phénomènes physiques', demo: true },
  ],
  courses: [
    {
      id: 'paper', subjectId: 'industry', title: 'Papier', description: 'Caractéristiques essentielles d’un support papier', demo: true,
      blocks: [
        { id: 'paper-text', type: 'text', title: 'Vue d’ensemble', content: 'Ce contenu de démonstration montre comment une future fiche issue de tes documents pourra être structurée.' },
        { id: 'paper-important', type: 'important', title: 'À retenir', content: 'Le choix du papier dépend du procédé d’impression, du rendu attendu et des contraintes de façonnage.' },
        { id: 'paper-definition', type: 'definition', term: 'Grammage', definition: 'Masse, en grammes, d’un mètre carré de papier.' },
        { id: 'paper-formula', type: 'formula', formula: 'Masse = grammage × surface', explanation: 'Le grammage est exprimé en g/m² et la surface en m².' },
        { id: 'paper-method', type: 'method', title: 'Choisir un support', steps: ['Identifier le procédé d’impression.', 'Déterminer le rendu et la rigidité attendus.', 'Vérifier la compatibilité avec la finition.'] },
        { id: 'paper-example', type: 'example', title: 'Exemple', content: 'Une feuille A4 de 80 g/m² pèse environ 5 grammes.' },
        { id: 'paper-warning', type: 'warning', title: 'Piège fréquent', content: 'Ne pas confondre grammage et épaisseur : deux papiers de même grammage peuvent avoir des mains différentes.' },
      ],
    },
    { id: 'digital-print', subjectId: 'industry', title: 'Impression numérique', description: 'Principes et usages', demo: true, blocks: [{ id: 'digital-text', type: 'text', title: 'Démonstration', content: 'Une fiche courte, prête à recevoir le vrai contenu analysé depuis tes cours.' }, { id: 'digital-important', type: 'important', title: 'À retenir', content: 'Le numérique convient particulièrement aux courts tirages et à la personnalisation.' }] },
    { id: 'percentages', subjectId: 'maths', title: 'Pourcentages', description: 'Évolutions et coefficients multiplicateurs', demo: true, blocks: [{ id: 'percent-formula', type: 'formula', formula: 'Valeur finale = valeur initiale × (1 + t)', explanation: 't est le taux d’évolution écrit sous forme décimale.' }, { id: 'percent-warning', type: 'warning', title: 'Attention', content: 'Une hausse de 20 % suivie d’une baisse de 20 % ne ramène pas à la valeur initiale.' }] },
    { id: 'scientific-writing', subjectId: 'maths', title: 'Écriture scientifique', description: 'Puissances de dix', demo: true, blocks: [{ id: 'scientific-definition', type: 'definition', term: 'Écriture scientifique', definition: 'Écriture d’un nombre sous la forme a × 10ⁿ, avec 1 ≤ |a| < 10.' }] },
    { id: 'optics', subjectId: 'physics', title: 'Optique', description: 'Lentilles et formation des images', demo: true, blocks: [{ id: 'optics-text', type: 'text', title: 'Démonstration', content: 'Cette fiche recevra plus tard les notions extraites de ton vrai cours de physique-chimie.' }] },
  ],
  flashcards: [
    { id: 'f-paper-1', subjectId: 'industry', courseId: 'paper', question: 'Quelle est la définition du grammage ?', answer: 'La masse, en grammes, d’un mètre carré de papier.', difficulty: 'easy' },
    { id: 'f-paper-2', subjectId: 'industry', courseId: 'paper', question: 'Quelle formule relie masse, grammage et surface ?', answer: 'Masse = grammage × surface.', difficulty: 'medium' },
    { id: 'f-paper-3', subjectId: 'industry', courseId: 'paper', question: 'Le grammage indique-t-il directement l’épaisseur ?', answer: 'Non. Deux papiers de même grammage peuvent avoir des épaisseurs différentes.', difficulty: 'hard' },
    { id: 'f-digital-1', subjectId: 'industry', courseId: 'digital-print', question: 'Pour quels tirages l’impression numérique est-elle adaptée ?', answer: 'Les courts tirages et les travaux personnalisés.', difficulty: 'easy' },
    { id: 'f-digital-2', subjectId: 'industry', courseId: 'digital-print', question: 'Quel est un avantage clé du numérique ?', answer: 'La personnalisation de chaque exemplaire sans forme imprimante.', difficulty: 'medium' },
    { id: 'f-percent-1', subjectId: 'maths', courseId: 'percentages', question: 'Comment obtenir le coefficient d’une hausse de 15 % ?', answer: '1 + 0,15 = 1,15.', difficulty: 'easy' },
    { id: 'f-percent-2', subjectId: 'maths', courseId: 'percentages', question: 'Une hausse puis une baisse du même pourcentage s’annulent-elles ?', answer: 'Non, car la seconde variation s’applique à une nouvelle base.', difficulty: 'medium' },
    { id: 'f-science-1', subjectId: 'maths', courseId: 'scientific-writing', question: 'Quelle contrainte porte sur a dans a × 10ⁿ ?', answer: 'Sa valeur absolue est supérieure ou égale à 1 et strictement inférieure à 10.', difficulty: 'medium' },
    { id: 'f-science-2', subjectId: 'maths', courseId: 'scientific-writing', question: 'Écrire 4 500 en notation scientifique.', answer: '4,5 × 10³.', difficulty: 'easy' },
    { id: 'f-optics-1', subjectId: 'physics', courseId: 'optics', question: 'Quel type de lentille fait converger des rayons parallèles ?', answer: 'Une lentille convergente.', difficulty: 'easy' },
    { id: 'f-optics-2', subjectId: 'physics', courseId: 'optics', question: 'Qu’appelle-t-on distance focale ?', answer: 'La distance entre le centre optique de la lentille et son foyer principal.', difficulty: 'medium' },
  ],
  quizQuestions: [],
};
