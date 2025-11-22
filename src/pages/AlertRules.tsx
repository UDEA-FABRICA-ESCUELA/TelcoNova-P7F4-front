import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Bell, Plus, Edit, Trash2, Mail, MessageSquare, Phone, BellRing, AlertTriangle, Send, List } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge"; // Asumiendo que usas Badge para la acción

// 🟢 IMPORTACIONES DE API Y CONSTANTES
import {
    AlertRuleDto,
    MessageTemplateDto,
    getAllAlertRules,
    createAlertRule,
    deleteAlertRule,
    updateAlertRule,
    getAllTemplates,
    authFetch,
    API_BASE_URL,
    activateAlertRule,
    deactivateAlertRule,
} from "@/lib/api";

// 🟢 DEFINICIÓN DE CONSTANTES
const EVENT_TRIGGERS_OPTIONS = [
    { value: 'USER_REGISTERED', label: 'Nuevo usuario registrado' },
    { value: 'TICKET_CREATED', label: 'Nuevo ticket creado' },
    { value: 'TICKET_ASSIGNED', label: 'Ticket asignado a técnico' },
    { value: 'TICKET_STATUS_CHANGED', label: 'Estado de ticket cambiado' },
    { value: 'SLA_WARNING', label: 'Advertencia de SLA próximo a vencer' },
    { value: 'SLA_BREACHED', label: 'SLA violado' },
];

const NOTIFICATION_CHANNEL_OPTIONS = [
    { value: 'EMAIL', label: 'Correo Electrónico' },
    { value: 'SMS', label: 'Mensaje de Texto' },
    { value: 'PUSH', label: 'Notificación Push' },
    { value: 'WHATSAPP', label: 'WhatsApp' },
];

const TARGET_AUDIENCE_OPTIONS = [
    { value: 'CLIENT', label: 'Cliente Final' },
    { value: 'TECHNICIAN', label: 'Técnico Asignado' },
    { value: 'SUPERVISOR', label: 'Supervisor/Administrador' },
];

type AlertRule = AlertRuleDto;

// 🟢 INTERFAZ DEL FORMULARIO
interface AlertRuleForm {
    name: string;
    description: string;
    eventTrigger: string;
    templateId: number | null;
    targetAudience: string;
    channel: string;
}

// 🟢 INTERFAZ DE AUDITORÍA: Corregida para coincidir con AlertRuleAuditDto de Java
interface AuditLog {
    id: number;
    ruleId: number;
    ruleName: string;
    action: string;
    performedBy: string; // ⬅️ Antes era 'user', ahora es 'performedBy'
    timestamp: string; // ⬅️ Viene como string ISO del LocalDateTime de Java
    changes: string | null;
    ipAddress: string;
}

