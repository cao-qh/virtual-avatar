// server/src/clientManager.ts
export interface ClientSession {
  id: string;
  ip: string;
  connectedAt: Date;
  lastActivity: Date;
  audioStats: {
    totalChunks: number;
    totalBytes: number;
    chunksPerSecond: number;
    lastChunkTime: Date;
    averageChunkSize: number;
  };
}

import { Logger } from "./utils/logger";

export class ClientManager {
  private clients: Map<string, ClientSession> = new Map();
  private statsInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startStatsReporting();
  }

  createClient(clientId: string, ip: string): ClientSession {
    const session: ClientSession = {
      id: clientId,
      ip,
      connectedAt: new Date(),
      lastActivity: new Date(),
      audioStats: {
        totalChunks: 0,
        totalBytes: 0,
        chunksPerSecond: 0,
        lastChunkTime: new Date(),
        averageChunkSize: 0
      }
    };

    this.clients.set(clientId, session);
    Logger.info(`客户端创建`, { clientId, ip });
    
    return session;
  }

  updateAudioStats(clientId: string, chunkSize: number): void {
    const session = this.clients.get(clientId);
    if (!session) return;

    const now = new Date();
    session.lastActivity = now;
    session.audioStats.totalChunks++;
    session.audioStats.totalBytes += chunkSize;
    session.audioStats.lastChunkTime = now;
    
    // 计算平均数据块大小
    session.audioStats.averageChunkSize = 
      session.audioStats.totalBytes / session.audioStats.totalChunks;

    // 计算每秒数据块数
    const timeDiff = now.getTime() - session.connectedAt.getTime();
    session.audioStats.chunksPerSecond = 
      (session.audioStats.totalChunks / (timeDiff / 1000)) || 0;
  }

  getClient(clientId: string): ClientSession | undefined {
    return this.clients.get(clientId);
  }

  removeClient(clientId: string): void {
    const session = this.clients.get(clientId);
    if (session) {
      const duration = Math.round((Date.now() - session.connectedAt.getTime()) / 1000);
      const avgSize = (session.audioStats.averageChunkSize / 1024).toFixed(2);
      
      Logger.info(`客户端移除`, { 
        clientId, 
        duration: `${duration}秒`,
        totalChunks: session.audioStats.totalChunks,
        totalBytes: `${(session.audioStats.totalBytes / 1024 / 1024).toFixed(2)} MB`,
        averageChunkSize: `${avgSize} KB`,
        chunksPerSecond: session.audioStats.chunksPerSecond.toFixed(2)
      });
      this.clients.delete(clientId);
    }
  }

  getAllClients(): ClientSession[] {
    return Array.from(this.clients.values());
  }

  getActiveClientCount(): number {
    return this.clients.size;
  }

  private startStatsReporting(): void {
    this.statsInterval = setInterval(() => {
      const activeClients = this.getActiveClientCount();
      if (activeClients > 0) {
        const stats = this.getAllClients().map(c => ({
          id: c.id.substring(0, 8) + '...',
          chunks: c.audioStats.totalChunks,
          bytes: `${(c.audioStats.totalBytes / 1024 / 1024).toFixed(1)} MB`,
          cps: c.audioStats.chunksPerSecond.toFixed(1),
          avgSize: `${(c.audioStats.averageChunkSize / 1024).toFixed(1)} KB`
        }));
        
        Logger.info(`📈 服务器状态报告`, {
          activeClients,
          totalChunks: stats.reduce((sum, c) => sum + c.chunks, 0),
          totalBytes: `${stats.reduce((sum, c) => sum + parseFloat(c.bytes), 0).toFixed(1)} MB`,
          clients: stats
        });
      }
    }, 60000); // 每60秒报告一次
  }

  cleanup(): void {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }
  }
}
