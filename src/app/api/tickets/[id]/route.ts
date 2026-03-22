import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// BUG 3 INTENCIONAL: Resuelto el problema de la promesa que no se resolvía, ahora la función 
// `sendEmailNotification` devuelve una promesa que se resuelve correctamente, evitando que el proceso se quede esperando indefinidamente.

async function sendEmailNotification(ticketId: string, companyId: string): Promise<void> {
  return new Promise((resolve) => {
    console.log(`Enviando notificación urgente para el ticket ${ticketId} de la empresa ${companyId}...`)
    resolve() // ✅ La promesa ahora resuelve correctamente
  })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await request.json()

    // Buscamos el ticket para ver su prioridad
    const ticket = await prisma.ticket.findUnique({
      where: { id },
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 })
    }

    if (ticket.priority === 'Urgente' && status === 'Resuelto') {
      // no bloqueamos la respuesta esperando el email
      // Si el email falla, lo logueamos pero el ticket igual se actualiza
      sendEmailNotification(ticket.id, ticket.companyId).catch(err =>
        console.error('Error enviando notificación de email:', err)
      )
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json(updatedTicket)
  } catch (error) {
    console.error('Error updating ticket:', error)
    return NextResponse.json({ error: 'Error updating ticket' }, { status: 500 })
  }
}
