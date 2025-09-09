'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Save, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface Port {
  port: number;
  process: string;
  pid: string;
  protocol: string;
}

type SortField = 'port' | 'process' | 'name';
type SortOrder = 'asc' | 'desc';

export default function PortMonitor() {
  const [ports, setPorts] = useState<Port[]>([]);
  const [portNames, setPortNames] = useState<Record<number, string>>({});
  const [editingPort, setEditingPort] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNamedOnly, setShowNamedOnly] = useState(false);
  const [sortField, setSortField] = useState<SortField>('port');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchPorts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ports');
      const data = await response.json();
      setPorts(data.ports || []);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching ports:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPortNames = useCallback(async () => {
    try {
      const response = await fetch('/api/port-names');
      const data = await response.json();
      setPortNames(data || {});
    } catch (error) {
      console.error('Error fetching port names:', error);
    }
  }, []);

  const savePortName = async (port: number, name: string) => {
    try {
      await fetch('/api/port-names', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ port, name })
      });
      
      if (name.trim()) {
        setPortNames(prev => ({ ...prev, [port]: name }));
      } else {
        setPortNames(prev => {
          const newNames = { ...prev };
          delete newNames[port];
          return newNames;
        });
      }
      
      setEditingPort(null);
      setEditValue('');
    } catch (error) {
      console.error('Error saving port name:', error);
    }
  };

  useEffect(() => {
    fetchPorts();
    fetchPortNames();

    const interval = setInterval(() => {
      fetchPorts();
    }, 3000);

    const handleFocus = () => {
      fetchPorts();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchPorts, fetchPortNames]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredAndSortedPorts = ports
    .filter(port => {
      const matchesSearch = 
        port.port.toString().includes(searchTerm) ||
        port.process.toLowerCase().includes(searchTerm.toLowerCase()) ||
        port.pid.includes(searchTerm) ||
        (portNames[port.port] && portNames[port.port].toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesNamedFilter = !showNamedOnly || portNames[port.port];
      
      return matchesSearch && matchesNamedFilter;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'port':
          comparison = a.port - b.port;
          break;
        case 'process':
          comparison = a.process.localeCompare(b.process);
          break;
        case 'name':
          const nameA = portNames[a.port] || '';
          const nameB = portNames[b.port] || '';
          comparison = nameA.localeCompare(nameB);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />;
    return sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">Port Monitor</CardTitle>
              <CardDescription>
                Monitoring {ports.length} active ports • Last updated: {lastUpdate.toLocaleTimeString()}
              </CardDescription>
            </div>
            <Button
              onClick={fetchPorts}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search ports, processes, PIDs, or names..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant={showNamedOnly ? "default" : "outline"}
                onClick={() => setShowNamedOnly(!showNamedOnly)}
              >
                {showNamedOnly ? "Show All" : "Named Only"}
              </Button>
            </div>

            <div className="border rounded-lg">
              <div className="grid grid-cols-12 gap-4 p-3 bg-muted/50 font-medium text-sm">
                <button
                  className="col-span-2 flex items-center gap-1 hover:text-primary transition-colors"
                  onClick={() => handleSort('port')}
                >
                  Port <SortIcon field="port" />
                </button>
                <button
                  className="col-span-3 flex items-center gap-1 hover:text-primary transition-colors"
                  onClick={() => handleSort('process')}
                >
                  Process <SortIcon field="process" />
                </button>
                <div className="col-span-2">PID</div>
                <div className="col-span-1">Protocol</div>
                <button
                  className="col-span-4 flex items-center gap-1 hover:text-primary transition-colors"
                  onClick={() => handleSort('name')}
                >
                  Custom Name <SortIcon field="name" />
                </button>
              </div>

              <div className="divide-y">
                {filteredAndSortedPorts.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    {searchTerm || showNamedOnly ? 'No ports match your filters' : 'No active ports found'}
                  </div>
                ) : (
                  filteredAndSortedPorts.map((port) => (
                    <div key={port.port} className="grid grid-cols-12 gap-4 p-3 hover:bg-muted/30 transition-colors">
                      <div className="col-span-2 font-mono font-semibold">
                        {port.port}
                      </div>
                      <div className="col-span-3 font-medium">
                        {port.process}
                      </div>
                      <div className="col-span-2 text-muted-foreground">
                        {port.pid}
                      </div>
                      <div className="col-span-1">
                        <Badge variant="secondary" className="text-xs">
                          {port.protocol}
                        </Badge>
                      </div>
                      <div className="col-span-4">
                        {editingPort === port.port ? (
                          <div className="flex gap-2">
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              placeholder="Enter custom name..."
                              className="h-8"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  savePortName(port.port, editValue);
                                }
                              }}
                              autoFocus
                            />
                            <Button
                              size="sm"
                              onClick={() => savePortName(port.port, editValue)}
                            >
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingPort(null);
                                setEditValue('');
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingPort(port.port);
                              setEditValue(portNames[port.port] || '');
                            }}
                            className="text-left hover:text-primary transition-colors w-full"
                          >
                            {portNames[port.port] ? (
                              <span className="font-medium">{portNames[port.port]}</span>
                            ) : (
                              <span className="text-muted-foreground">Click to add name...</span>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}