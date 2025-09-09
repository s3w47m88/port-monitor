import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface Port {
  port: number;
  process: string;
  pid: string;
  protocol: string;
}

export async function GET() {
  try {
    const ports: Port[] = [];
    
    const { stdout } = await execAsync('lsof -iTCP -sTCP:LISTEN -P -n');
    
    const lines = stdout.split('\n').slice(1);
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      const parts = line.split(/\s+/);
      if (parts.length < 9) continue;
      
      const processName = parts[0];
      const pid = parts[1];
      const portInfo = parts[8];
      
      const portMatch = portInfo.match(/:(\d+)$/);
      if (portMatch) {
        const port = parseInt(portMatch[1]);
        
        if (port >= 1 && port <= 10000) {
          const existingPort = ports.find(p => p.port === port);
          if (!existingPort) {
            ports.push({
              port,
              process: processName,
              pid,
              protocol: 'TCP'
            });
          }
        }
      }
    }
    
    ports.sort((a, b) => a.port - b.port);
    
    return NextResponse.json({ ports });
  } catch (error) {
    console.error('Error scanning ports:', error);
    return NextResponse.json({ ports: [], error: 'Failed to scan ports' }, { status: 500 });
  }
}