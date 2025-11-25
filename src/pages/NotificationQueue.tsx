import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Bell, Send, Clock, AlertTriangle, Activity, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { CreateNotificationDialog } from "@/components/create-notification-dialog";

// 🟢 IMPORTACIONES
// NOTA: Asumo que NotificationStatsDto en lib/api.ts coincide con el DTO del Backend (totalEnviado, tazaExito)
// Si no está definido en lib/api.ts, debes definirlo ahí o aquí para que TS funcione.
import { getNotificationStats, NotificationStatsDto, authFetch, API_BASE_URL } from "@/lib/api";


// 🟢 INTERFAZ PRINCIPAL DE MÉTRICAS (La que usamos para el estado limpio del Frontend)
interface NotificationMetrics {
    serviceStatus: "active" | "inactive";
    // Estos son los nombres limpios que usa el Frontend
    sent: number;
    pending: number;
    failed: number;
    processing: number;
    successRate: number;
}

// 🟢 INTERFAZ DE NOTIFICACIÓN (Basada en NotificationDTO del Backend)
interface NotificationDTO {
    id: number;
    recipient: string;
    subject: string;
    content: string;
    channel: string;
    status: string;
    createdAt: string;
    sentAt: string | null;
    reintentosCount: number;
    errorMenssage: string | null;
    priority: number;
}


