"use client"

import { useEffect, useState } from "react"
import { AlertCircle, CheckCircle, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

type Ticket = {
  id: string
  title: string
  description: string
  status: string
  priority: string
  companyId: string
  createdAt: string
  updatedAt: string
}

type FilterType = "pendientes" | "resueltos"

export default function Dashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>("pendientes") // ✅ Bonus: estado de filtro

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      const res = await fetch("/api/tickets")
      const data = await res.json()
      setTickets(data)
    } catch (error) {
      console.error("Error fetching tickets:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleResolve = async (ticket: Ticket) => {
    if (ticket.status === "Resuelto") return

    setResolvingId(ticket.id)
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Resuelto" }),
      })

      if (res.ok) {
        const updatedTicket = await res.json()
        // Bug 2: nuevo array inmutable, React detecta el cambio y re-renderiza
        setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t))
      }
    } catch (error) {
      console.error("Error resolving ticket:", error)
    } finally {
      setResolvingId(null)
    }
  }

  // Extra: filtrar tickets según la pestaña activa
  const filteredTickets = tickets.filter(t =>
    filter === "pendientes" ? t.status !== "Resuelto" : t.status === "Resuelto"
  )

  const pendientesCount = tickets.filter(t => t.status !== "Resuelto").length
  const resueltosCount = tickets.filter(t => t.status === "Resuelto").length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">

      {/* Header */}
      <header className="bg-blue-600 text-white shadow-md sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">TechCorp Soporte</h1>
          <span className="text-sm bg-blue-700 px-3 py-1 rounded-full">Usuario Actual: Admin</span>
        </div>
      </header>

      {/* Tabs de filtro visibles en escritorio */}
      <div className="max-w-3xl mx-auto px-4 pt-6 flex gap-2">
        <button
          onClick={() => setFilter("pendientes")}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            filter === "pendientes"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-500 border border-gray-200 hover:border-blue-300"
          }`}
        >
          <Clock className="w-4 h-4" />
          Pendientes
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
            filter === "pendientes" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600"
          }`}>
            {pendientesCount}
          </span>
        </button>
        <button
          onClick={() => setFilter("resueltos")}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            filter === "resueltos"
              ? "bg-green-600 text-white"
              : "bg-white text-gray-500 border border-gray-200 hover:border-green-300"
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          Resueltos
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
            filter === "resueltos" ? "bg-green-500 text-white" : "bg-gray-100 text-gray-600"
          }`}>
            {resueltosCount}
          </span>
        </button>
      </div>

      {/* Bug 1: pb-24 evita que el footer tape los últimos tickets en móvil */}
      <main className="max-w-3xl mx-auto px-4 py-6 pb-24">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Tickets Asignados</h2>
          <p className="text-gray-500">Gestiona las solicitudes de los clientes.</p>
        </div>

        <div className="space-y-4">
          {filteredTickets.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-lg shadow-sm border border-gray-100 text-gray-500">
              {filter === "pendientes"
                ? "No hay tickets pendientes. ¡Buen trabajo!"
                : "Aún no hay tickets resueltos."}
            </div>
          ) : (
            filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                className={`bg-white rounded-lg shadow-sm border p-5 transition-colors ${
                  ticket.status === "Resuelto" ? "border-green-200 bg-green-50/30" : "border-gray-200"
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-2 items-center">
                    {ticket.priority === "Urgente" ? (
                      <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                        <AlertCircle className="w-3 h-3" />
                        URGENTE
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                        NORMAL
                      </span>
                    )}
                    <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                      {ticket.companyId}
                    </span>
                  </div>

                  {ticket.status === "Resuelto" ? (
                    <span className="flex items-center text-green-600 text-sm font-medium gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Resuelto
                    </span>
                  ) : (
                    <span className="flex items-center text-orange-500 text-sm font-medium gap-1">
                      <Clock className="w-4 h-4" />
                      Abierto
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-1">{ticket.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{ticket.description}</p>

                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                  <span className="text-xs text-gray-400">
                    Creado hace {formatDistanceToNow(new Date(ticket.createdAt), { locale: es })}
                  </span>

                  {ticket.status !== "Resuelto" && (
                    <button
                      onClick={() => handleResolve(ticket)}
                      disabled={resolvingId === ticket.id}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {resolvingId === ticket.id ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                          Resolviendo...
                        </>
                      ) : (
                        "Resolver Ticket"
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* footer ahora filtra al hacer click */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] p-4 flex justify-around items-center z-50">
        <button
          onClick={() => setFilter("pendientes")}
          className={`flex flex-col items-center transition-colors ${
            filter === "pendientes" ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <Clock className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">Pendientes ({pendientesCount})</span>
        </button>
        <button
          onClick={() => setFilter("resueltos")}
          className={`flex flex-col items-center transition-colors ${
            filter === "resueltos" ? "text-green-600" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <CheckCircle className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">Resueltos ({resueltosCount})</span>
        </button>
      </div>
    </div>
  )
}