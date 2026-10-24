import React, { useState } from 'react';
import { X, BookOpen, Calculator, Award, Info, Sparkles, CheckCircle2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ConfusionGuideModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'concepts' | 'matrix' | 'formulas' | 'examples'>('concepts');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 rounded-xl text-indigo-400 border border-indigo-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Guía Maestra: Matriz de Confusión
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 font-normal">
                  Machine Learning
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Basado en el curso de Hugo Alexander Martínez Gallego (Marketing Analytics)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 px-5 gap-2 pt-2">
          {[
            { id: 'concepts', label: '1. Fundamentos', icon: Info },
            { id: 'matrix', label: '2. Estructura 2x2', icon: Sparkles },
            { id: 'formulas', label: '3. Métricas Clave', icon: Calculator },
            { id: 'examples', label: '4. Casos Reales', icon: Award },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-3 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 ${
                  isActive
                    ? 'border-indigo-500 text-indigo-300 bg-slate-800/60'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-200 text-sm">
          {activeTab === 'concepts' && (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-950/40 border border-indigo-800/40 rounded-xl">
                <h3 className="font-bold text-white text-base mb-1">¿Qué es la Matriz de Confusión?</h3>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Es una herramienta fundamental en Machine Learning para evaluar el rendimiento de un modelo de
                  clasificación. Ayuda a entender cuán bien clasifica al mostrar el número de predicciones correctas e
                  incorrectas comparadas con los valores reales del mundo real.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-orange-950/30 border border-orange-500/40">
                  <div className="flex items-center gap-2 font-bold text-orange-400 mb-1">
                    <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                    Verdaderos Positivos (TP)
                  </div>
                  <p className="text-xs text-slate-300">
                    Casos donde el modelo predijo correctamente la clase positiva (Aciertos Clase 1).
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40">
                  <div className="flex items-center gap-2 font-bold text-emerald-400 mb-1">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    Falsos Negativos (FN)
                  </div>
                  <p className="text-xs text-slate-300">
                    Casos donde el modelo predijo negativo, pero el valor real era positivo (conocidas como <strong className="text-white">omisiones</strong>).
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40">
                  <div className="flex items-center gap-2 font-bold text-amber-400 mb-1">
                    <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                    Falsos Positivos (FP)
                  </div>
                  <p className="text-xs text-slate-300">
                    Casos donde el modelo predijo la clase positiva, pero el valor real era negativo (conocidas como <strong className="text-white">falsas alarmas</strong>).
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-sky-950/30 border border-sky-500/40">
                  <div className="flex items-center gap-2 font-bold text-sky-400 mb-1">
                    <span className="w-3 h-3 rounded-full bg-sky-500"></span>
                    Verdaderos Negativos (TN)
                  </div>
                  <p className="text-xs text-slate-300">
                    Casos donde el modelo predijo correctamente la clase negativa (Aciertos Clase 2).
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'matrix' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                La matriz de 2x2 organiza las predicciones (columnas) frente a los valores observados reales (filas):
              </p>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr>
                      <th className="p-3 text-left bg-slate-800 text-slate-300 rounded-tl-xl border border-slate-700">
                        Observado \ Pronosticado
                      </th>
                      <th className="p-3 text-center bg-indigo-900/40 text-indigo-300 border border-slate-700 font-bold">
                        Predicción Clase 1 (Positivo)
                      </th>
                      <th className="p-3 text-center bg-indigo-900/40 text-indigo-300 border border-slate-700 font-bold rounded-tr-xl">
                        Predicción Clase 2 (Negativo)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-3 font-semibold text-slate-200 bg-slate-800/60 border border-slate-700">
                        Valor Real: Clase 1 (Positivo)
                      </td>
                      <td className="p-4 text-center bg-orange-500/20 border border-orange-500/50">
                        <div className="font-bold text-orange-400 text-sm">Aciertos (TP)</div>
                        <div className="text-[11px] text-slate-400">True Positive</div>
                      </td>
                      <td className="p-4 text-center bg-emerald-500/20 border border-emerald-500/50">
                        <div className="font-bold text-emerald-400 text-sm">Fallos (FN)</div>
                        <div className="text-[11px] text-slate-400">False Negative / Omisión</div>
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-200 bg-slate-800/60 border border-slate-700 rounded-bl-xl">
                        Valor Real: Clase 2 (Negativo)
                      </td>
                      <td className="p-4 text-center bg-amber-500/20 border border-amber-500/50">
                        <div className="font-bold text-amber-400 text-sm">Fallos (FP)</div>
                        <div className="text-[11px] text-slate-400">False Positive / Falsa Alarma</div>
                      </td>
                      <td className="p-4 text-center bg-sky-500/20 border border-sky-500/50 rounded-br-xl">
                        <div className="font-bold text-sky-400 text-sm">Aciertos (TN)</div>
                        <div className="text-[11px] text-slate-400">True Negative</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700 text-xs space-y-1">
                <span className="font-semibold text-white">💡 Regla visual de la presentación:</span>
                <p className="text-slate-300">
                  La diagonal principal (naranja y celeste) son los aciertos reales del modelo. La diagonal secundaria (amarillo y verde) son los errores de clasificación.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'formulas' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-800/70 border border-slate-700 rounded-xl">
                  <div className="text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
                    Accuracy (Exactitud)
                  </div>
                  <div className="text-base font-mono font-bold text-white mb-1.5">
                    (TP + TN) / Total
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Proporción total de predicciones correctas sobre todo el conjunto de muestras.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-800/70 border border-slate-700 rounded-xl">
                  <div className="text-orange-400 font-bold text-xs uppercase tracking-wider mb-1">
                    Precisión (Precision)
                  </div>
                  <div className="text-base font-mono font-bold text-white mb-1.5">
                    TP / (TP + FP)
                  </div>
                  <p className="text-[11px] text-slate-300">
                    De todas las predicciones positivas hechas por el modelo, ¿cuántas fueron reales? Mide confiabilidad.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-800/70 border border-slate-700 rounded-xl">
                  <div className="text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1">
                    Exhaustividad / Recall / Sensibilidad
                  </div>
                  <div className="text-base font-mono font-bold text-white mb-1.5">
                    TP / (TP + FN)
                  </div>
                  <p className="text-[11px] text-slate-300">
                    De todos los casos que realmente eran positivos en la realidad, ¿cuántos logró detectar el modelo?
                  </p>
                </div>

                <div className="p-3.5 bg-slate-800/70 border border-slate-700 rounded-xl">
                  <div className="text-purple-400 font-bold text-xs uppercase tracking-wider mb-1">
                    F1-Score (Media Armónica)
                  </div>
                  <div className="text-base font-mono font-bold text-white mb-1.5">
                    2 * (P * R) / (P + R)
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Balance equilibrado entre Precisión y Recall. Si uno es 0, el F1-Score cae a 0.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-800/70 border border-slate-700 rounded-xl md:col-span-2">
                  <div className="text-rose-400 font-bold text-xs uppercase tracking-wider mb-1">
                    Overall Error Rate (OER)
                  </div>
                  <div className="text-base font-mono font-bold text-white mb-1.5">
                    (FP + FN) / Total = 1 - Accuracy
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Tasa global de errores cometidos: suma de falsas alarmas y omisiones sobre el total.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'examples' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-800/70 border border-slate-700 rounded-xl">
                <h4 className="font-bold text-amber-400 text-sm mb-1">
                  1. Ejemplo Gato vs Perro (Datos Desbalanceados)
                </h4>
                <p className="text-xs text-slate-300 mb-2">
                  Dataset de 1000 animales: 990 gatos y 10 perros.
                  Si un modelo clasificador perezoso dice &quot;Gato&quot; para todos:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 bg-slate-900 rounded-lg">
                    <div className="text-slate-400 text-[10px]">Accuracy</div>
                    <div className="text-emerald-400 font-bold text-sm">99.0%</div>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg">
                    <div className="text-slate-400 text-[10px]">Precisión Gato</div>
                    <div className="text-emerald-400 font-bold text-sm">99.0%</div>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg">
                    <div className="text-slate-400 text-[10px]">Recall Perro</div>
                    <div className="text-rose-400 font-bold text-sm">0.0%</div>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg">
                    <div className="text-slate-400 text-[10px]">F1 Perro</div>
                    <div className="text-rose-400 font-bold text-sm">0.0%</div>
                  </div>
                </div>
                <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>
                    ¡Aunque el Accuracy parezca excelente (99%), el clasificador es inútil para detectar perros!
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-800/70 border border-slate-700 rounded-xl">
                <h4 className="font-bold text-sky-400 text-sm mb-1">
                  2. Caso Sector Televisión (300 espectadores)
                </h4>
                <p className="text-xs text-slate-300 mb-2">
                  TP = 140 (Vio y se predijo Sí), FN = 60 (Vio y se predijo No), FP = 20 (No vio y se predijo Sí), TN = 80 (No vio y se predijo No).
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 bg-slate-900 rounded-lg">
                    <div className="text-slate-400 text-[10px]">Accuracy</div>
                    <div className="text-sky-400 font-bold text-sm">73.3%</div>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg">
                    <div className="text-slate-400 text-[10px]">Precisión</div>
                    <div className="text-orange-400 font-bold text-sm">87.5%</div>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg">
                    <div className="text-slate-400 text-[10px]">Exhaustividad</div>
                    <div className="text-emerald-400 font-bold text-sm">70.0%</div>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg">
                    <div className="text-slate-400 text-[10px]">F-Score</div>
                    <div className="text-purple-400 font-bold text-sm">77.7%</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
          >
            Entendido, volver al juego
          </button>
        </div>
      </div>
    </div>
  );
};