const NotificationQueue = () => {
    const navigate = useNavigate();
    const { toast } = useToast();

    // 🟢 ESTADOS INICIALIZADOS
    const [metrics, setMetrics] = useState<NotificationMetrics>({
        serviceStatus: "inactive",
        sent: 0,
        pending: 0,
        failed: 0,
        processing: 0,
        successRate: 0,
    });

    const [errorLogs, setErrorLogs] = useState<NotificationDTO[]>([]);
    const [queueMessages, setQueueMessages] = useState<NotificationDTO[]>([]);

    // Cargar datos del backend al montar el componente
    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. OBTENER ESTADÍSTICAS
                const statsData = await getNotificationStats();

                if (statsData) {
                    // 🟢 CORRECCIÓN CLAVE: Mapear los nombres del DTO del Backend (español)
                    // a los nombres de estado del Frontend (inglés/camelCase).
                    const backendData = statsData as unknown as {
                        totalEnviado: number,
                        totalPendiente: number,
                        totalFallido: number,
                        totalProcesando: number,
                        tazaExito: number
                    };

                    setMetrics({
                        serviceStatus: "active",
                        sent: backendData.totalEnviado,
                        pending: backendData.totalPendiente,
                        failed: backendData.totalFallido,
                        processing: backendData.totalProcesando,
                        successRate: backendData.tazaExito,
                    });

                } else {
                    console.warn("Advertencia: getNotificationStats devolvió datos nulos o vacíos.");
                    setMetrics(prev => ({ ...prev, serviceStatus: "inactive" }));
                }

                // 2. OBTENER LOGS DE ERRORES (Endpoint /notifications/errors)
                const errorsResponse = await authFetch(`${API_BASE_URL}/notifications/errors`);
                if (errorsResponse.ok) {
                    const errorsData: NotificationDTO[] = await errorsResponse.json();
                    setErrorLogs(errorsData);
                } else {
                    console.warn(`Advertencia: No se pudieron cargar los logs de errores. Status: ${errorsResponse.status}`);
                    setErrorLogs([]);
                }

                // 3. OBTENER COLA DE MENSAJES (Nuevo Endpoint /notifications/queue)
                const queueResponse = await authFetch(`${API_BASE_URL}/notifications/queue`);
                if (queueResponse.ok) {
                    const queueData: NotificationDTO[] = await queueResponse.json();
                    setQueueMessages(queueData);
                } else {
                    console.warn(`Advertencia: No se pudo cargar la cola de mensajes. Status: ${queueResponse.status}`);
                    setQueueMessages([]);
                }


            } catch (error) {
                console.error("Error al cargar datos del backend:", error);
                toast({
                    title: "Error de Conexión/API",
                    description: "No se pudo autenticar o conectar para cargar las métricas de la cola.",
                    variant: "destructive"
                });
                setMetrics(prev => ({ ...prev, serviceStatus: "inactive" }));
            }
        };

        fetchData();

        // Actualización automática cada 30 segundos
        const interval = setInterval(() => {
            fetchData();
        }, 30000);

        return () => clearInterval(interval);
    }, [toast]);

    // Función auxiliar para badge de estado
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDIENTE': return <Badge className="bg-blue-500 hover:bg-blue-500">PENDIENTE</Badge>;
            case 'PROCESANDO': return <Badge className="bg-yellow-500 hover:bg-yellow-500">PROCESANDO</Badge>;
            case 'FALLIDA': return <Badge variant="destructive">FALLIDA</Badge>;
            case 'REINTENTANDO': return <Badge className="bg-orange-500 hover:bg-orange-500">REINTENTANDO</Badge>;
            case 'ENVIADO': return <Badge variant="default">ENVIADO</Badge>;
            default: return <Badge variant="secondary">{status}</Badge>;
        }
    }


    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-7xl mx-auto">
                <Button
                    variant="secondary"
                    onClick={() => navigate("/")}
                    className="mb-6 flex items-center gap-2 bg-[#F5F5F5] hover:bg-[#E5E5E5] text-black"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver
                </Button>

                {/* Encabezado */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="bg-[#468d9e] p-3 rounded-lg">
                            <Bell className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-primary">MONITOREO COLA DE NOTIFICACIONES</h1>
                            <p className="text-muted-foreground">Monitoreo y gestión de cola de envíos</p>
                        </div>
                    </div>
                    <CreateNotificationDialog onSuccess={() => {
                        // Recargar datos después de crear una notificación
                        window.location.reload();
                    }} />
                </div>

                {/* Cards de métricas */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                    {/* Estado del servicio */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1 bg-[#F5F5F5] rounded">
                                    <Activity className="h-4 w-4 text-[#737373]" />
                                </div>
                                <p className="text-sm font-medium text-muted-foreground">Estado del servicio</p>
                            </div>
                            <p className={`text-lg font-bold ${metrics.serviceStatus === "active" ? "text-[#468d9e]" : "text-red-600"}`}>
                                {metrics.serviceStatus === "active" ? "Activo" : "Inactivo"}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Enviados */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1 bg-[#468d9e]/20 rounded">
                                    <Send className="h-4 w-4 text-[#468d9e]" />
                                </div>
                                <p className="text-sm font-medium text-muted-foreground">Enviados</p>
                            </div>
                            <p className="text-3xl font-bold text-[#468D9E]">{metrics.sent ?? 0}</p>
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
                            <p className="text-3xl font-bold text-yellow-600">
                                {(metrics.pending ?? 0) + (metrics.processing ?? 0)}
                            </p>
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
                            <p className="text-3xl font-bold text-red-600">{metrics.failed ?? 0}</p>
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
                            <p className="text-3xl font-bold text-foreground">{(metrics.successRate ?? 0).toFixed(1)}%</p>
                            <Progress value={metrics.successRate ?? 0} className="mt-2 h-2" />
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

                    {/* TABLA: COLA DE MENSAJES (PENDIENTES/PROCESANDO) */}
                    <TabsContent value="queue">
                        <Card>
                            <CardContent className="pt-6">
                                <h3 className="text-lg font-bold mb-4 text-primary">MENSAJES PENDIENTES Y EN PROCESO ({queueMessages.length})</h3>
                                <div className="rounded-lg overflow-hidden border">
                                    <Table>
                                        <TableHeader className="bg-primary">
                                            <TableRow className="hover:bg-primary">
                                                <TableHead className="text-primary-foreground font-bold">ID</TableHead>
                                                <TableHead className="text-primary-foreground font-bold">Asunto</TableHead>
                                                <TableHead className="text-primary-foreground font-bold">Destinatario</TableHead>
                                                <TableHead className="text-primary-foreground font-bold">Canal</TableHead>
                                                <TableHead className="text-primary-foreground font-bold">Estado</TableHead>
                                                <TableHead className="text-primary-foreground font-bold">Prioridad</TableHead>
                                                <TableHead className="text-primary-foreground font-bold">Creado</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {queueMessages.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="text-center text-muted-foreground">No hay notificaciones en la cola actualmente.</TableCell>
                                                </TableRow>
                                            ) : (
                                                queueMessages.map((msg) => (
                                                    <TableRow key={msg.id}>
                                                        <TableCell className="font-medium">{msg.id}</TableCell>
                                                        <TableCell>{msg.subject}</TableCell>
                                                        <TableCell>{msg.recipient}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="secondary">{msg.channel}</Badge>
                                                        </TableCell>
                                                        <TableCell>{getStatusBadge(msg.status)}</TableCell>
                                                        <TableCell>{msg.priority}</TableCell>
                                                        <TableCell>{new Date(msg.createdAt).toLocaleString()}</TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TABLA: LOGS DE ERRORES (FALLIDAS/REINTENTANDO) */}
                    <TabsContent value="logs">
                        <Card>
                            <CardContent className="pt-6">
                                <h3 className="text-lg font-bold mb-4 text-primary">LOGS DE ERRORES Y REINTENTOS</h3>
                                <div className="rounded-lg overflow-hidden border">
                                    <Table>
                                        <TableHeader className="bg-primary">
                                            <TableRow className="hover:bg-primary">
                                                <TableHead className="text-primary-foreground font-bold">ID LOG</TableHead>
                                                <TableHead className="text-primary-foreground font-bold">CANAL</TableHead>
                                                <TableHead className="text-primary-foreground font-bold">ERROR</TableHead>
                                                <TableHead className="text-primary-foreground font-bold">FECHA/HORA</TableHead>
                                                <TableHead className="text-primary-foreground font-bold">INTENTOS</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {errorLogs.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center text-muted-foreground">No hay logs de error o reintentos recientes.</TableCell>
                                                </TableRow>
                                            ) : (
                                                errorLogs.map((log) => {
                                                    const dateTime = log.createdAt ? new Date(log.createdAt) : null;
                                                    const dateStr = dateTime ? dateTime.toLocaleString() : 'N/A';

                                                    return (
                                                        <TableRow key={log.id}>
                                                            <TableCell className="font-medium">{log.id}</TableCell>
                                                            <TableCell>{log.channel}</TableCell>
                                                            <TableCell className="text-red-600">{log.errorMenssage || log.status}</TableCell>
                                                            <TableCell>{dateStr}</TableCell>
                                                            <TableCell>
                                                                <Badge variant="destructive" className="rounded-full">
                                                                    {log.reintentosCount}
                                                                </Badge>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TABLA: ESTADÍSTICAS DETALLADAS */}
                    <TabsContent value="stats">
                        <Card>
                            <CardContent className="pt-6">
                                <h3 className="text-lg font-bold mb-4 text-primary">RESUMEN DETALLADO DE MÉTRICAS</h3>
                                <div className="rounded-lg overflow-hidden border">
                                    <Table>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell className="font-bold w-[30%]">Estado del Servicio</TableCell>
                                                <TableCell>{metrics.serviceStatus === "active" ? "Operativo" : "Fuera de línea"}</TableCell>
                                            </TableRow>
                                            <TableRow className="bg-[#468d9e]/10">
                                                <TableCell className="font-bold">Total Enviados</TableCell>
                                                <TableCell className="text-[#468d9e]">{metrics.sent ?? 0}</TableCell>
                                            </TableRow>
                                            <TableRow className="bg-yellow-50/50">
                                                <TableCell className="font-bold">Total Pendientes (en cola)</TableCell>
                                                <TableCell className="text-yellow-600">{metrics.pending ?? 0}</TableCell>
                                            </TableRow>
                                            <TableRow className="bg-yellow-50/50">
                                                <TableCell className="font-bold">Total Procesando (en envío)</TableCell>
                                                <TableCell className="text-yellow-600">{metrics.processing ?? 0}</TableCell>
                                            </TableRow>
                                            <TableRow className="bg-red-50/50">
                                                <TableCell className="font-bold">Total Fallidos</TableCell>
                                                <TableCell className="text-red-600">{metrics.failed ?? 0}</TableCell>
                                            </TableRow>
                                            <TableRow className="font-bold">
                                                <TableCell>Tasa de Éxito</TableCell>
                                                <TableCell>{(metrics.successRate ?? 0).toFixed(2)}%</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell className="font-bold">Total General (Enviados + Cola + Fallidos)</TableCell>
                                                <TableCell>{(metrics.sent ?? 0) + (metrics.pending ?? 0) + (metrics.processing ?? 0) + (metrics.failed ?? 0)}</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default NotificationQueue;
