import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const CURRENT_COMPANY_ID = 'TechCorp'
  try {
    // BUG 4 INTENCIONAL: Falta de filtro por empresa, ahora se agregará un filtro para que solo se 
    // devuelvan los tickets de la empresa actual, evitando que los usuarios vean tickets de otras empresas.
    const tickets = await prisma.ticket.findMany({
      where: {
        companyId: CURRENT_COMPANY_ID, // Parametro por nombre empresa para evitar fuga de datos
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(tickets)
  } catch (error) {
    console.error('Error fetching tickets:', error)
    return NextResponse.json({ error: 'Error fetching tickets' }, { status: 500 })
  }
}
