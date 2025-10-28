# 📋 Guía de Prueba - 3 Ramas de Integración `/lecturas-nicho`

## 🎯 Objetivo
Cada rama implementa un enfoque diferente para obtener datos completos de medidores desde `/lecturas-nicho` en lugar de usar solo `/sector`.

---

## 🔵 Rama A: `feature/lecturas-nicho-hybrid` (Híbrido - Fetch al Abrir)

### Cómo Probar
```bash
git checkout feature/lecturas-nicho-hybrid
bun run dev
```

### Comportamiento Esperado
1. **Búsqueda de lecturas**: Usa `/sector` (1 llamada HTTP) ✅ Rápido
2. **Click en un medidor**: 
   - Muestra "Cargando..." mientras llama a `/lecturas-nicho`
   - 1 llamada HTTP adicional con periodo + nicho
3. **Formulario**: Se abre con datos completos del medidor

### Qué Observar en Dev Tools (Network Tab)
- Al buscar: `GET /sector` 
- Al abrir medidor: `GET /lecturas-nicho?periodo=X&nicho=Y`
- **Total**: 2 llamadas HTTP (1 inicial + 1 por medidor)

### Ventajas
- ✅ Búsqueda inicial muy rápida
- ✅ Mínimo uso de red (solo carga lo necesario)
- ✅ Simple de entender

### Desventajas
- ⏱️ Delay de ~500ms al abrir cada medidor
- 🔄 Si editas 5 medidores del mismo nicho = 5 llamadas repetidas

---

## 🟢 Rama C: `feature/lecturas-nicho-store` (Store Inteligente con Cache) ⭐ RECOMENDADA

### Cómo Probar
```bash
git checkout feature/lecturas-nicho-store
bun run dev
```

### Comportamiento Esperado
1. **Búsqueda de lecturas**: Usa `/sector` (1 llamada HTTP) ✅ Rápido
2. **Click en PRIMER medidor de un nicho**:
   - Muestra "Cargando..." 
   - Llama a `/lecturas-nicho` para ese nicho
   - **Cachea TODOS los medidores del mismo nicho**
3. **Click en SEGUNDO medidor del MISMO nicho**:
   - ✨ Abre INSTANTÁNEO (sin llamada HTTP)
   - Usa datos del cache
4. **Click en medidor de OTRO nicho**:
   - Llama a `/lecturas-nicho` para el nuevo nicho
   - Cachea todos sus medidores

### Qué Observar en Dev Tools (Network Tab)
- Al buscar: `GET /sector`
- Primer medidor de "SECTOR 2": `GET /lecturas-nicho?periodo=X&nicho=SECTOR%202`
- Segundo medidor de "SECTOR 2": **SIN LLAMADA** (cache)
- Primer medidor de "SECTOR 3": `GET /lecturas-nicho?periodo=X&nicho=SECTOR%203`
- **Total**: 1 llamada inicial + 1 por nicho único (no por medidor)

### Ventajas
- ✅ Búsqueda inicial rápida
- ✅ Cache inteligente reduce llamadas repetidas
- ✅ Óptimo si editas varios medidores del mismo nicho
- ✅ Balance perfecto rendimiento/UX

### Desventajas
- ⏱️ Primer medidor de cada nicho tiene delay de ~500ms
- 💾 Usa más memoria (cache en store)

---

## 🔴 Rama B: `feature/lecturas-nicho-full` (Carga Todo Adelantada)

### Cómo Probar
```bash
git checkout feature/lecturas-nicho-full
bun run dev
```

### Comportamiento Esperado
1. **Búsqueda de lecturas**: 
   - Llama a `/sector` para obtener estructura
   - Llama a `/lecturas-nicho` para CADA nicho en paralelo
   - ⏱️ Pantalla de carga más larga (~2-5 segundos)
2. **Click en cualquier medidor**:
   - ✨ Abre INSTANTÁNEO
   - Todos los datos ya están cargados
3. **Formulario**: Abre inmediatamente con datos completos

### Qué Observar en Dev Tools (Network Tab)
- Al buscar:
  - `GET /sector`
  - `GET /lecturas-nicho?periodo=X&nicho=SECTOR%201` (paralelo)
  - `GET /lecturas-nicho?periodo=X&nicho=SECTOR%202` (paralelo)
  - `GET /lecturas-nicho?periodo=X&nicho=SECTOR%203` (paralelo)
  - ... (todas al mismo tiempo)
