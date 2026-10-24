import { TriviaQuestion } from '../types/game';

export const TRIVIA_QUESTIONS_POOL: TriviaQuestion[] = [
  {
    id: 1,
    category: 'Machine Learning',
    question: '¿Qué tipo de algoritmo aprende agrupando datos sin etiquetas previas?',
    options: ['Aprendizaje No Supervisado (Unsupervised)', 'Aprendizaje Supervisado', 'Regresión Lineal Simple', 'Clasificación Binaria'],
    correctIndex: 0,
    explanation: 'El Aprendizaje No Supervisado (como K-Means o clustering) no requiere etiquetas para agrupar patrones.',
    timeLimit: 15,
  },
  {
    id: 2,
    category: 'Datos & IA',
    question: '¿Qué metodología estándar para proyectos de minería de datos incluye 6 fases desde el entendimiento del negocio?',
    options: ['CRISP-DM', 'Scrum Sprint', 'Waterfall 2.0', 'Six Sigma Lean'],
    correctIndex: 0,
    explanation: 'CRISP-DM (Cross-Industry Standard Process for Data Mining) es el estándar industrial más adoptado.',
    timeLimit: 15,
  },
  {
    id: 3,
    category: 'Tecnología',
    question: '¿Qué protocolo de red permite comunicación bidireccional en tiempo real y persistente entre cliente y servidor?',
    options: ['WebSockets', 'HTTP GET clásico', 'DNS Lookup', 'FTP Pasivo'],
    correctIndex: 0,
    explanation: 'WebSockets mantiene una conexión TCP full-duplex abierta, ideal para juegos multijugador y chats.',
    timeLimit: 15,
  },
  {
    id: 4,
    category: 'Machine Learning',
    question: '¿Cómo se llama el fenómeno cuando un modelo memoriza el ruido del set de entrenamiento y falla en datos nuevos?',
    options: ['Overfitting (Sobreajuste)', 'Underfitting (Subajuste)', 'Cross-Validation', 'Early Stopping'],
    correctIndex: 0,
    explanation: 'El sobreajuste (Overfitting) ocurre cuando el modelo tiene un rendimiento casi perfecto en train pero falla en test.',
    timeLimit: 15,
  },
  {
    id: 5,
    category: 'Data Science',
    question: 'En un modelo de predicción de abandono de clientes (churn), ¿qué valor representa un Falso Negativo?',
    options: ['Un cliente que sí se fue pero el modelo predijo que se quedaba', 'Un cliente fiel al que le enviamos promoción por error', 'Un cliente nuevo sin historial', 'Un cliente duplicado en la base de datos'],
    correctIndex: 0,
    explanation: 'El FN es una omisión: el evento positivo (abandono) ocurrió pero el modelo predijo negativo.',
    timeLimit: 15,
  },
];
