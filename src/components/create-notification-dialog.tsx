import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authFetch, API_BASE_URL } from "@/lib/api";

const notificationSchema = z.object({
  recipient: z.string().min(1, "El destinatario es requerido").max(100, "Máximo 100 caracteres"),
  subject: z.string().min(1, "El asunto es requerido").max(200, "Máximo 200 caracteres"),
  content: z.string().min(1, "El contenido es requerido").max(1000, "Máximo 1000 caracteres"),
  channel: z.enum(["SMS", "EMAIL", "WHATSAPP"], {
    required_error: "Seleccione un canal",
  }),
  priority: z.coerce.number().min(1, "Mínimo 1").max(5, "Máximo 5"),
  alertRuleId: z.coerce.number().min(1, "El ID de regla de alerta es requerido"),
});

type NotificationFormValues = z.infer<typeof notificationSchema>;

interface CreateNotificationDialogProps {
  onSuccess: () => void;
}

export function CreateNotificationDialog({ onSuccess }: CreateNotificationDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      recipient: "",
      subject: "",
      content: "",
      channel: "SMS",
      priority: 1,
      alertRuleId: 1,
    },
  });

  const onSubmit = async (data: NotificationFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await authFetch(`${API_BASE_URL}/notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Error al crear notificación: ${response.status}`);
      }

      toast({
        title: "Notificación creada",
        description: "La notificación ha sido creada y está en estado PENDIENTE",
      });

      form.reset();
      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error("Error al crear notificación:", error);
      toast({
        title: "Error",
        description: "No se pudo crear la notificación. Verifique los datos e intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#468d9e] hover:bg-[#3a7488] text-white">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Notificación
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-primary">Crear Nueva Notificación</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="recipient"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destinatario</FormLabel>
                  <FormControl>
                    <Input placeholder="ej: 3004510234567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asunto</FormLabel>
                  <FormControl>
                    <Input placeholder="ej: Notificación de Servicio" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contenido</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="ej: Su servicio ha sido restablecido. ¡Éxito en el envío!" 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="channel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Canal</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione canal" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="SMS">SMS</SelectItem>
                        <SelectItem value="EMAIL">EMAIL</SelectItem>
                        <SelectItem value="WHATSAPP">WHATSAPP</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridad (1-5)</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="alertRuleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID Regla Alerta</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-[#468d9e] hover:bg-[#3a7488] text-white"
              >
                {isSubmitting ? "Creando..." : "Crear Notificación"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
