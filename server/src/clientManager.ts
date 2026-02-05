export interface ClientSession {
  id: string
  ip: string
  connectedAt: Date
  lastActivity: Date
}

import { Logger } from "./utils/logger"

export class ClientManager {
  private clients: Map<string, ClientSession> = new Map()
  private statsInterval: NodeJS.Timeout | null = null

  constructor() {
    this.startStatsReporting()
  }

  createClient(clientId: string, ip: string): ClientSession {
    const session: ClientSession = {
      id: clientId,
      ip,
      connectedAt: new Date(),
      lastActivity: new Date(),
    }

    this.clients.set(clientId, session)
    Logger.info(`客户端创建`, { clientId, ip })

    return session
  }


  getClient(clientId: string): ClientSession | undefined {
    return this.clients.get(clientId)
  }

  removeClient(clientId: string): void {
    const session = this.clients.get(clientId)
    if (session) {
      const duration = Math.round(
        (Date.now() - session.connectedAt.getTime()) / 1000,
      )

      Logger.info(`客户端移除`, {
        clientId,
        duration: `${duration}秒`,
      })
      this.clients.delete(clientId)
    }
  }

  getAllClients(): ClientSession[] {
    return Array.from(this.clients.values())
  }

  getActiveClientCount(): number {
    return this.clients.size
  }

  private startStatsReporting(): void {
    this.statsInterval = setInterval(() => {
      const activeClients = this.getActiveClientCount()
      if (activeClients > 0) {
        const stats = this.getAllClients().map((c) => ({
          id: c.id.substring(0, 8) + "...",
        }))

        Logger.info(`📈 服务器状态报告`, {
          activeClients,
          clients: stats,
        })
      }
    }, 60000) // 每60秒报告一次
  }

  cleanup(): void {
    if (this.statsInterval) {
      clearInterval(this.statsInterval)
    }
  }
}
