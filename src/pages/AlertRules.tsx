import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Bell, Plus, Edit, Trash2, Mail, MessageSquare, Phone, BellRing } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface AlertRule {
  id: number;
  name: string;
  triggerEvent: string;
  messageType: string;
  targetAudience: string;
  channels: string[];
  templateId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

interface AuditLog {
  id: number;
  user: string;
  action: string;
  date: string;
  time: string;
  description: string;
}

const AlertRules = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rules, setRules] = useState<AlertRule[]>([
    {
      id: 1,
      name: "Notificación de Nuevo Pedido",
      triggerEvent: "Pedido finalizado",
      messageType: "Transaccional",
      targetAudience: "Administradores",
      channels: ["email", "whatsapp", "push"],
      templateId: 1,
      isActive: true,
      createdAt: "2025-11-10T11:00:00",
      updatedAt: "2025-11-10T11:00:00",
      createdBy: "admin",
      updatedBy: "admin"
    },
    {
      id: 2,
      name: "Alerta de Stock Bajo",
      triggerEvent: "Stock Bajo",
      messageType: "Advertencia",
      targetAudience: "Administradores",
      channels: ["email", "whatsapp"],
      templateId: 2,
      isActive: true,
      createdAt: "2025-05-10T09:15:00",
      updatedAt: "2025-05-10T09:15:00",
      createdBy: "admin",
      updatedBy: "admin"
    },
    {
      id: 3,
      name: "Bienvenida a Nuevos Usuarios",
      triggerEvent: "Nuevo Usuario Registrado",
      messageType: "Informativo",
      targetAudience: "Usuarios Registrados",
      channels: ["email", "whatsapp"],
      templateId: 3,
      isActive: false,
      createdAt: "2025-07-10T11:20:00",
      updatedAt: "2025-07-10T11:20:00",
      createdBy: "admin",
      updatedBy: "admin"
    }
  ]);

  const [auditLogs] = useState<AuditLog[]>([
    {
      id: 1,
      user: "admin",
      action: "Creación",
      date: "2025-01-08",
      time: "14:30:00",
      description: "Regla 'Notificación de Nuevo Pedido' creada"
    },
    {
      id: 2,
      user: "admin",
      action: "Modificación",
      date: "2025-01-08",
      time: "15:45:00",
      description: "Regla 'Alerta de Stock Bajo' modificada"
    },
    {
      id: 3,
      user: "admin",
      action: "Desactivación",
      date: "2025-01-08",
      time: "16:20:00",
      description: "Regla 'Bienvenida a Nuevos Usuarios' desactivada"
    }
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    triggerEvent: "",
    messageType: "",
    targetAudience: "",
    channels: [] as string[],
    templateId: 1
  });

  const totalRules = rules.length;
  const activeRules = rules.filter(r => r.isActive).length;
  const inactiveRules = rules.filter(r => !r.isActive).length;

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "email":
        return <Mail className="h-4 w-4" />;
      case "whatsapp":
        return <MessageSquare className="h-4 w-4" />;
      case "sms":
        return <Phone className="h-4 w-4" />;
      case "push":
        return <BellRing className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const handleToggleRule = (id: number) => {
    setRules(rules.map(rule => 
      rule.id === id ? { ...rule, isActive: !rule.isActive } : rule
    ));
    // Aquí se llamaría al endpoint: PATCH /alert-rules/{id}/toggle
    toast({
      title: "Estado actualizado",
      description: "El estado de la regla se ha actualizado correctamente"
    });
  };

  const handleDeleteRule = (id: number) => {
    setRules(rules.filter(rule => rule.id !== id));
    // Aquí se llamaría al endpoint: DELETE /alert-rules/{id}
    toast({
      title: "Regla eliminada",
      description: "La regla se ha eliminado correctamente"
    });
  };

  const handleEditRule = (rule: AlertRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      triggerEvent: rule.triggerEvent,
      messageType: rule.messageType,
      targetAudience: rule.targetAudience,
      channels: rule.channels,
      templateId: rule.templateId
    });
    setIsDialogOpen(true);
  };

  const handleSaveRule = () => {
    if (!formData.name || !formData.triggerEvent || !formData.messageType || !formData.targetAudience || formData.channels.length === 0) {
      toast({
        title: "Error",
        description: "Todos los campos son obligatorios",
        variant: "destructive"
      });
      return;
    }

    if (editingRule) {
      // Editar regla existente
      setRules(rules.map(rule => 
        rule.id === editingRule.id 
          ? { ...rule, ...formData, updatedAt: new Date().toISOString() }
          : rule
      ));
      // Aquí se llamaría al endpoint: PUT /alert-rules/{id}
      toast({
        title: "Regla actualizada",
        description: "La regla se ha actualizado correctamente"
      });
    } else {
      // Crear nueva regla
      const newRule: AlertRule = {
        id: Math.max(...rules.map(r => r.id)) + 1,
        ...formData,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: "admin",
        updatedBy: "admin"
      };
      setRules([...rules, newRule]);
      // Aquí se llamaría al endpoint: POST /alert-rules
      toast({
        title: "Regla creada",
        description: "La regla se ha creado correctamente"
      });
    }

    setIsDialogOpen(false);
    setEditingRule(null);
    setFormData({
      name: "",
      triggerEvent: "",
      messageType: "",
      targetAudience: "",
      channels: [],
      templateId: 1
    });
  };

  const toggleChannel = (channel: string) => {
    if (formData.channels.includes(channel)) {
      setFormData({
        ...formData,
        channels: formData.channels.filter(c => c !== channel)
      });
    } else {
      setFormData({
        ...formData,
        channels: [...formData.channels, channel]
      });
    }
  };

  useEffect(() => {
    // Aquí se consultarían los endpoints del backend:
    // GET /alert-rules
    // GET /alert-rules/audit
    // GET /message-templates
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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-green-500 p-3 rounded-lg">
              <Bell className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">CONFIGURACIÓN DE ALERTAS AUTOMÁTICAS</h1>
              <p className="text-muted-foreground">Crea, modifica y configura reglas disparadoras para alertas automáticas</p>
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-black text-white hover:bg-black/90"
                onClick={() => {
                  setEditingRule(null);
                  setFormData({
                    name: "",
                    triggerEvent: "",
                    messageType: "",
                    targetAudience: "",
                    channels: [],
                    templateId: 1
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

                <div>
                  <Label htmlFor="triggerEvent">Evento Disparador</Label>
                  <Select value={formData.triggerEvent} onValueChange={(value) => setFormData({ ...formData, triggerEvent: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un evento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pedido finalizado">Pedido finalizado</SelectItem>
                      <SelectItem value="Stock Bajo">Stock Bajo</SelectItem>
                      <SelectItem value="Nuevo Usuario Registrado">Nuevo Usuario Registrado</SelectItem>
                      <SelectItem value="Fallo en servicio">Fallo en servicio</SelectItem>
                      <SelectItem value="Vencimiento de contrato">Vencimiento de contrato</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="messageType">Tipo de mensaje</Label>
                  <Select value={formData.messageType} onValueChange={(value) => setFormData({ ...formData, messageType: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Informativo">Informativo</SelectItem>
                      <SelectItem value="Advertencia">Advertencia</SelectItem>
                      <SelectItem value="Transaccional">Transaccional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="targetAudience">Público objetivo</Label>
                  <Select value={formData.targetAudience} onValueChange={(value) => setFormData({ ...formData, targetAudience: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un público" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Clientes">Clientes</SelectItem>
                      <SelectItem value="Técnicos">Técnicos</SelectItem>
                      <SelectItem value="Administradores">Administradores</SelectItem>
                      <SelectItem value="Usuarios Registrados">Usuarios Registrados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Canales de envío</Label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.channels.includes("email")}
                        onChange={() => toggleChannel("email")}
                        className="w-4 h-4"
                      />
                      <Mail className="h-4 w-4" />
                      <span>Email</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.channels.includes("whatsapp")}
                        onChange={() => toggleChannel("whatsapp")}
                        className="w-4 h-4"
                      />
                      <MessageSquare className="h-4 w-4" />
                      <span>WhatsApp</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.channels.includes("sms")}
                        onChange={() => toggleChannel("sms")}
                        className="w-4 h-4"
                      />
                      <Phone className="h-4 w-4" />
                      <span>SMS</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.channels.includes("push")}
                        onChange={() => toggleChannel("push")}
                        className="w-4 h-4"
                      />
                      <BellRing className="h-4 w-4" />
                      <span>Push</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
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
              <p className="text-sm font-medium text-muted-foreground mb-2">Total de reglas</p>
              <p className="text-3xl font-bold text-green-600">{totalRules}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground mb-2">Reglas activas</p>
              <p className="text-3xl font-bold text-green-600">{activeRules}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground mb-2">Reglas inactivas</p>
              <p className="text-3xl font-bold text-green-600">{inactiveRules}</p>
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
                <h3 className="text-lg font-bold mb-4">REGLAS CONFIGURADAS</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Administra las reglas de notificación. Puedes crear, editar, eliminar o desactivar temporalmente cada regla.
                </p>
                <div className="rounded-lg overflow-hidden border">
                  <Table>
                    <TableHeader className="bg-gray-900">
                      <TableRow className="hover:bg-gray-900">
                        <TableHead className="text-white font-bold">Nombre</TableHead>
                        <TableHead className="text-white font-bold">Evento Disparador</TableHead>
                        <TableHead className="text-white font-bold">Tipo</TableHead>
                        <TableHead className="text-white font-bold">Público</TableHead>
                        <TableHead className="text-white font-bold">Canales</TableHead>
                        <TableHead className="text-white font-bold">Estado</TableHead>
                        <TableHead className="text-white font-bold">Última Modificación</TableHead>
                        <TableHead className="text-white font-bold">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rules.map((rule) => (
                        <TableRow key={rule.id}>
                          <TableCell className="font-medium">{rule.name}</TableCell>
                          <TableCell>{rule.triggerEvent}</TableCell>
                          <TableCell>{rule.messageType}</TableCell>
                          <TableCell>{rule.targetAudience}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {rule.channels.map((channel) => (
                                <span key={channel} className="text-muted-foreground">
                                  {getChannelIcon(channel)}
                                </span>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={rule.isActive}
                                onCheckedChange={() => handleToggleRule(rule.id)}
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

          <TabsContent value="audit">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-bold mb-4">REGISTRO DE AUDITORÍA</h3>
                <div className="rounded-lg overflow-hidden border">
                  <Table>
                    <TableHeader className="bg-gray-900">
                      <TableRow className="hover:bg-gray-900">
                        <TableHead className="text-white font-bold">ID AUDITORÍA</TableHead>
                        <TableHead className="text-white font-bold">USUARIO</TableHead>
                        <TableHead className="text-white font-bold">ACCIÓN</TableHead>
                        <TableHead className="text-white font-bold">FECHA</TableHead>
                        <TableHead className="text-white font-bold">HORA</TableHead>
                        <TableHead className="text-white font-bold">DESCRIPCIÓN</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">{log.id}</TableCell>
                          <TableCell>{log.user}</TableCell>
                          <TableCell>{log.action}</TableCell>
                          <TableCell>{log.date}</TableCell>
                          <TableCell>{log.time}</TableCell>
                          <TableCell>{log.description}</TableCell>
                        </TableRow>
                      ))}
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
