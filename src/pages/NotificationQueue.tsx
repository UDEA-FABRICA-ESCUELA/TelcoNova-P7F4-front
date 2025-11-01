import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Bell, Send, Clock, AlertTriangle, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

interface NotificationMetrics {
  serviceStatus: "active" | "inactive";
  sent: number;
  pending: number;
  failed: number;
  successRate: number;
}

interface ErrorLog {
  id: string;
  module: string;
  error: string;
  date: string;
  attempts: number;
}

const NotificationQueue = () => {
  const navigate = useNavigate();
  
  // Mock data - esto se reemplazará con datos reales del backend
  const [metrics, setMetrics] = useState<NotificationMetrics>({
    serviceStatus: "active",
    sent: 23,
    pending: 23,
    failed: 23,
    successRate: 97.8
  });

  const [errorLogs] = useState<ErrorLog[]>([
    {
      id: "MSG-001",
      module: "MSG-003",
      error: "Número de WhatsApp no válido",
      date: "2025-01-08 18:30:20",
      attempts: 3
    },
    {
      id: "MSG-02",
      module: "MSG-002",
      error: "Rate limit exceeded para SMS",
      date: "2025-01-08 14:23:20",
      attempts: 3
    },
    {
      id: "MSG-001",
      module: "MSG-001",
      error: "Servidor de email temporalmente no disponible",
      date: "2025-01-08 14:25:50",
      attempts: 3
    }
  ]);

  // Actualización automática cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      // Aquí se consultarían los endpoints del backend:
      // GET /notifications/status
      // GET /notifications/metrics
      // GET /notifications/errors
      console.log("Actualizando métricas...");
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="outline"
          onClick={() => navigate("/")}
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>

        {/* Encabezado */}
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-green-500 p-3 rounded-lg">
            <Bell className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">MONITOREO COLA DE NOTIFICACIONES</h1>
            <p className="text-muted-foreground">Monitoreo y gestión de cola de envíos</p>
          </div>
        </div>

        {/* Cards de métricas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          {/* Estado del servicio */}
          <Card className="border-2 border-primary">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium text-muted-foreground">Estado del servicio</p>
              </div>
              <p className={`text-lg font-bold ${metrics.serviceStatus === "active" ? "text-green-600" : "text-red-600"}`}>
                {metrics.serviceStatus === "active" ? "Activo" : "Inactivo"}
              </p>
            </CardContent>
          </Card>

          {/* Enviados */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 bg-green-100 rounded">
                  <Send className="h-4 w-4 text-green-600" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Enviados</p>
              </div>
              <p className="text-3xl font-bold text-foreground">{metrics.sent}</p>
            </CardContent>
          </Card>

          {/* Pendientes */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 bg-yellow-100 rounded">
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Pendientes</p>
              </div>
              <p className="text-3xl font-bold text-yellow-600">{metrics.pending}</p>
            </CardContent>
          </Card>

          {/* Fallidos */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 bg-red-100 rounded">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Fallidos</p>
              </div>
              <p className="text-3xl font-bold text-red-600">{metrics.failed}</p>
            </CardContent>
          </Card>

          {/* Tasa de éxito */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 bg-blue-100 rounded">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Tasa de Éxito</p>
              </div>
              <p className="text-3xl font-bold text-foreground">{metrics.successRate}%</p>
              <Progress value={metrics.successRate} className="mt-2 h-2" />
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="logs" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="queue">Cola de mensajes</TabsTrigger>
            <TabsTrigger value="logs">Logs de errores</TabsTrigger>
            <TabsTrigger value="stats">Estadísticas</TabsTrigger>
          </TabsList>

          <TabsContent value="queue">
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center py-8">Funcionalidad en desarrollo</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-bold mb-4">LOGS DE ERRORES Y REINTENTOS</h3>
                <div className="rounded-lg overflow-hidden border">
                  <Table>
                    <TableHeader className="bg-gray-900">
                      <TableRow className="hover:bg-gray-900">
                        <TableHead className="text-white font-bold">ID LOG</TableHead>
                        <TableHead className="text-white font-bold">MÓDULO</TableHead>
                        <TableHead className="text-white font-bold">ERROR</TableHead>
                        <TableHead className="text-white font-bold">FECHA</TableHead>
                        <TableHead className="text-white font-bold">INTENTOS</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {errorLogs.map((log, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{log.id}</TableCell>
                          <TableCell>{log.module}</TableCell>
                          <TableCell className="text-red-600">{log.error}</TableCell>
                          <TableCell>{log.date}</TableCell>
                          <TableCell>
                            <Badge variant="destructive" className="rounded-full">
                              {log.attempts}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats">
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center py-8">Funcionalidad en desarrollo</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default NotificationQueue;
