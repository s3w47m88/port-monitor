import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'port-names.json');

async function ensureDataFile() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, '{}');
  }
}

export async function GET() {
  try {
    await ensureDataFile();
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    console.error('Error reading port names:', error);
    return NextResponse.json({}, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDataFile();
    const { port, name } = await request.json();
    
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    const portNames = JSON.parse(data);
    
    if (name && name.trim()) {
      portNames[port] = name.trim();
    } else {
      delete portNames[port];
    }
    
    await fs.writeFile(DATA_FILE, JSON.stringify(portNames, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving port name:', error);
    return NextResponse.json({ error: 'Failed to save port name' }, { status: 500 });
  }
}