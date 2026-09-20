import type { LearningData } from '@/src/domain/learning';

export const initialLearningData: LearningData = {
  version: 2,
  subjects: [
    {
      id: 'industry',
      name: 'Industrie graphique',
      icon: 'layers',
      accent: '#7657e8',
      description: 'Procédés, supports, PAO et production graphique',
    },
    {
      id: 'maths',
      name: 'Mathématiques',
      icon: 'calculator',
      accent: '#2da9e9',
      description: 'Calculs, fonctions et outils scientifiques',
    },
    {
      id: 'physics',
      name: 'Physique-chimie',
      icon: 'flask',
      accent: '#f18a4b',
      description: 'Optique, matière et phénomènes physiques',
    },
    {
      id: 'culture',
      name: 'Culture générale et expression',
      icon: 'book',
      accent: '#ed6f9f',
      description: 'Analyse, argumentation et expression écrite',
    },
    {
      id: 'english',
      name: 'Anglais LV1',
      icon: 'language',
      accent: '#28b79a',
      description: 'Compréhension et communication professionnelle',
    },
    {
      id: 'science-language',
      name: 'Enseignement scientifique en LV',
      icon: 'language',
      accent: '#9a67e8',
      description: 'Sciences et vocabulaire technique en langue vivante',
    },
    {
      id: 'complement-35',
      name: 'Complément 35',
      icon: 'calculator',
      accent: '#e5a532',
      description: 'Compléments et consolidation des acquis',
    },
    {
      id: 'remedial',
      name: 'Remise à niveau',
      icon: 'book',
      accent: '#8da257',
      description: 'Notions essentielles et exercices de consolidation',
    },
    {
      id: 'personal-support',
      name: 'Accompagnement personnalisé',
      icon: 'book',
      accent: '#d16d86',
      description: 'Méthodes, suivi et préparation personnelle',
    },
  ],
  courses: [],
  flashcards: [],
  quizQuestions: [],
};
