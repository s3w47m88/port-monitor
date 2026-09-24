import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const { pid } = await request.json();
    
    if (!pid) {
      return NextResponse.json(
        { error: 'PID is required' },
        { status: 400 }
      );
    }
    
    try {
      await execAsync(`kill -9 ${pid}`);
      return NextResponse.json({ 
        success: true, 
        message: `Process ${pid} killed successfully` 
      });
    } catch (killError: any) {
      if (killError.code === 1 && killError.stderr?.includes('No such process')) {
        return NextResponse.json(
          { error: 'Process not found or already terminated' },
          { status: 404 }
        );
      }
      
      if (killError.stderr?.includes('Operation not permitted')) {
        return NextResponse.json(
          { error: 'Permission denied. Cannot kill this process.' },
          { status: 403 }
        );
      }
      
      throw killError;
    }
  } catch (error: any) {
    console.error('Error killing process:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to kill process' },
      { status: 500 }
    );
  }
}