const AlertRules = () => {
    const navigate = useNavigate();
    const { toast } = useToast();

    // 🟢 ESTADOS
    const [rules, setRules] = useState<AlertRule[]>([]);
    const [templates, setTemplates] = useState<MessageTemplateDto[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<AlertRule | null>(null);

    // 🟢 ESTADO DE FORMULARIO
    const [formData, setFormData] = useState<AlertRuleForm>({
        name: "",
        description: "",
        eventTrigger: "",
        templateId: null,
        targetAudience: "",
        channel: "",
    });


    const totalRules = rules.length;
    const activeRules = rules.filter(r => r.isActive).length;
    const inactiveRules = rules.filter(r => !r.isActive).length;

    const getChannelIcon = (channel: string) => {
        switch (channel.toLowerCase()) {
            case "email":
                return <Mail className="h-4 w-4" />;
            case "whatsapp":
                return <MessageSquare className="h-4 w-4" />;
            case "sms":
            case "push":
                return <BellRing className="h-4 w-4" />;
            default:
                return null;
        }
    };

    const handleToggleRule = async (id: number, currentStatus: boolean) => {
        try {
            let resultRule: AlertRuleDto;

            if (currentStatus) {
                resultRule = await deactivateAlertRule(id);
            } else {
                resultRule = await activateAlertRule(id);
            }

            setRules(rules.map(rule =>
                rule.id === id ? resultRule : rule
            ));

            toast({
                title: "Estado actualizado",
                description: `La regla se ha ${resultRule.isActive ? 'activado' : 'desactivado'} correctamente.`
            });

            // 🟢 OPCIONAL: Recargar logs de auditoría después de una acción
            await fetchAuditLogs(); // Si implementas esta función
            // Si no implementas la recarga aquí, se verá después de un refresh o de cambiar de tab

        } catch (error) {
            console.error("Error al cambiar estado:", error);
            toast({
                title: "Error",
                description: "No se pudo actualizar el estado de la regla.",
                variant: "destructive"
            });
        }
    };

    const handleDeleteRule = async (id: number) => {
        try {
            await deleteAlertRule(id);

            setRules(rules.filter(rule => rule.id !== id));
            toast({
                title: "Regla eliminada",
                description: "La regla se ha eliminado correctamente"
            });
            // 🟢 OPCIONAL: Recargar logs de auditoría
            await fetchAuditLogs();
        } catch (error) {
            console.error("Error al eliminar regla:", error);
            toast({
                title: "Error",
                description: "No se pudo eliminar la regla",
                variant: "destructive"
            });
        }
    };

    const handleEditRule = (rule: AlertRule) => {
        setEditingRule(rule);
        setFormData({
            name: rule.name,
            description: rule.description || "",
            eventTrigger: rule.triggerEvent || "",
            templateId: rule.templateId,
            targetAudience: rule.targetAudience,
            channel: rule.channel,
        });
        setIsDialogOpen(true);
    };

    const handleSaveRule = async () => {
        // 🟢 VALIDACIÓN
        if (!formData.name || !formData.eventTrigger || !formData.targetAudience || !formData.channel || !formData.templateId || formData.templateId <= 0) {
            toast({
                title: "Error",
                description: "Todos los campos obligatorios deben estar llenos y la plantilla debe ser seleccionada.",
                variant: "destructive"
            });
            return;
        }

        const payload = {
            name: formData.name,
            description: formData.description,
            eventTrigger: formData.eventTrigger,
            templateId: formData.templateId,
            targetAudience: formData.targetAudience,
            channel: formData.channel,
            // Priority y isActive se manejan en el backend
        };


        try {
            let resultRule;
            if (editingRule) {
                resultRule = await updateAlertRule(editingRule.id, payload);

                setRules(rules.map(rule =>
                    rule.id === editingRule.id ? resultRule : rule
                ));
                toast({
                    title: "Regla actualizada",
                    description: "La regla se ha actualizado correctamente"
                });
            } else {
                resultRule = await createAlertRule(payload);

                setRules([...rules, resultRule]);
                toast({
                    title: "Regla creada",
                    description: "La regla se ha creado correctamente"
                });
            }

            setIsDialogOpen(false);
            setEditingRule(null);
            setFormData({
                name: "",
                description: "",
                eventTrigger: "",
                templateId: null,
                targetAudience: "",
                channel: "",
            });
            // 🟢 OPCIONAL: Recargar logs de auditoría
            await fetchAuditLogs();
        } catch (error) {
            console.error("Error al guardar regla:", error);
            toast({
                title: "Error",
                description: "No se pudo guardar la regla",
                variant: "destructive"
            });
        }
    };

    // 🟢 FUNCIÓN DEDICADA PARA OBTENER LOGS (Opcional, si quieres refactorizar)
    const fetchAuditLogs = async () => {
        try {
            // Asumo que el API ya tiene la función getAuditLogs() importada de api.ts
            // Si no está, usa el metodo authFetch como fallback:
            const auditResponse = await authFetch(`${API_BASE_URL}/alert-rules/audit-log`);
            if (auditResponse.ok) {
                const auditData: AuditLog[] = await auditResponse.json();
                setAuditLogs(auditData);
            } else {
                console.error("Fallo al obtener logs de auditoría:", auditResponse.status);
            }
        } catch (error) {
            console.error("Error al obtener logs de auditoría:", error);
        }
    }


    useEffect(() => {
        const fetchData = async () => {
            try {
                // 🟢 OBTENER REGLAS
                const rulesData = await getAllAlertRules();
                setRules(rulesData as AlertRule[]);

                // 🟢 OBTENER PLANTILLAS
                const templatesData = await getAllTemplates();
                setTemplates(templatesData);

                // 🟢 OBTENER AUDITORÍA
                await fetchAuditLogs(); // Usamos la nueva función

            } catch (error) {
                console.error("Error al cargar datos del backend:", error);
                toast({
                    title: "Error de Conexión",
                    description: "No se pudieron cargar las reglas o plantillas. Asegúrate de que el backend está activo.",
                    variant: "destructive"
                });
            }
        };

        fetchData();
    }, []);

    const getEventLabel = (value: string) => EVENT_TRIGGERS_OPTIONS.find(o => o.value === value)?.label || value;
    const getAudienceLabel = (value: string) => TARGET_AUDIENCE_OPTIONS.find(o => o.value === value)?.label || value;
    const getTemplateName = (id: number) => templates.find(t => t.id === id)?.name || `ID: ${id} (Error)`;


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
                            <h1 className="text-2xl font-bold text-primary">CONFIGURACIÓN DE ALERTAS AUTOMÁTICAS</h1>
                            <p className="text-muted-foreground">Crea, modifica y configura reglas disparadoras para alertas automáticas</p>
                        </div>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button
                                className="bg-primary text-primary-foreground hover:bg-primary-hover"
                                onClick={() => {
                                    setEditingRule(null);
                                    setFormData({
                                        name: "",
                                        description: "",
                                        eventTrigger: "",
                                        templateId: null,
                                        targetAudience: "",
                                        channel: "",
                                    });
                                }}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Nueva Regla
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>{editingRule ? "Editar Regla" : "Nueva Regla de Notificación"}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="name">Nombre de la regla</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Ej: Notificación de Nuevo Pedido"
                                    />
                                </div>

                                {/* 🟢 EVENTO DISPARADOR */}
                                <div>
                                    <Label htmlFor="eventTrigger">Evento Disparador</Label>
                                    <Select
                                        value={formData.eventTrigger}
                                        onValueChange={(value) => setFormData({ ...formData, eventTrigger: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona un evento" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {EVENT_TRIGGERS_OPTIONS.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* 🟢 TIPO DE MENSAJE */}
                                <div>
                                    <Label htmlFor="templateId">Tipo de mensaje (Plantilla asociada)</Label>
                                    <Select
                                        value={formData.templateId ? formData.templateId.toString() : ""}
                                        onValueChange={(value) => setFormData({ ...formData, templateId: parseInt(value) })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona una plantilla" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {templates.map((template) => (
                                                <SelectItem key={template.id} value={template.id.toString()}>
                                                    {template.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* 🟢 PÚBLICO OBJETIVO */}
                                <div>
                                    <Label htmlFor="targetAudience">Público objetivo</Label>
                                    <Select value={formData.targetAudience} onValueChange={(value) => setFormData({ ...formData, targetAudience: value })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona un público" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TARGET_AUDIENCE_OPTIONS.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* 🟢 CANALES DE ENVÍO */}
                                <div>
                                    <Label>Canal de envío (Selección única)</Label>
                                    <Select value={formData.channel} onValueChange={(value) => setFormData({ ...formData, channel: value })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona un canal" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {NOTIFICATION_CHANNEL_OPTIONS.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Nota: Tu backend solo permite un canal por regla.
                                    </p>
                                </div>


                                <div className="flex justify-end gap-2 pt-4">
                                    <Button variant="secondary" onClick={() => setIsDialogOpen(false)} className="bg-[#F5F5F5] hover:bg-[#E5E5E5] text-foreground">
                                        Cancelar
                                    </Button>
                                    <Button onClick={handleSaveRule}>
                                        {editingRule ? "Guardar Cambios" : "Crear Regla"}
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Cards de totales */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1 bg-[#F5F5F5] rounded">
                                    <List className="h-4 w-4 text-[#171717]" />
                                </div>
                                <p className="text-sm font-medium text-muted-foreground">Total de reglas</p>
                            </div>
                            <p className="text-3xl font-bold text-[#171717]">{totalRules}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1 bg-[#468d9e]/20 rounded">
                                    <Send className="h-4 w-4 text-[#468d9e]" />
                                </div>
                                <p className="text-sm font-medium text-muted-foreground">Reglas activas</p>
                            </div>
                            <p className="text-3xl font-bold text-[#468d9e]">{activeRules}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1 bg-red-100 rounded">
                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                </div>
                                <p className="text-sm font-medium text-muted-foreground">Reglas inactivas</p>
                            </div>
                            <p className="text-3xl font-bold text-[#DC2626]">{inactiveRules}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="rules" className="w-full">
                    <TabsList className="mb-4">
                        <TabsTrigger value="rules">Reglas de Notificaciones</TabsTrigger>
                        <TabsTrigger value="audit">Registro de Auditoría</TabsTrigger>
                    </TabsList>

                    <TabsContent value="rules">
                        <Card>
                            <CardContent className="pt-6">
                                <h3 className="text-lg font-bold mb-4 text-primary">REGLAS CONFIGURADAS</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Administra las reglas de notificación. Puedes crear, editar, eliminar o desactivar temporalmente cada regla.
                                </p>
                                <div className="rounded-lg overflow-hidden border">
                                    <Table>
                                        <TableHeader className="bg-primary">
                                            <TableRow className="hover:bg-primary">
                                                <TableHead className="text-primary-foreground font-bold">Nombre</TableHead>
                                                <TableHead className="text-primary-foreground font-bold">Evento Disparador</TableHead>
                                                <TableHead className="text-primary-foreground font-bold">Plantilla</TableHead>
                                                <TableHead className="text-primary-foreground font-bold">Público</TableHead>
                                                <TableHead className="text-primary-foreground font-bold">Canal</TableHead>
                                                <TableHead className="text-primary-foreground font-bold">Estado</TableHead>
                                                <TableHead className="text-primary-foreground font-bold">Última Modificación</TableHead>
                                                <TableHead className="text-primary-foreground font-bold">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {rules.map((rule) => (
                                                <TableRow key={rule.id}>
                                                    <TableCell className="font-medium">{rule.name}</TableCell>
                                                    <TableCell>{getEventLabel(rule.triggerEvent)}</TableCell>
                                                    <TableCell>{getTemplateName(rule.templateId)}</TableCell>
                                                    <TableCell>{getAudienceLabel(rule.targetAudience)}</TableCell>
                                                    <TableCell>
                                                        <span className="text-muted-foreground">
                                                            {getChannelIcon(rule.channel)}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Switch
                                                                checked={rule.isActive}
                                                                onCheckedChange={() => handleToggleRule(rule.id, rule.isActive)}
                                                            />
                                                            <span className="text-sm text-muted-foreground">
                                                                {rule.isActive ? "Activo" : "Inactivo"}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{new Date(rule.updatedAt).toLocaleString()}</TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleEditRule(rule)}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleDeleteRule(rule.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* 🟢 TABS CONTENT DE AUDITORÍA CORREGIDO */}
                    <TabsContent value="audit">
                        <Card>
                            <CardContent className="pt-6">
                                <h3 className="text-lg font-bold mb-4 text-primary">REGISTRO DE AUDITORÍA</h3>
                                <div className="rounded-lg overflow-hidden border">
                                    <Table>
                                        <TableHeader className="bg-primary">
                                            <TableRow className="hover:bg-primary">
                                                <TableHead className="text-primary-foreground font-bold">ID AUDITORÍA</TableHead>
                                                <TableHead className="text-primary-foreground font-bold">USUARIO</TableHead>
                                                <TableHead className="text-primary-foreground font-bold">ACCIÓN</TableHead>
                                                <TableHead className="text-primary-foreground font-bold">FECHA</TableHead>
                                                <TableHead className="text-primary-foreground font-bold">HORA</TableHead>
                                                <TableHead className="text-primary-foreground font-bold">DESCRIPCIÓN</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {auditLogs.map((log) => {
                                                // 🟢 1. PROCESAR TIMESTAMP
                                                const dateTime = log.timestamp ? new Date(log.timestamp) : null;
                                                const dateStr = dateTime ? dateTime.toLocaleDateString() : 'N/A';
                                                const timeStr = dateTime ? dateTime.toLocaleTimeString() : 'N/A';

                                                // 🟢 2. PROCESAR CAMBIOS (JSON)
                                                let descriptionContent: React.ReactNode;

                                                try {
                                                    if (log.changes && log.changes !== "{}") {
                                                        const parsedChanges = JSON.parse(log.changes);
                                                        // Mostrar el JSON formateado si es complejo
                                                        descriptionContent = (
                                                            <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-1 rounded border overflow-auto max-h-24">
                                                                {JSON.stringify(parsedChanges, null, 2)}
                                                            </pre>
                                                        );
                                                    } else {
                                                        // Descripción simple para CREATE/ACTIVATE/DEACTIVATE/DELETE
                                                        descriptionContent = (
                                                            <span>{log.action} de regla: **{log.ruleName || `ID ${log.ruleId}`}**</span>
                                                        );
                                                    }
                                                } catch (e) {
                                                    // Fallback si el JSON está mal
                                                    descriptionContent = log.changes || "Sin detalles adicionales";
                                                }


                                                return (
                                                    <TableRow key={log.id}>
                                                        <TableCell className="font-medium">{log.id}</TableCell>
                                                        {/* 🟢 USUARIO: Usa performedBy */}
                                                        <TableCell className="font-medium">{log.performedBy || 'SYSTEM'}</TableCell>
                                                        {/* 🟢 ACCIÓN: Usa Badge para estilo */}
                                                        <TableCell>
                                                            <Badge variant="secondary">{log.action}</Badge>
                                                        </TableCell>
                                                        {/* 🟢 FECHA */}
                                                        <TableCell>{dateStr}</TableCell>
                                                        {/* 🟢 HORA */}
                                                        <TableCell>{timeStr}</TableCell>
                                                        {/* 🟢 DESCRIPCIÓN: Usa la lógica de procesamiento */}
                                                        <TableCell className="text-muted-foreground text-sm">
                                                            {descriptionContent}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
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

export default AlertRules;