- Al abrir medidor: **SIN LLAMADAS**
- **Total**: 1 + N llamadas (N = número de nichos)

### Ventajas
- ✅ Abrir medidores es INSTANTÁNEO (todo pre-cargado)
- ✅ No hay delays después de la carga inicial
- ✅ Todos los datos completos desde el inicio

### Desventajas
- ⏱️ Carga inicial MUY lenta (3-10 segundos con 10 nichos)
- 🌐 Alto uso de red (carga TODO aunque no lo uses)
- 💾 Mucha memoria (todos los medidores de todos los nichos)
- ⚠️ Puede ser problemático con muchos nichos/medidores

---

## 🧪 Escenario de Prueba Recomendado

Para ver las diferencias claramente:

### Escenario 1: Usuario edita 1 solo medidor
```
1. Buscar lecturas para un sector
2. Abrir 1 medidor
3. Editar y guardar
```
**Ganador**: Rama A (Híbrido) - más rápida para este caso

### Escenario 2: Usuario edita 3 medidores del mismo nicho
```
1. Buscar lecturas para un sector
2. Abrir medidor 1 de "SECTOR 2" → editar → volver
3. Abrir medidor 2 de "SECTOR 2" → editar → volver
4. Abrir medidor 3 de "SECTOR 2" → editar → volver
```
**Ganador**: Rama C (Store Cache) - los medidores 2 y 3 abren instantáneo

### Escenario 3: Usuario revisa TODOS los medidores sin editar
```
1. Buscar lecturas
2. Abrir 10 medidores diferentes
3. Solo mirar datos (sin editar)
```
**Ganador**: Rama B (Full) - todo pre-cargado, sin esperas

---

## 📊 Comparación Visual

### Línea de Tiempo - Usuario edita 3 medidores del mismo nicho

**Rama A (Híbrido)**
```
Buscar [███] → Abrir M1 [██] → Volver → Abrir M2 [██] → Volver → Abrir M3 [██]
0s            1s            2s         3s            4s          5s
```

**Rama C (Store Cache)** ⭐
```
Buscar [███] → Abrir M1 [██] → Volver → Abrir M2 [✓] → Volver → Abrir M3 [✓]
0s            1s            2s         2.1s          2.2s        2.3s
```

**Rama B (Full)**
```
Buscar [█████████] → Abrir M1 [✓] → Volver → Abrir M2 [✓] → Volver → Abrir M3 [✓]
0s                4s          4.1s        4.2s        4.3s         4.4s
```

---

## 🎯 Recomendación Final

**Para esta aplicación, recomiendo la Rama C** (`feature/lecturas-nicho-store`) porque:

1. ✅ Balance perfecto entre velocidad inicial y UX fluida
2. ✅ Los usuarios normalmente editan varios medidores del mismo nicho secuencialmente
3. ✅ Cache reduce significativamente las esperas
4. ✅ No sobrecarga la red como la Rama B
5. ✅ Código limpio y mantenible

**Casos donde preferir otras:**
- **Rama A**: Si SIEMPRE editas 1 solo medidor por sesión
- **Rama B**: Si SIEMPRE revisas/editas TODOS los medidores

---

## 🐛 Bugs Corregidos en Rama C

Se corrigieron los siguientes problemas:
- ✅ Store de claves con validaciones defensivas (evita `undefined.length`)
- ✅ Fetch warning (ahora usa el `fetch` de SvelteKit)
- ✅ Manejo correcto de estructura de respuesta de `/Claves`
- ✅ Autorización con token en headers

---

## 📝 Cómo Probar

```bash
# 1. Probar Rama C (recomendada)
git checkout feature/lecturas-nicho-store
bun run dev

# 2. Probar Rama A (simple)
git checkout feature/lecturas-nicho-hybrid
bun run dev

# 3. Probar Rama B (completa)
git checkout feature/lecturas-nicho-full
bun run dev

# 4. Volver a main
git checkout main
```

**Tip**: Abre DevTools → Network tab para ver las llamadas HTTP en cada rama

