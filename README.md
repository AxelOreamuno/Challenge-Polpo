# Coding Challenge: Soporte TechCorp

¡Hola! Gracias por aplicar. Para esta prueba técnica, queremos simular un escenario real de nuestro día a día. No hay requerimientos abstractos, sino un problema real de soporte que debes resolver.

Se evaluará tu capacidad para:
- Entender código existente (Node.js, React/Next.js, Tailwind).
- Utilizar herramientas de IA (Claude, Cursor, Gemini, etc.) para acelerar tu diagnóstico y resolución.
- Priorizar tareas críticas bajo presión.
- Mantener el orden y las buenas prácticas al corregir bugs.

## Contexto

Acabas de iniciar tu día y recibes el siguiente mensaje por Slack de José (Project Manager):

> **De:** José | **Para:** Equipo de Soporte
>
> "Hola chicos, buenos días. Les paso contexto de unos inconvenientes urgentes que tenemos en la plataforma de TechCorp. Austin (del cliente) me indica que no puede ingresar a resolver los tickets desde su celular, el botón de 'Resolver' simplemente no le hace nada.
>
> Además, al parecer están teniendo que recargar toda la página para ver cuando un ticket cambia de estado. Es un tema urgente porque las personas de soporte de ellos no pueden gestionar los casos marcados como 'Urgente', dicen que el sistema se queda cargando y nunca termina. Ya estoy creando los tickets en Jira.
>
> Y por último, y esto es lo más crítico: me acaban de confirmar que un usuario pudo ver los tickets de OTRA empresa. Necesitamos revisar qué está interfiriendo ahí con la base de datos o el servicio, no podemos tener esa fuga de datos.
>
> Me confirman cuando lo tengan listo para coordinar pruebas finales con ellos. Mil gracias."

## Tareas a realizar

1. Clona este repositorio e instala las dependencias (`npm install`).
2. Levanta la base de datos local poblada de prueba (`npm run db:setup`) y el servidor (`npm run dev`).
3. Identifica y resuelve los 4 problemas mencionados por José en su mensaje.
4. Sube tu código a un repositorio público (GitHub/GitLab) y envíanos el enlace.

**Nota:** Tienes total libertad de usar herramientas de IA para apoyarte. Lo que nos importa es cómo analizas el problema, cómo guías a la IA y la calidad de la solución final. ¡Éxitos!

---

## Solución

### Herramientas utilizadas
- **Claude (Anthropic)** — análisis de bugs, diagnóstico y generación de fixes
- **VS Code** — edición y revisión del código
- **Prisma Studio** — inspección de la base de datos local

### Bugs identificados y resueltos

---

#### Bug 1 — Botón "Resolver" no funciona en móvil
**Archivo:** `src/app/page.tsx`

**Causa:** El footer de navegación fijo (`fixed bottom-0 z-50`) solapaba visualmente los últimos tickets en pantallas móviles. El botón "Resolver" era visible pero quedaba tapado por el footer, haciendo los clicks imposibles.

**Fix:** Se agregó `pb-24` al contenedor `<main>` para que el contenido tenga suficiente espacio inferior y nunca quede oculto detrás del footer.

#### Bug 2 — La UI no se actualiza al resolver un ticket
**Archivo:** `src/app/page.tsx`

**Causa:** Se mutaba directamente el array de estado de React (`tickets[ticketIndex] = updatedTicket`). Al pasar la misma referencia a `setTickets()`, React no detectaba ningún cambio y no volvía a renderizar la UI.

**Fix:** Se reemplazó la mutación directa por un `.map()` que retorna un nuevo array, lo que React sí detecta como cambio de estado.
```tsx
// Antes
tickets[ticketIndex] = updatedTicket
setTickets(tickets) // misma referencia, React no re-renderiza

// Después
setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t))
```

---

#### Bug 3 — Tickets "Urgente" se quedan cargando infinitamente
**Archivo:** `src/app/api/tickets/[id]/route.ts`

**Causa:** La función `sendEmailNotification()` retornaba una `Promise` que nunca llamaba a `resolve()`, bloqueando el hilo indefinidamente con `await`.

**Fix:** Se eliminó el `await` y se encadenó `.catch()` para manejar errores sin bloquear la respuesta. Adicionalmente se agregó `resolve()` a la Promise.
```typescript
// Antes
await sendEmailNotification(ticket.id, ticket.companyId) // bloqueo infinito

// Después
sendEmailNotification(ticket.id, ticket.companyId).catch(err =>
  console.error('Error enviando notificación de email:', err)
)
```

---

#### Bug 4 — Fuga de datos entre empresas
**Archivo:** `src/app/api/tickets/route.ts`

**Causa:** La query `prisma.ticket.findMany()` no tenía ningún filtro, por lo que retornaba los tickets de **todas** las empresas en la base de datos a cualquier usuario autenticado.

**Fix:** Se agregó un filtro `where: { companyId }` para aislar los resultados por empresa. En producción este valor debe provenir de la sesión autenticada del usuario (NextAuth, JWT, etc.).
```typescript
// Antes
const tickets = await prisma.ticket.findMany({
  orderBy: { createdAt: 'desc' },
}) // retorna tickets de TODAS las empresas

// Después
const CURRENT_COMPANY_ID = 'TechCorp' //
const tickets = await prisma.ticket.findMany({
  where: { companyId: CURRENT_COMPANY_ID },
  orderBy: { createdAt: 'desc' },
})
```

---

### Adicional — Filtro de navegación funcional
Se aprovechó la corrección del Bug 1 para también implementar funcionalidad real en el footer de navegación móvil y agregar tabs de filtro en escritorio. Ahora los botones "Pendientes" y "Resueltos" filtran la lista activamente y muestran contadores en tiempo real.
