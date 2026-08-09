# Consentimiento del empleado — PulsePath (texto para app + documento)

## Versión
**CONSENT_VERSION = 1.0** (enviada al backend como `policy_version` y guardada en `consents.policy_version`).

## Texto en la app (onboarding)
> "He leído el consentimiento informado y acepto participar. Entiendo que PulsePath es una herramienta de autocontrol e investigación, no un dispositivo médico, y no proporciona un diagnóstico."

## Texto ampliado (para documento PDF que la empresa comparta)

**Información al participante — Piloto PulsePath**

PulsePath es una herramienta de bienestar laboral que mide indicadores de fatiga, somnolencia y estrés mediante tests cognitivos breves (~2–3 min/día) y cuestionarios validados (KSS, DASS-21, GAD-7, CBI).

**¿Qué datos se recogen?**
- Resultados de tests cognitivos (métricas de tiempo de reacción PVT-BA, escalas validadas)
- Contexto (horas de sueño, calidad del descanso, cafeína reciente)
- Pseudónimo: hash del código de acceso (sin nombre ni email en el servidor del estudio)

**¿Dónde se almacenan?**
- Copia local en tu dispositivo (IndexedDB)
- Con conexión, el cliente envía el payload en JSON por HTTPS al servidor del estudio; allí se almacena cifrado en reposo (AES-GCM). Retención máxima 6 meses.

**¿Quién ve mis datos?**
- Equipo de investigación: adherencia agregada sin puntuaciones individuales en el panel ops
- No se comparten datos identificables con terceros comerciales

**Versión de consentimiento:** 1.0 (visible en la app en `/consent`)

**¿Es un diagnóstico médico?**
No. PulsePath no diagnostica enfermedades ni sustituye atención médica.

**¿Puedo dejar de participar?**
Sí, en cualquier momento. Puedes borrar todos tus datos desde Ajustes → Borrar mis datos (borra IndexedDB local y llama a `POST /api/v1/me/delete` en el servidor).

**Base legal:** consentimiento explícito (Art. 6.1.a y Art. 9.2.a RGPD para datos de salud).

**Responsable del tratamiento:** [NOMBRE EMPRESA]
**Encargado:** PulsePath ([SL / contacto])

☐ He leído y acepto participar en el piloto PulsePath (consentimiento v1.0).

Firma: _________________ Fecha: _______
