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
import { businessProfileSchema, type BusinessProfileFormValues } from "../schemas/business-profile"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TimePicker } from "@/components/ui/time-picker"
import { Switch } from "@/components/ui/switch"
import { useState, useEffect } from "react"
import { Loader2, CheckCircle2 } from "lucide-react"
import { createOrUpdateBusinessProfile, getBusinessProfile } from "@/lib/pocketbase"
import { useAuth } from "@clerk/nextjs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface BusinessHours {
  open: string
  close: string
  enabled: boolean
}

interface DaysConfig {
  [key: string]: BusinessHours
}

interface BusinessProfileFormProps {
  onboardingMode?: boolean;
}

const daysTranslations: { [key: string]: string } = {
  monday: "Lunes",
  tuesday: "Martes",
  wednesday: "Miércoles",
  thursday: "Jueves",
  friday: "Viernes",
  saturday: "Sábado",
  sunday: "Domingo",
}

export function BusinessProfileForm({ onboardingMode = false }: BusinessProfileFormProps) {
  const router = useRouter();
  const { userId } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [businessDays, setBusinessDays] = useState<DaysConfig>({
    monday: { open: "09:00", close: "18:00", enabled: true },
    tuesday: { open: "09:00", close: "18:00", enabled: true },
    wednesday: { open: "09:00", close: "18:00", enabled: true },
    thursday: { open: "09:00", close: "18:00", enabled: true },
    friday: { open: "09:00", close: "18:00", enabled: true },
    saturday: { open: "09:00", close: "14:00", enabled: true },
    sunday: { open: "09:00", close: "14:00", enabled: false }
  })

  const form = useForm<BusinessProfileFormValues>({
    resolver: zodResolver(businessProfileSchema),
    defaultValues: {
      name_company: "",
      description: "",
      opening_hours: "",
      instagram: "",
      facebook: "",
      website: "",
      x: "",
    },
  })

  // Cargar datos existentes
  useEffect(() => {
    async function loadExistingProfile() {
      if (!userId) {
        console.log('No hay usuario autenticado');
        return;
      }

      try {
        setIsLoading(true);
        const profile = await getBusinessProfile(userId);
        
        if (profile) {
          console.log('Perfil cargado:', profile);
          
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
            name_company: profile.name_company || "",
            description: profile.description || "",
            opening_hours: profile.opening_hours || "",
            instagram: profile.instagram || "",
            facebook: profile.facebook || "",
            website: profile.website || "",
            x: profile.x || "",
          });
        } else {
          console.log('No se encontró perfil existente');
        }
      } catch (error) {
        console.error('Error cargando perfil:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo cargar el perfil existente"
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadExistingProfile();
  }, [userId, form, toast]);

  const formatBusinessHours = () => {
    return Object.entries(businessDays)
      .map(([day, hours]) => {
        const translatedDay = daysTranslations[day];
        return `${translatedDay}: ${hours.enabled ? `${hours.open} - ${hours.close}` : 'Closed'}`;
      })
      .join('; ');
  };

  const onSubmit = async (data: BusinessProfileFormValues) => {
    if (!userId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debes iniciar sesión para guardar el perfil"
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Format business hours before sending
      const formattedHours = formatBusinessHours();
      
      const response = await createOrUpdateBusinessProfile(userId, {
        name_company: data.name_company,
        description: data.description,
        opening_hours: formattedHours,
        instagram: data.instagram,
        facebook: data.facebook,
        website: data.website,
        x: data.x,
      });

      if (response.success) {
        toast({
          title: onboardingMode ? "¡Configuración completada!" : "Perfil actualizado",
          description: onboardingMode 
            ? "Tu empresa ha sido configurada correctamente. Redirigiendo al dashboard..." 
            : "Los datos de tu empresa han sido actualizados",
        });

        if (onboardingMode) {
          setTimeout(() => {
            router.push('/dashboard');
          }, 1500);
        } else {
          setShowSuccessDialog(true);
        }
      }
    } catch (error) {
      console.error('Error guardando perfil:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Error al guardar los datos"
      });
    } finally {
      setIsLoading(false);
    }
  };

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

    // Update the opening_hours field in the form
    const formattedHours = formatBusinessHours();
    form.setValue("opening_hours", formattedHours);
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
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name_company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-200">Nombre de la Empresa</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Tu empresa" 
                            {...field} 
                            className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-200">Descripción</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe tu empresa"
                            className="bg-white/5 border-white/10 text-white placeholder:text-gray-400 min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <FormLabel className="text-gray-200">Horario de Atención</FormLabel>
                  <Card className="border-0 bg-white/5">
                    <CardContent className="p-6 space-y-4">
                      {Object.entries(daysTranslations).map(([day, label]) => (
                        <div key={day} className="grid grid-cols-[1fr,2fr,2fr,80px] gap-4 items-center">
                          <div className="font-medium text-gray-200">{label}</div>
                          <div className="flex items-center gap-2">
                            <TimePicker
                              value={businessDays[day].open}
                              onChange={(value) => handleBusinessHourChange(day, "open", value)}
                              disabled={!businessDays[day].enabled}
                              className="bg-white/5 border-white/10 text-white"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <TimePicker
                              value={businessDays[day].close}
                              onChange={(value) => handleBusinessHourChange(day, "close", value)}
                              disabled={!businessDays[day].enabled}
                              className="bg-white/5 border-white/10 text-white"
                            />
                          </div>
                          <Switch
                            checked={businessDays[day].enabled}
                            onCheckedChange={(checked) =>
                              handleBusinessHourChange(day, "enabled", checked)
                            }
                            className="data-[state=checked]:bg-blue-500"
                          />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <FormLabel className="text-gray-200">Redes Sociales</FormLabel>
                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="instagram"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Instagram</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="@tuempresa" 
                              {...field}
                              className="bg-white/5 border-white/10 text-white placeholder:text-gray-400" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="facebook"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Facebook</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="facebook.com/tuempresa" 
                              {...field}
                              className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                            />
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
                          <FormLabel className="text-gray-300">Sitio Web</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="www.tuempresa.com" 
                              {...field}
                              className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="x"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">X (Twitter)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="@tuempresa" 
                              {...field}
                              className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02]" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {onboardingMode ? "Completando configuración..." : "Guardando cambios..."}
                    </>
                  ) : (
                    onboardingMode ? "Completar Configuración" : "Guardar Cambios"
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