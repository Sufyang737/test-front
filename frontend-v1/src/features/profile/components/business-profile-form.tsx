"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { businessProfileSchema } from "../schemas/business-profile"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TimePicker } from "@/components/ui/time-picker"
import { Switch } from "@/components/ui/switch"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Loader2, CheckCircle2 } from "lucide-react"
import { createBusinessProfile, getBusinessProfile } from "@/lib/pocketbase"
import { useAuth } from "@clerk/nextjs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface BusinessHours {
  open: string
  close: string
  enabled: boolean
}

interface DaysConfig {
  [key: string]: BusinessHours
}

export function BusinessProfileForm() {
  const { userId } = useAuth();
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [businessDays, setBusinessDays] = useState<DaysConfig>({
    monday: { open: "09:00", close: "18:00", enabled: true },
    tuesday: { open: "09:00", close: "18:00", enabled: true },
    wednesday: { open: "09:00", close: "18:00", enabled: true },
    thursday: { open: "09:00", close: "18:00", enabled: true },
    friday: { open: "09:00", close: "18:00", enabled: true },
    saturday: { open: "09:00", close: "14:00", enabled: true },
    sunday: { open: "09:00", close: "14:00", enabled: false },
  })

  const form = useForm({
    resolver: zodResolver(businessProfileSchema),
    defaultValues: {
      businessName: "",
      description: "",
      address: "",
      phone: "",
      email: "",
      website: "",
      socialMedia: {
        facebook: "",
        instagram: "",
        twitter: "",
      },
    },
  })

  // Cargar datos existentes
  useEffect(() => {
    async function loadExistingProfile() {
      if (!userId) return;

      try {
        setIsLoading(true);
        const profile = await getBusinessProfile(userId);
        
        if (profile) {
          // Parse opening hours back into state
          const hours = profile.opening_hours.split('; ').reduce((acc: DaysConfig, curr: string) => {
            const [day, time] = curr.split(': ');
            if (time === 'Closed') {
              acc[day.toLowerCase()] = { ...businessDays[day.toLowerCase()], enabled: false };
            } else {
              const [open, close] = time.split(' - ');
              acc[day.toLowerCase()] = { open, close, enabled: true };
            }
            return acc;
          }, {...businessDays});

          setBusinessDays(hours);

          // Set form values
          form.reset({
            businessName: profile.name_company,
            description: profile.description,
            website: profile.website || "",
            socialMedia: {
              facebook: profile.facebook || "",
              instagram: profile.instagram || "",
              twitter: profile.x || "",
            },
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadExistingProfile();
  }, [userId, form]);

  const onSubmit = async (data: any) => {
    setIsLoading(true)
    try {
      if (!userId) {
        throw new Error("Usuario no autenticado");
      }

      console.log('Form data:', JSON.stringify(data, null, 2));
      console.log('User ID:', userId);

      // Format business hours into a string
      const formattedHours = Object.entries(businessDays)
        .map(([day, hours]) => {
          if (!hours.enabled) return `${day}: Closed`;
          return `${day}: ${hours.open} - ${hours.close}`;
        })
        .join('; ');

      console.log('Formatted hours:', formattedHours);

      // Validate required fields
      if (!data.businessName) {
        throw new Error("El nombre de la empresa es requerido");
      }
      if (!data.description) {
        throw new Error("La descripción es requerida");
      }

      const profileData = {
        client_id: userId,
        name_company: data.businessName.trim(),
        description: data.description.trim(),
        website: (data.website || "").trim(),
        instagram: (data.socialMedia?.instagram || "").trim(),
        facebook: (data.socialMedia?.facebook || "").trim(),
        x: (data.socialMedia?.twitter || "").trim(),
        opening_hours: formattedHours,
      };

      console.log('Profile data to send:', JSON.stringify(profileData, null, 2));

      const result = await createBusinessProfile(profileData);
      
      if (result.success) {
        setShowSuccessDialog(true);
      } else {
        console.error('Error details:', result.error);
        throw new Error(result.error || "Error al crear el perfil");
      }
    } catch (error: any) {
      console.error('Form submission error:', error);
      toast.error(error.message || "Error al actualizar el perfil");
    } finally {
      setIsLoading(false)
    }
  }

  // Verificar autenticación al cargar el componente
  useEffect(() => {
    if (!userId) {
      toast.error("Debes iniciar sesión para crear un perfil");
    }
  }, [userId]);

  const handleBusinessHourChange = (
    day: string,
    field: "open" | "close" | "enabled",
    value: string | boolean
  ) => {
    setBusinessDays((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }))
  }

  return (
    <>
      <div className="container mx-auto py-6">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Perfil de Empresa</CardTitle>
            <CardDescription>
              Configura la información de tu negocio que verán tus clientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Información Básica */}
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Información Básica</h3>
                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="businessName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre de la Empresa</FormLabel>
                          <FormControl>
                            <Input placeholder="Mi Empresa S.A." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono</FormLabel>
                          <FormControl>
                            <Input placeholder="+1234567890" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe tu empresa..."
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Esta descripción aparecerá en tu perfil público
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dirección</FormLabel>
                        <FormControl>
                          <Input placeholder="Calle Principal #123" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Contacto y Web */}
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Contacto y Web</h3>
                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="contacto@miempresa.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sitio Web</FormLabel>
                          <FormControl>
                            <Input placeholder="https://miempresa.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Redes Sociales */}
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Redes Sociales</h3>
                  <div className="grid gap-6 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="socialMedia.facebook"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Facebook</FormLabel>
                          <FormControl>
                            <Input placeholder="@miempresa" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="socialMedia.instagram"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Instagram</FormLabel>
                          <FormControl>
                            <Input placeholder="@miempresa" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="socialMedia.twitter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Twitter</FormLabel>
                          <FormControl>
                            <Input placeholder="@miempresa" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Horario de Atención */}
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Horario de Atención</h3>
                  <div className="space-y-4">
                    {Object.entries(businessDays).map(([day, hours]) => (
                      <div key={day} className="flex items-center gap-6">
                        <div className="w-32">
                          <Switch
                            checked={hours.enabled}
                            onCheckedChange={(checked) =>
                              handleBusinessHourChange(day, "enabled", checked)
                            }
                          />
                          <span className="ml-2 capitalize">{day}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <TimePicker
                            value={hours.open}
                            onChange={(value) =>
                              handleBusinessHourChange(day, "open", value)
                            }
                            disabled={!hours.enabled}
                          />
                          <span>a</span>
                          <TimePicker
                            value={hours.close}
                            onChange={(value) =>
                              handleBusinessHourChange(day, "close", value)
                            }
                            disabled={!hours.enabled}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar Cambios"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              ¡Perfil Actualizado!
            </DialogTitle>
            <DialogDescription>
              Tu perfil de empresa ha sido guardado exitosamente. Los cambios se reflejarán inmediatamente en tu perfil público.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button
              variant="secondary"
              onClick={() => setShowSuccessDialog(false)}
            >
              Entendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 